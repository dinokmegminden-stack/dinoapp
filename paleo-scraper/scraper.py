#!/usr/bin/env python3
"""Paleontology/dinosaur news scraper.

Checks a list of EN/HU news sites, extracts new article titles + links,
dedupes against a seen-URL store, appends new entries to paleontology_news.json.

Run weekly (cron/Task Scheduler). See bottom of file for scheduling notes.

Deps: requests, beautifulsoup4
    pip install requests beautifulsoup4
"""

import json
import os
import re
import smtplib
import sys
import time
import urllib.parse
import urllib.robotparser
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage

import requests
from bs4 import BeautifulSoup

HERE = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(HERE, "paleontology_news.json")
SEEN_FILE = os.path.join(HERE, "seen_urls.json")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/125.0 Safari/537.36"
    ),
    "Accept-Language": "en,hu;q=0.8",
}

REQUEST_TIMEOUT = 20
DELAY_BETWEEN_SITES = 4  # seconds, be polite
DELAY_BETWEEN_ARTICLES = 1  # when fetching article pages for a date
CUTOFF_DAYS = 7  # keep only posts from the last week

# Each site: name, url, and an optional CSS selector for the article-link <a>.
# selector=None -> generic fallback (links inside <article> / heading tags).
# Selectors rot; the fallback catches most sites even when a selector breaks.
SITES = [
    # --- English ---
    {
        "name": "National Geographic",
        "url": "https://www.nationalgeographic.com/science/topic/dinosaur-and-fossils",
        "selector": "a[href*='/science/article/']",
    },
    {
        "name": "ScienceDaily",
        "url": "https://www.sciencedaily.com/news/fossils_ruins/paleontology/",
        "selector": "#featured .latest-head a, .latest-summary a",
    },
    {
        "name": "Sci.News",
        "url": "https://www.sci.news/paleontology",
        "selector": "h3.entry-title a, h2.entry-title a",
    },
    {
        "name": "Phys.org",
        "url": "https://phys.org/biology-news/paleontology/",
        "selector": "article .news-link, .sorted-article h3 a",
    },
    # --- Hungarian ---
    {
        "name": "Qubit.hu (dinoszaurusz)",
        "url": "https://qubit.hu/tag/dinoszaurusz",
        "selector": "h2 a, h3 a",
    },
    {
        "name": "Qubit.hu (paleontologia)",
        "url": "https://qubit.hu/tag/paleontologia",
        "selector": "h2 a, h3 a",
    },
    {
        "name": "Origo (tudomany)",
        "url": "https://www.origo.hu/tudomany",
        "selector": "h2 a, h3 a, article a",
        "topic_filter": True,
    },
    {
        "name": "Index (dinoszaurusz)",
        "url": "https://index.hu/24ora/?cimke=dinoszaurusz",
        "selector": "article h1 a, article h2 a, .cim a",
        "topic_filter": True,
    },
    {
        "name": "Paleotop",
        "url": "https://paleotop.hu/",
        "selector": "h2.entry-title a, h1.entry-title a, article a",
    },
    {
        "name": "HUN-REN (kereses)",
        "url": "https://hun-ren.hu/kereses?kereses=paleontol%C3%B3gia",
        "selector": None,
        "topic_filter": True,
    },
]

# Skip obvious non-article links caught by the generic fallback.
JUNK_PATTERNS = re.compile(
    r"(/tag/|/category/|/cimke/|/rovat/|/author/|/page/|/wp-|"
    r"//(www\.)?(facebook|twitter|x|instagram|youtube)\.com|"
    r"/privacy|/cookie|/subscribe|/newsletter|mailto:|javascript:|#)",
    re.IGNORECASE,
)


def load_json(path, default):
    if not os.path.exists(path):
        return default
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError) as e:
        print(f"  warn: could not read {path}: {e}", file=sys.stderr)
        return default


