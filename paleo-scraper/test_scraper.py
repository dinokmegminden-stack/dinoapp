"""Offline self-check for extract_links. Run: python test_scraper.py"""
from datetime import datetime, timezone
from scraper import extract_links, JUNK_PATTERNS, parse_date, date_near

HTML = """
<html><body>
  <article>
    <h2><a href="/news/new-dino-found">Új ragadozó dínót találtak Patagóniában</a></h2>
    <h2><a href="https://ex.com/news/t-rex-teeth">T. rex tooth study rewrites diet</a></h2>
    <a href="/tag/dinoszaurusz">dinoszaurusz</a>            <!-- junk: tag -->
    <a href="https://facebook.com/share">Megosztás</a>      <!-- junk: social -->
    <a href="/news/short">tiny</a>                          <!-- junk: title < 8 -->
    <h2><a href="/news/new-dino-found">Duplicate link</a></h2> <!-- dedupe -->
  </article>
</body></html>
"""


def test_extract():
    links = extract_links(HTML, "https://ex.com/list", selector="h2 a")
    urls = [u for _, u, _ in links]
    assert "https://ex.com/news/new-dino-found" in urls
    assert "https://ex.com/news/t-rex-teeth" in urls
    assert urls.count("https://ex.com/news/new-dino-found") == 1, "dedupe failed"
    assert len(links) == 2, f"expected 2 clean links, got {len(links)}: {urls}"


def test_junk():
    assert JUNK_PATTERNS.search("https://x.com/tag/dino")
    assert JUNK_PATTERNS.search("https://facebook.com/share")
    assert not JUNK_PATTERNS.search("https://ex.com/news/real-article")


def test_encoding_bytes():
    # utf-8 bytes with meta charset -> bs4 must decode é correctly, no mojibake
    html = (
        "<meta charset='utf-8'><article><h2>"
        "<a href='/n/kreta-idoszaki-lelet'>Új kréta időszaki őslény lelet</a>"
        "</h2></article>"
    ).encode("utf-8")
    (title, _, _), = extract_links(html, "https://ex.com", "h2 a")
    assert "kréta" in title and "�" not in title, title


def test_topic_filter():
    html = """<article>
      <h2><a href="/a/uszo-romanc">Úszó romancról szóló pletyka a héten</a></h2>
      <h2><a href="/a/uj-dino">Új dinoszaurusz fajt írtak le</a></h2>
    </article>"""
    links = extract_links(html, "https://ex.com", "h2 a", topic_filter=True)
    assert len(links) == 1 and "dino" in links[0][0].lower(), links


def test_parse_date():
    assert parse_date("2026-08-20T10:00:00Z").tzinfo is not None
    assert parse_date("2026-08-20T10:00:00+02:00").month == 8
    assert parse_date("2026-08-20").year == 2026  # date-only
    assert parse_date("") is None
    assert parse_date("garbage") is None


def test_date_near():
    html = """<article>
      <div class="card">
        <time datetime="2026-08-24">aug 24</time>
        <h2><a href="/a/x">Új dinoszaurusz lelet a héten</a></h2>
      </div></article>"""
    (_, _, d), = extract_links(html, "https://ex.com", "h2 a")
    assert d is not None and d.day == 24, d


if __name__ == "__main__":
    test_extract()
    test_junk()
    test_encoding_bytes()
    test_topic_filter()
    test_parse_date()
    test_date_near()
    print("OK")
