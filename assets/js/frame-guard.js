// Bloqueia o site dentro de iframes de terceiros (clickjacking), mesmo no GitHub Pages.
if (window.top !== window.self) { try { window.top.location = window.self.location; } catch (e) { document.documentElement.style.display = 'none'; } }