def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def robots_allows(session, url):
    """Best-effort robots.txt check. On any failure, allow (don't block on it)."""
    parts = urllib.parse.urlparse(url)
    robots_url = f"{parts.scheme}://{parts.netloc}/robots.txt"
    rp = urllib.robotparser.RobotFileParser()
    try:
        resp = session.get(robots_url, timeout=REQUEST_TIMEOUT)
        if resp.status_code != 200:
            return True
        rp.parse(resp.text.splitlines())
        return rp.can_fetch(HEADERS["User-Agent"], url)
    except Exception:
        return True


# Broad news sites (whole-site sections) need a topic filter or they return
# unrelated headlines. Keep only links whose title/url hit one of these.
RELEVANCE = re.compile(
    r"dino|dinosz|fossil|fosszil|\bslet|paleo|paleon|kihalt|"
    r"rextor|jura|kréta|kreta|triász|triasz|őslény|oslenj|"
    r"raptor|saurus|szaurusz|csontváz|csontvaz|lelet",
    re.IGNORECASE,
)


def parse_date(raw):
    """Parse an ISO-ish datetime string to an aware UTC datetime, or None."""
    if not raw:
        return None
    raw = raw.strip()
    # article:published_time is usually full ISO 8601; <time> may be date-only.
    candidate = raw.replace("Z", "+00:00")
    for text in (candidate, candidate[:10]):  # full, then date-only
        try:
            dt = datetime.fromisoformat(text)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except ValueError:
            continue
    return None


def date_near(anchor):
    """Look for a <time datetime> in the anchor's nearby container."""
    node = anchor
    for _ in range(3):  # walk up a few parents
        node = node.parent
        if node is None:
            break
        t = node.find("time")
        if t and t.get("datetime"):
            return parse_date(t["datetime"])
    return None


def extract_links(html, base_url, selector, topic_filter=False):
    """Return list of (title, absolute_url, list_date_or_None).

    html may be bytes; bs4 sniffs the charset (fixes mojibake).
    topic_filter=True keeps only paleo-relevant titles (for broad sites).
    list_date is a date scraped from the list page if present, else None.
    """
    soup = BeautifulSoup(html, "html.parser")
    anchors = []
    if selector:
        anchors = soup.select(selector)
    if not anchors:  # fallback: links inside articles / headings
        for tag in soup.select("article a, h1 a, h2 a, h3 a"):
            anchors.append(tag)

    seen_local = set()
    out = []
    for a in anchors:
        href = a.get("href")
        title = a.get_text(strip=True)
        if not href or not title or len(title) < 8:
            continue
        abs_url = urllib.parse.urljoin(base_url, href)
        abs_url = abs_url.split("#")[0]
        if JUNK_PATTERNS.search(abs_url):
            continue
        if not abs_url.startswith("http"):
            continue
        if abs_url in seen_local:
            continue
        if topic_filter and not RELEVANCE.search(title + " " + abs_url):
            continue
        seen_local.add(abs_url)
        out.append((title, abs_url, date_near(a)))
    return out


