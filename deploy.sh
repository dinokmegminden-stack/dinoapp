#!/bin/bash
# deploy.sh
# Használat: ./deploy.sh "commit üzenet ide"
# Ha nem adsz üzenetet, automatikus időbélyeges üzenetet használ.

set -e  # ha bármelyik lépés hibára fut, a script leáll, nem pusholunk félkész állapotot

MSG="${1:-"Frissítés $(date '+%Y-%m-%d %H:%M')"}"

echo "📦 git add ..."
git add .

echo "📝 git commit -m \"$MSG\""
git commit -m "$MSG"

echo "🚀 git push ..."
git push

echo "✅ Kész, a Vercel deploy hamarosan elindul."
