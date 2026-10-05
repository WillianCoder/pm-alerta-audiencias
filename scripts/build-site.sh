#!/usr/bin/env bash
# Copia só os arquivos públicos para _site/ (documentação, regras e scripts ficam de fora).
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf _site && mkdir -p _site
cp index.html admin.html privacidade.html termos.html sw.js manifest.webmanifest robots.txt ads.txt _headers _site/
cp -r assets _site/
touch _site/.nojekyll
echo "Site montado em _site/"
