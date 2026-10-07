#!/usr/bin/env python3
"""Gera o Guia de audiências (guia/*.html), o sitemap.xml e as páginas ficam prontas para o Google.

Uso:  python3 scripts/gerar-guia.py
Para trocar o endereço do site (ex.: domínio próprio), altere SITE_URL e rode de novo.
Os textos ficam em scripts/guia_artigos.py.
"""
import html, json, os, sys
from datetime import date

sys.path.insert(0, os.path.dirname(__file__))
from guia_artigos import ARTIGOS  # noqa: E402

SITE_URL = 'https://williancoder.github.io/pm-alerta-audiencias/'
ATUALIZADO = 'outubro de 2026'
RAIZ = os.path.join(os.path.dirname(__file__), '..')
CSP_FILE = os.path.join(RAIZ, 'index.html')


def csp():
    s = open(CSP_FILE, encoding='utf-8').read()
    i = s.index('http-equiv="Content-Security-Policy" content="') + len('http-equiv="Content-Security-Policy" content="')
    return s[i:s.index('"', i)]


def pagina(titulo, desc, url, corpo, prefixo, extra_head=''):
    e = html.escape
    return f'''<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="{csp()}">
<title>{e(titulo)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{e(url)}">
<meta property="og:type" content="article"><meta property="og:title" content="{e(titulo)}"><meta property="og:description" content="{e(desc)}"><meta property="og:url" content="{e(url)}"><meta property="og:image" content="{SITE_URL}assets/img/icon-512.png"><meta property="og:locale" content="pt_BR">
<meta name="theme-color" content="#0b1f3a">
<link rel="icon" href="{prefixo}assets/img/icon.svg" type="image/svg+xml">
<link rel="stylesheet" href="{prefixo}assets/css/styles.css">
<script src="{prefixo}assets/js/frame-guard.js"></script>
<script src="{prefixo}assets/js/config.js"></script>
<script type="module" src="{prefixo}assets/js/guia.js"></script>
{extra_head}
</head>
<body class="admin">
<header class="top"><a class="brand" href="{prefixo}"><img src="{prefixo}assets/img/icon.svg" alt="" width="28" height="28"> Alerta Audiência</a><a class="top-link" href="{prefixo}guia/">Guia</a></header>
<main class="doc">
{corpo}
</main>
<footer class="foot"><a href="{prefixo}">Abrir o app</a><a href="{prefixo}guia/">Guia de audiências</a><a href="{prefixo}#/anuncie">Anuncie aqui</a><a href="{prefixo}sobre.html">Sobre e contato</a><a href="{prefixo}privacidade.html">Privacidade</a><a href="{prefixo}termos.html">Termos</a></footer>
</body>
</html>
'''


CTA = '''<aside class="card cta"><b>⚖️ Tem uma audiência marcada?</b><p>Cole a intimação no <b>Alerta Audiência</b>: o app organiza data, hora e local, te lembra no celular e mostra o que levar. Grátis para começar.</p><a class="btn primary" href="../#/cadastro">Organizar minha audiência</a></aside>'''
AVISO = f'<p class="muted small">Conteúdo informativo, atualizado em {ATUALIZADO}. Não substitui a orientação de um advogado ou da Defensoria Pública, que atende gratuitamente quem não pode pagar.</p>'


def main():
    os.makedirs(os.path.join(RAIZ, 'guia'), exist_ok=True)
    e = html.escape
    for a in ARTIGOS:
        url = f"{SITE_URL}guia/{a['slug']}.html"
        ld = {'@context': 'https://schema.org', '@type': 'Article', 'headline': a['titulo'], 'description': a['desc'],
              'inLanguage': 'pt-BR', 'dateModified': date.today().isoformat(), 'mainEntityOfPage': url,
              'publisher': {'@type': 'Organization', 'name': 'Alerta Audiência', 'logo': {'@type': 'ImageObject', 'url': SITE_URL + 'assets/img/icon-512.png'}}}
        partes = a['corpo'].split('<!--meio-->')
        corpo = (f'<p class="back"><a href="./">← Guia de audiências</a></p><article><h1>{e(a["titulo"])}</h1><p class="lead">{e(a["desc"])}</p>'
                 + partes[0] + '<div data-ad-pos="artigos"></div>' + ''.join(partes[1:]) + CTA + AVISO + '</article>')
        extra = '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False).replace('</', '<\\/') + '</script>'
        open(os.path.join(RAIZ, 'guia', a['slug'] + '.html'), 'w', encoding='utf-8').write(pagina(a['titulo'] + ' | Alerta Audiência', a['desc'], url, corpo, '../', extra))

    itens = ''.join(f'<a class="card guia-item" href="{a["slug"]}.html"><span>{a["icone"]}</span><div><b>{e(a["titulo"])}</b><small>{e(a["desc"])}</small></div></a>' for a in ARTIGOS)
    corpo = f'<h1>📚 Guia de audiências</h1><p class="lead">Explicações simples para quem recebeu uma intimação: o que acontece, como se preparar, o que levar e seus direitos.</p><div class="list">{itens}</div><div data-ad-pos="artigos"></div>{CTA}{AVISO}'
    open(os.path.join(RAIZ, 'guia', 'index.html'), 'w', encoding='utf-8').write(
        pagina('Guia de audiências: tire suas dúvidas | Alerta Audiência', 'Guia simples sobre audiências judiciais: conciliação, trabalhista, testemunha, audiência virtual, perícia do INSS e o que acontece se faltar.', SITE_URL + 'guia/', corpo, '../'))

    urls = ['', 'guia/', 'sobre.html', 'privacidade.html', 'termos.html'] + [f"guia/{a['slug']}.html" for a in ARTIGOS]
    hoje = date.today().isoformat()
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(f'  <url><loc>{SITE_URL}{u}</loc><lastmod>{hoje}</lastmod></url>\n' for u in urls) + '</urlset>\n'
    open(os.path.join(RAIZ, 'sitemap.xml'), 'w', encoding='utf-8').write(sm)
    print(f'{len(ARTIGOS)} artigos + índice + sitemap gerados.')


if __name__ == '__main__':
    main()