def get_article_date(session, url):
    """Fetch an article page and read its published date from meta/<time>."""
    try:
        resp = session.get(url, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
    except requests.RequestException:
        return None
    soup = BeautifulSoup(resp.content, "html.parser")
    for prop in ("article:published_time", "og:updated_time",
                 "article:modified_time"):
        m = soup.find("meta", attrs={"property": prop}) or \
            soup.find("meta", attrs={"name": prop})
        if m and m.get("content"):
            d = parse_date(m["content"])
            if d:
                return d
    t = soup.find("time")
    if t and t.get("datetime"):
        return parse_date(t["datetime"])
    return None


def scrape_site(session, site, seen, cutoff):
    print(f"[{site['name']}] {site['url']}")
    if not robots_allows(session, site["url"]):
        print("  skipped: robots.txt disallows")
        return []
    try:
        resp = session.get(site["url"], timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"  error: {e}", file=sys.stderr)
        return []

    links = extract_links(
        resp.content, site["url"], site.get("selector"),
        topic_filter=site.get("topic_filter", False),
    )
    print(f"  found {len(links)} candidate links")
    now = datetime.now(timezone.utc).isoformat()
    entries = []
    dropped_old = 0
    for title, url, list_date in links:
        if url in seen:  # already stored; don't refetch its date
            continue
        pub = list_date or get_article_date(session, url)
        if list_date is None:
            time.sleep(DELAY_BETWEEN_ARTICLES)  # we hit the article page
        # Keep if within the window. Unknown date -> keep (can't prove old).
        if pub is not None and pub < cutoff:
            dropped_old += 1
            continue
        entries.append({
            "timestamp": now,
            "site": site["name"],
            "title": title,
            "url": url,
            "publish_date": pub.isoformat() if pub else None,
        })
    print(f"  {len(entries)} within last {CUTOFF_DAYS}d "
          f"({dropped_old} older, dropped)")
    return entries


def send_email(entries):
    """Email a digest of new articles. No-op if SMTP env vars are unset.

    Env: SMTP_USER, SMTP_PASS (Gmail app password), MAIL_TO,
         SMTP_HOST (default smtp.gmail.com), SMTP_PORT (default 465).
    """
    user = os.environ.get("SMTP_USER")
    pw = os.environ.get("SMTP_PASS")
    to = os.environ.get("MAIL_TO", user)
    if not (user and pw and entries):
        return
    host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    port = int(os.environ.get("SMTP_PORT", "465"))

    by_site = {}
    for e in entries:
        by_site.setdefault(e["site"], []).append(e)
    lines = [f"{len(entries)} new paleontology/dino articles this week:\n"]
    for site, items in by_site.items():
        lines.append(f"\n== {site} ({len(items)}) ==")
        for e in items:
            date = (e["publish_date"] or "")[:10]
            lines.append(f"  {date}  {e['title']}\n     {e['url']}")

    msg = EmailMessage()
    msg["Subject"] = f"Paleo news: {len(entries)} new articles"
    msg["From"] = user
    msg["To"] = to
    msg.set_content("\n".join(lines))
    try:
        with smtplib.SMTP_SSL(host, port, timeout=REQUEST_TIMEOUT) as s:
            s.login(user, pw)
            s.send_message(msg)
        print(f"emailed digest to {to}")
    except Exception as e:
        print(f"email failed: {e}", file=sys.stderr)


def main():
    seen = set(load_json(SEEN_FILE, []))
    existing = load_json(OUTPUT_FILE, [])
    new_entries = []

    session = requests.Session()
    session.headers.update(HEADERS)
    cutoff = datetime.now(timezone.utc) - timedelta(days=CUTOFF_DAYS)

    for i, site in enumerate(SITES):
        for entry in scrape_site(session, site, seen, cutoff):
            seen.add(entry["url"])
            new_entries.append(entry)
        if i < len(SITES) - 1:
            time.sleep(DELAY_BETWEEN_SITES)

    if new_entries:
        save_json(OUTPUT_FILE, existing + new_entries)
        save_json(SEEN_FILE, sorted(seen))
        print(f"\n{len(new_entries)} new articles saved to {OUTPUT_FILE}")
        send_email(new_entries)
    else:
        print("\nNo new articles.")

    return new_entries


if __name__ == "__main__":
    main()


# --- Weekly scheduling ---------------------------------------------------
# Linux/macOS cron (Mondays 08:00):
#   0 8 * * 1  cd /path/to/paleo-scraper && /usr/bin/python3 scraper.py >> scrape.log 2>&1
#
# Windows Task Scheduler (PowerShell, run once to register):
#   $a = New-ScheduledTaskAction -Execute "python" -Argument "scraper.py" `
#          -WorkingDirectory "C:\Users\Ryzen\DinoApp\paleo-scraper"
#   $t = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At 8am
#   Register-ScheduledTask -TaskName "PaleoNewsScraper" -Action $a -Trigger $t
