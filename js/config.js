
/* ============================================================================
   MODULE 2: Clawri.Config (Themes, Macros, Labels & Default Showcase)
   ============================================================================ */
window.Clawri = window.Clawri || {};

Clawri.Config = (function() {
  const DEFAULT_LATEX_MACROS = String.raw`\newcommand{\R}{\mathbb{R}}
\newcommand{\C}{\mathbb{C}}
\newcommand{\Z}{\mathbb{Z}}
\newcommand{\Q}{\mathbb{Q}}
\newcommand{\F}{\mathbb{F}}
\newcommand{\N}{\mathbb{N}}
\newcommand{\K}{\mathbb{K}}
\newcommand{\Nz}{\mathbb{N}_0}
\newcommand{\Rn}{\mathbb{R}^{n}}
\newcommand{\Cn}{\mathbb{C}^{n}}
\newcommand{\Kn}{\mathbb{K}^{n}}
\newcommand{\An}{\mathbb{A}^{n}}
\newcommand{\En}{\mathbb{E}^{n}}
\newcommand{\Pn}{\mathbb{P}^{n}}
\newcommand{\A}{\mathbb{A}}
\newcommand{\E}{\mathbb{E}}
\newcommand{\Pro}{\mathbb{P}}
\newcommand{\uzero}{\cup \{0\}}
\newcommand{\zero}{\{0\}}
\newcommand{\mapsfrom}{\mathrel{\leftarrow\kern-3pt\shortmid}}

\newcommand{\id}{\operatorname{id}}
\newcommand{\End}{\operatorname{End}}
\newcommand{\Hom}[1]{\operatorname{Hom}(#1)}
\newcommand{\Bil}[1]{\operatorname{Bil}(#1)}
\newcommand{\Ann}{\operatorname{Ann}}
\newcommand{\Rad}{\operatorname{Rad}}
\newcommand{\Spec}[1]{\operatorname{Spec}\left\{#1\right\}}
\newcommand{\Specf}[2]{\operatorname{Spec}_{#1}\left\{#2\right\}}
\newcommand{\Zc}{\mathcal{Z}}
\newcommand{\Nil}{\operatorname{Nil}}
\newcommand{\rk}{\operatorname{rk}}
\newcommand{\codim}{\operatorname{codim}}
\newcommand{\giac}[1]{\operatorname{giac}\left(#1\right)}
\newcommand{\dist}[1]{\operatorname{dist}\left(#1\right)}
\newcommand{\Stab}[1]{\operatorname{Stab}\left(#1\right)}

\newcommand{\inv}[1]{#1^{-1}}
\newcommand{\Set}[1]{\left\{ #1 \right\}}
\newcommand{\rot}[1]{\rho_{#1}}
\newcommand{\Base}[1]{\left( #1 \right)}
\newcommand{\norm}[1]{\left\lVert #1 \right\rVert}
\newcommand{\scal}[2]{\left\langle #1, #2 \right\rangle}
\newcommand{\<}{\langle}
\renewcommand{\>}{\rangle}

\newcommand{\coly}[1]{\textcolor{#b48ead}{#1}}
\newcommand{\colb}[1]{\textcolor{#2563eb}{#1}}
\newcommand{\colg}[1]{\textcolor{#16a34a}{#1}}
\newcommand{\colm}[1]{\textcolor{#db2777}{#1}}

\newcommand{\oproj}[2]{\pi_{#1}\!\left(#2\right)}
\newcommand{\pproj}[3]{\pi_{#2}^{#1}\!\left(#3\right)}
\newcommand{\vect}[1]{\overrightarrow{#1}}
\newcommand{\diff}[2]{\frac{d#1}{d#2}}
\newcommand{\pdiff}[2]{\frac{\partial#1}{\partial#2}}

\newcommand{\calE}{\mathcal{E}}
\newcommand{\calB}{\mathcal{B}}
\newcommand{\calC}{\mathcal{C}}
\newcommand{\calO}{\mathcal{O}}
\newcommand{\U}{\mathcal{U}}
\newcommand{\SO}{\mathcal{SO}}
\newcommand{\SU}{\mathcal{SU}}
\newcommand{\Aff}{\mathcal{Aff}}

\newcommand{\Span}[1]{\operatorname{Span}\left\{#1\right\}}
\newcommand{\Spanf}[2]{\operatorname{Span}_{#1}\left\{#2\right\}}

\newcommand{\quotient}[2]{{^{\displaystyle #1}}/{_{\displaystyle #2}}}
\newcommand{\rquotient}[2]{{_{\displaystyle #1}}\backslash{^{\displaystyle #2}}}

\newcommand{\darrow}[2]{\overset{#1}{\underset{#2}{\longleftrightarrow}}}
\newcommand{\tot}[2]{\overset{#1}{\underset{#2}{\longrightarrow}}}
\newcommand{\restr}[2]{\left.#1\right|_{#2}}

\newcommand{\cvec}[1]{\begin{pmatrix}#1\end{pmatrix}}
\newcommand{\rvec}[1]{\begin{pmatrix}#1\end{pmatrix}}
\newcommand{\mat}[1]{\begin{pmatrix}#1\end{pmatrix}}
\newcommand{\system}[1]{\begin{cases}#1\end{cases}}
\newcommand{\braid}[2][]{\operatorname{Braid}(#2)}
\newcommand{\braidsmall}[2][]{\operatorname{Braid}(#2)}
\newcommand{\braidmed}[2][]{\operatorname{Braid}(#2)}`;

  const THEME_CLEAN_CSS = `:root {
    --bg: #fafaf9;
    --surface: #ffffff;
    --ink: #18181b;
    --ink-muted: #52525b;
    --ink-subtle: #a1a1aa;
    --accent: #0f172a;
    --border: #e4e4e7;
    --border-strong: #18181b;
    --font-serif: Georgia, 'Times New Roman', serif;
    --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --font-code: 'Fira Code', monospace;
}
* { box-sizing: border-box; }
html, body {
    margin: 0; padding: 0; width: 100%;
    background-color: var(--bg); color: var(--ink);
    font-family: var(--font-serif); font-size: 19px; line-height: 1.75;
    -webkit-font-smoothing: antialiased;
}
body { display: flex; flex-direction: column; align-items: center; min-height: 100vh; padding: 40px 20px; }
.article-wrapper { width: 100%; max-width: 720px; margin: 0 auto; display: flex; flex-direction: column; gap: 28px; position: relative; }
.top-nav { display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-bottom: 1px solid var(--border); font-family: var(--font-sans); }
.back-home { font-size: 12px; font-weight: 600; letter-spacing: 0.06em; color: var(--ink-muted); text-decoration: none; text-transform: uppercase; }
.back-home:hover { color: var(--ink); }
.nav-tag { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; color: var(--ink); background: #f4f4f5; border: 1px solid var(--border); padding: 3px 10px; border-radius: 3px; }
.article-header { display: flex; flex-direction: column; gap: 12px; padding-top: 8px; text-align: center; }
.post-title { font-family: var(--font-sans); font-size: 36px; font-weight: 700; color: var(--ink); margin: 0; line-height: 1.2; letter-spacing: -0.025em; }
.subtitle { font-family: var(--font-serif); font-size: 19px; color: var(--ink-muted); font-style: italic; margin-top: -4px; }
.post-meta { font-family: var(--font-sans); font-size: 13px; color: var(--ink-muted); display: flex; justify-content: center; align-items: center; gap: 18px; flex-wrap: wrap; }
.abstract-box { border-left: 3px solid var(--border-strong); background-color: var(--surface); padding: 18px 22px; margin: 8px 0 16px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.04); text-align: left; }
.abstract-label { font-family: var(--font-sans); font-size: 11px; font-weight: 700; letter-spacing: 0.08em; color: var(--ink-muted); text-transform: uppercase; display: block; margin-bottom: 6px; }
.abstract-text { font-style: italic; margin: 0; color: var(--ink); font-size: 17px; }
.article-content { font-size: 19px; color: var(--ink); position: relative; }
.article-content h2 { font-family: var(--font-sans); font-size: 24px; font-weight: 700; color: var(--ink); border-bottom: 1px solid var(--border); padding-bottom: 8px; margin-top: 42px; margin-bottom: 16px; }
.article-content h3 { font-family: var(--font-sans); font-size: 19px; font-weight: 600; color: var(--ink); margin-top: 30px; margin-bottom: 12px; }
.article-content p { margin-bottom: 22px; }
.article-content a { color: var(--ink); text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 4px; }
.article-content ul, .article-content ol { margin: 16px 0; padding-left: 28px; }
.article-content li { margin-bottom: 6px; }
blockquote.quote-box { margin: 30px 0; padding: 18px 24px; background-color: var(--surface); border-left: 3px solid var(--ink-muted); color: var(--ink); }
blockquote.quote-box p { margin: 0 0 8px 0; font-style: italic; font-size: 18px; }
blockquote.quote-box cite { display: block; font-style: normal; font-family: var(--font-sans); font-size: 12px; font-weight: 600; color: var(--ink-muted); text-align: right; }
.canto-container { counter-reset: verse-num; margin: 36px 0; display: flex; flex-direction: column; align-items: center; width: 100%; }
.stanza { margin-bottom: 32px; width: 100%; max-width: 600px; }
.stanza:last-of-type { margin-bottom: 0; }
.verse { counter-increment: verse-num; position: relative; text-align: center; font-size: 19px; line-height: 1.85; color: var(--ink); font-style: italic; padding: 0 45px; margin-bottom: 4px; }
.verse::before { content: counter(verse-num); position: absolute; left: 10px; top: 0; font-family: var(--font-sans); font-size: 11px; color: var(--ink-subtle); font-style: normal; opacity: 0.75; user-select: none; }
.canto-container.poem-every5 .verse::before { content: attr(data-vnum); }
.canto-container.poem-none .verse::before { display: none; }
.poem-attribution { margin-top: 18px; font-family: var(--font-sans); font-size: 12px; color: var(--ink-muted); text-align: center; }
figure.poem-box { margin: 34px 0; padding: 24px 28px; background-color: var(--surface); border: 1px solid var(--border); display: flex; flex-direction: column; gap: 16px; }
.poem-content { font-family: var(--font-serif); font-size: 18px; line-height: 1.9; color: var(--ink); font-style: italic; }
.verse-line { display: flex; align-items: baseline; gap: 16px; }
.verse-num { font-family: var(--font-sans); font-size: 11px; color: var(--ink-subtle); min-width: 22px; text-align: right; font-style: normal; }
.verse-divider { color: var(--ink-subtle); margin: 8px 0 8px 38px; font-style: normal; }
.poem-meta { font-family: var(--font-sans); font-size: 12px; color: var(--ink-muted); text-align: right; margin: 0; }
sup.fn-ref { font-family: var(--font-sans); font-size: 11px; font-weight: 600; margin-left: 2px; font-style: normal; }
sup.fn-ref a { color: var(--ink); text-decoration: none; }
figure.article-image { margin: 28px 0; display: flex; flex-direction: column; align-items: center; }
figure.article-image img { max-width: 100%; height: auto; border: 1px solid var(--border); }
figcaption { font-family: var(--font-sans); font-size: 13px; color: var(--ink-muted); margin-top: 8px; text-align: center; }
pre { background-color: #18181b !important; color: #f4f4f5; border-radius: 4px; padding: 16px; overflow-x: auto; margin: 24px 0; }
code { font-family: var(--font-code) !important; font-size: 0.88em !important; }
.clawri-inline-code { background: rgba(100, 116, 139, 0.12); color: inherit; padding: 1px 6px; border-radius: 4px; font-family: var(--font-code); font-size: 0.86em; border: none; }
.clawri-pill { display: inline-block; padding: 1px 8px; border-radius: 999px; background: rgba(59, 130, 246, 0.12); color: #1d4ed8; font-family: var(--font-sans); font-size: 0.8em; font-weight: 600; border: none; }
.clawri-tag { display: inline-block; padding: 1px 7px; border-radius: 4px; background: rgba(100, 116, 139, 0.14); color: inherit; font-family: var(--font-sans); font-size: 0.8em; font-weight: 600; border: none; }
.clawri-kbd { display: inline-block; padding: 1px 6px; border-radius: 4px; background: rgba(100, 116, 139, 0.14); font-family: var(--font-code); font-size: 0.82em; border: none; }
.section-title-box { font-family: var(--font-sans); font-size: 12px; font-weight: 700; letter-spacing: 0.08em; color: var(--ink-muted); text-transform: uppercase; border-bottom: 1px solid var(--border); padding-bottom: 8px; margin-top: 44px; margin-bottom: 16px; }
.footnotes { font-size: 15px; color: var(--ink-muted); }
.footnotes ol { padding-left: 20px; }
.footnotes li { margin-bottom: 8px; }
.fn-backlink { font-family: var(--font-sans); font-size: 11px; color: var(--ink); text-decoration: none; margin-left: 6px; }
.fn-overlay { display: none; position: fixed; bottom: 0; left: 0; width: 100%; background: var(--surface); border-top: 2px solid var(--border-strong); padding: 16px; z-index: 9999; box-shadow: 0 -4px 20px rgba(0,0,0,0.08); }
.fn-overlay-content { max-width: 720px; margin: 0 auto; }
.fn-overlay-header { display: flex; justify-content: space-between; font-family: var(--font-sans); font-size: 11px; font-weight: 700; margin-bottom: 8px; }
.fn-overlay-close { background: none; border: 1px solid var(--border); padding: 3px 8px; cursor: pointer; font-size: 11px; }
@media (min-width: 1280px) {
    .sidenote-desktop { position: absolute; right: -260px; width: 230px; font-family: var(--font-sans); font-size: 13px; line-height: 1.45; color: var(--ink-muted); border-left: 2px solid var(--border); padding: 4px 12px; text-align: left; font-style: normal; z-index: 10; }
    .sidenote-num { font-weight: 700; font-size: 11px; color: var(--ink); display: block; margin-bottom: 2px; }
}
.article-footer { margin-top: 48px; padding-top: 18px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; font-family: var(--font-sans); font-size: 12px; color: var(--ink-muted); }
.article-footer a { color: var(--ink); text-decoration: none; }
@media (max-width: 600px) { .post-title { font-size: 28px; } .verse { font-size: 17px; padding: 0 28px; } .verse::before { left: 0; } }
@media print { body { background: #fff; padding: 0; } .top-nav, .fn-overlay, .clawri-pdf-btn-wrap { display: none !important; } }`;

  const THEME_RETRO_CSS = `:root {
    --ut-bg: #000000; --ut-white: #ffffff; --ut-text-body: #e0e0e0; --ut-yellow: #ffff00;
    --ut-orange: #ff7f00; --ut-cyan: #00ffff; --ut-gray: #888888; --ut-dark-box: #080808;
    --font-body: 'Century Gothic', -apple-system, BlinkMacSystemFont, sans-serif;
    --font-ui: 'Press Start 2P', monospace; --font-pixel: 'VT323', monospace; --font-code: 'Fira Code', monospace;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; width: 100%; background-color: var(--ut-bg); color: var(--ut-text-body); font-family: var(--font-body); font-size: 18px; line-height: 1.65; }
body { display: flex; flex-direction: column; align-items: center; min-height: 100vh; padding: 24px 16px; }
.article-wrapper { width: 100%; max-width: 820px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; position: relative; }
.top-nav { display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-bottom: 2px solid var(--ut-white); }
.back-home { font-family: var(--font-ui); font-size: 11px; color: var(--ut-orange); text-decoration: none; text-transform: uppercase; }
.nav-tag { font-family: var(--font-ui); font-size: 9px; color: var(--ut-cyan); border: 1px solid var(--ut-cyan); padding: 4px 8px; }
.article-header { display: flex; flex-direction: column; gap: 12px; padding-top: 8px; text-align: center; }
.post-title { font-family: var(--font-body); font-size: 32px; font-weight: bold; color: var(--ut-white); margin: 0; }
.subtitle { font-size: 18px; color: var(--ut-cyan); font-style: italic; margin-top: -4px; }
.post-meta { font-family: var(--font-ui); font-size: 10px; color: var(--ut-gray); display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; }
.post-meta time { color: var(--ut-yellow); }
.abstract-box { border: 2px solid var(--ut-white); background-color: var(--ut-dark-box); padding: 18px 22px; margin: 12px 0 20px 0; text-align: left; }
.abstract-label { font-family: var(--font-ui); font-size: 10px; color: var(--ut-yellow); text-transform: uppercase; display: block; margin-bottom: 8px; }
.abstract-text { font-style: italic; margin: 0; color: #ffffff; font-size: 17px; }
.article-content { font-size: 18px; color: var(--ut-text-body); position: relative; }
.article-content h2 { font-size: 24px; color: var(--ut-white); border-bottom: 1px dashed var(--ut-gray); padding-bottom: 6px; margin-top: 36px; margin-bottom: 16px; }
.article-content h3 { font-size: 20px; color: var(--ut-yellow); margin-top: 28px; margin-bottom: 12px; }
.article-content p { margin-bottom: 20px; }
.article-content a { color: var(--ut-cyan); text-decoration: underline; text-underline-offset: 4px; }
.article-content ul, .article-content ol { margin: 16px 0; padding-left: 28px; }
.article-content li { margin-bottom: 6px; }
.clawri-inline-code { background: rgba(0, 255, 255, 0.14); color: var(--ut-cyan); padding: 1px 6px; border-radius: 3px; font-family: var(--font-code); font-size: 0.86em; }
.clawri-pill { display: inline-block; padding: 1px 8px; border-radius: 999px; background: rgba(255, 255, 0, 0.18); color: var(--ut-yellow); font-size: 0.8em; font-weight: 700; }
.clawri-tag { display: inline-block; padding: 1px 7px; border-radius: 3px; background: rgba(0, 255, 255, 0.16); color: var(--ut-cyan); font-size: 0.8em; font-weight: 700; }
.clawri-kbd { display: inline-block; padding: 1px 6px; border-radius: 3px; background: #1e293b; color: #f8fafc; font-family: var(--font-code); font-size: 0.82em; }
blockquote.quote-box { margin: 28px 0; padding: 18px 22px; background-color: var(--ut-dark-box); border-left: 4px solid var(--ut-cyan); color: var(--ut-white); }
blockquote.quote-box cite { display: block; font-style: normal; font-family: var(--font-ui); font-size: 10px; color: var(--ut-yellow); text-align: right; }
.canto-container { counter-reset: verse-num; margin: 36px 0; display: flex; flex-direction: column; align-items: center; width: 100%; }
.stanza { margin-bottom: 32px; width: 100%; max-width: 600px; }
.verse { counter-increment: verse-num; position: relative; text-align: center; font-size: 19px; line-height: 1.85; color: var(--ut-white); font-style: italic; padding: 0 45px; margin-bottom: 4px; }
.verse::before { content: counter(verse-num); position: absolute; left: 10px; top: 0; font-family: var(--font-ui); font-size: 9px; color: var(--ut-gray); font-style: normal; }
.canto-container.poem-every5 .verse::before { content: attr(data-vnum); }
.canto-container.poem-none .verse::before { display: none; }
.poem-attribution { margin-top: 18px; font-family: var(--font-ui); font-size: 10px; color: var(--ut-yellow); text-align: center; }
figure.poem-box { margin: 32px 0; padding: 22px 26px; background-color: var(--ut-dark-box); border: 1px solid #222; border-left: 4px solid var(--ut-orange); }
.poem-content { font-size: 17px; line-height: 1.85; color: var(--ut-white); font-style: italic; }
.verse-line { display: flex; align-items: baseline; gap: 14px; }
.verse-num { font-family: var(--font-ui); font-size: 8px; color: var(--ut-gray); min-width: 22px; text-align: right; font-style: normal; }
.verse-divider { color: var(--ut-gray); margin: 6px 0 6px 36px; }
.poem-meta { font-family: var(--font-ui); font-size: 10px; color: var(--ut-yellow); text-align: right; margin: 10px 0 0 0; }
sup.fn-ref { font-family: var(--font-ui); font-size: 10px; margin-left: 2px; }
sup.fn-ref a { color: var(--ut-yellow); text-decoration: none; }
figure.article-image { margin: 28px 0; display: flex; flex-direction: column; align-items: center; }
figure.article-image img { max-width: 100%; height: auto; border: 2px solid var(--ut-white); }
figcaption { font-family: var(--font-pixel); font-size: 19px; color: var(--ut-gray); margin-top: 8px; text-align: center; }
pre { background-color: var(--ut-dark-box) !important; border: 2px solid var(--ut-white); padding: 16px; overflow-x: auto; margin: 24px 0; }
code { font-family: var(--font-code) !important; font-size: 15px !important; }
.mjx-chtml { color: var(--ut-white) !important; }
.section-title-box { font-family: var(--font-ui); font-size: 11px; color: var(--ut-yellow); text-transform: uppercase; border-bottom: 2px solid var(--ut-white); padding-bottom: 8px; margin-top: 40px; margin-bottom: 16px; }
.footnotes { margin-top: 20px; font-size: 16px; }
.fn-backlink { font-family: var(--font-ui); font-size: 9px; color: var(--ut-cyan); text-decoration: none; margin-left: 6px; }
.fn-overlay { display: none; position: fixed; bottom: 0; left: 0; width: 100%; background: rgba(0,0,0,0.95); border-top: 3px solid var(--ut-yellow); padding: 16px; z-index: 9999; }
.fn-overlay-content { max-width: 800px; margin: 0 auto; }
.fn-overlay-header { display: flex; justify-content: space-between; font-family: var(--font-ui); font-size: 10px; color: var(--ut-yellow); margin-bottom: 8px; }
.fn-overlay-close { background: none; border: 1px solid var(--ut-white); color: var(--ut-white); font-family: var(--font-ui); font-size: 9px; padding: 4px 8px; cursor: pointer; }
@media (min-width: 1350px) {
    .sidenote-desktop { position: absolute; right: -270px; width: 240px; font-size: 14px; line-height: 1.4; color: var(--ut-gray); border-left: 2px solid var(--ut-yellow); background-color: var(--ut-dark-box); padding: 8px 10px; text-align: left; z-index: 10; }
    .sidenote-num { font-family: var(--font-ui); font-size: 9px; color: var(--ut-yellow); display: block; margin-bottom: 4px; }
}
.article-footer { margin-top: 40px; padding-top: 16px; border-top: 2px solid var(--ut-white); display: flex; justify-content: space-between; font-family: var(--font-ui); font-size: 10px; color: var(--ut-gray); }
.article-footer a { color: var(--ut-cyan); text-decoration: none; }`;

  const THEME_PDF_PAPER_CSS = `:root {
    --bg: #e5e7eb; --surface: #ffffff; --ink: #111827; --ink-muted: #4b5563; --ink-subtle: #6b7280;
    --border: #d1d5db; --border-strong: #111827;
    --font-serif: 'Latin Modern Roman', 'CMU Serif', 'Times New Roman', Georgia, serif;
    --font-sans: 'Times New Roman', Georgia, serif; --font-code: 'Fira Code', monospace;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; width: 100%; background: var(--bg); color: var(--ink); font-family: var(--font-serif); font-size: 16px; line-height: 1.65; }
body { display: flex; flex-direction: column; align-items: center; padding: 28px 16px; }
.article-wrapper { width: 100%; max-width: 794px; background: var(--surface); padding: 64px 72px; box-shadow: 0 10px 30px rgba(0,0,0,0.12); border: 1px solid #d1d5db; }
.top-nav { display: none; }
.article-header { text-align: center; border-bottom: 1.5px solid var(--border-strong); padding-bottom: 18px; margin-bottom: 24px; }
.post-title { font-size: 28px; font-weight: 700; margin: 0 0 6px 0; }
.subtitle { font-size: 16px; font-style: italic; color: var(--ink-muted); margin-bottom: 8px; }
.post-meta { font-size: 13px; color: var(--ink-muted); display: flex; justify-content: center; gap: 20px; }
.abstract-box { margin: 18px 32px 26px 32px; padding: 12px 18px; border-top: 1px solid var(--border-strong); border-bottom: 1px solid var(--border-strong); background: #fafafa; font-size: 14.5px; }
.abstract-label { font-weight: 700; text-transform: uppercase; font-size: 11px; letter-spacing: 0.08em; display: block; text-align: center; margin-bottom: 4px; }
.abstract-text { margin: 0; text-align: justify; }
.article-content { text-align: justify; }
.article-content h2 { font-size: 19px; font-weight: 700; margin: 28px 0 10px 0; border-bottom: 1px solid var(--border); padding-bottom: 4px; }
.article-content h3 { font-size: 16.5px; font-weight: 700; margin: 20px 0 8px 0; }
.article-content p { margin: 0 0 14px 0; }
.article-content ul, .article-content ol { margin: 12px 0; padding-left: 26px; }
.clawri-inline-code { background: #f3f4f6; padding: 1px 5px; border-radius: 3px; font-family: var(--font-code); font-size: 0.86em; }
.clawri-pill { display: inline-block; padding: 1px 8px; border-radius: 999px; background: #e5e7eb; font-size: 0.8em; font-weight: 600; }
.clawri-tag { display: inline-block; padding: 1px 6px; border-radius: 3px; background: #f3f4f6; font-size: 0.8em; font-weight: 600; }
.clawri-kbd { display: inline-block; padding: 1px 6px; border-radius: 3px; background: #f3f4f6; font-family: var(--font-code); font-size: 0.82em; }
.footnotes { margin-top: 36px; padding-top: 10px; border-top: 1px solid var(--border-strong); font-size: 13px; }
.footnotes ol { padding-left: 18px; }
.sidenote-desktop { display: none !important; }
.article-footer { margin-top: 36px; padding-top: 10px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; font-size: 11px; color: var(--ink-muted); }
@page { size: A4; margin: 20mm; }
@media print { body { background: #fff; padding: 0; } .article-wrapper { box-shadow: none; border: none; padding: 0; max-width: 100%; } .clawri-pdf-btn-wrap { display: none !important; } }`;

  const THEME_PDF_DISPENSE_CSS = `:root {
    --bg: #e5e7eb; --surface: #ffffff; --ink: #111827; --ink-muted: #4b5563; --ink-subtle: #6b7280;
    --red-accent: #991b1b; --blue-accent: #1d4ed8; --green-accent: #15803d; --yellow-accent: #a16207;
    --gray-frame: #4b5563; --border: #d1d5db;
    --font-serif: 'Latin Modern Roman', 'CMU Serif', Georgia, serif;
    --font-sans: 'Fira Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    --font-code: 'Fira Code', monospace;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; width: 100%; background: var(--bg); color: var(--ink); font-family: var(--font-serif); font-size: 16px; line-height: 1.58; }
body { display: flex; flex-direction: column; align-items: center; padding: 24px 14px; }
.article-wrapper { width: 100%; max-width: 794px; background: var(--surface); padding: 38px 46px; box-shadow: 0 10px 30px rgba(0,0,0,0.12); border: 1px solid #cbd5e1; }
.top-nav { display: none; }
.article-header { display: flex; flex-direction: row; align-items: flex-end; gap: 20px; text-align: left; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb; }
.article-header[data-tag]:not([data-tag=""])::before { content: attr(data-tag); font-family: var(--font-sans); font-size: 64px; font-weight: 800; line-height: 0.88; color: var(--red-accent); flex-shrink: 0; letter-spacing: -0.03em; }
.header-main-group { display: flex; flex-direction: column; gap: 3px; }
.post-title { font-family: var(--font-sans); font-size: 25px; font-weight: 700; color: var(--ink); margin: 0; line-height: 1.18; }
.subtitle { font-family: var(--font-sans); font-size: 18px; font-weight: 700; font-style: normal; color: #1f2937; margin: 0; line-height: 1.2; }
.post-meta { font-family: var(--font-sans); font-size: 11.5px; color: var(--ink-muted); display: flex; justify-content: flex-start; gap: 14px; margin-top: 4px; }
.article-content { text-align: justify; }
.article-content p { margin: 0 0 10px 0; }
.article-content ul, .article-content ol { margin: 12px 0; padding-left: 26px; }
.clawri-inline-code { background: #f3f4f6; padding: 1px 5px; border-radius: 3px; font-family: var(--font-code); font-size: 0.86em; }
.clawri-pill { display: inline-block; padding: 1px 8px; border-radius: 999px; background: #fee2e2; color: var(--red-accent); font-family: var(--font-sans); font-size: 0.8em; font-weight: 700; }
.clawri-tag { display: inline-block; padding: 1px 6px; border-radius: 3px; background: #f3f4f6; font-family: var(--font-sans); font-size: 0.8em; font-weight: 600; }
.clawri-kbd { display: inline-block; padding: 1px 6px; border-radius: 3px; background: #f3f4f6; font-family: var(--font-code); font-size: 0.82em; }
.article-content h2 { font-family: var(--font-sans); font-size: 18.5px; font-weight: 700; color: var(--red-accent); border-bottom: 1.5px solid #fecaca; padding-bottom: 3px; margin: 24px 0 12px 0; }
.article-content h3 { font-family: var(--font-sans); font-size: 16px; font-weight: 700; color: var(--ink); margin: 18px 0 8px 0; }
.clawri-thm { position: relative; margin: 24px 0 18px 0 !important; padding: 16px 14px 11px 14px !important; border-radius: 0 4px 4px 4px !important; border: 1px solid var(--blue-accent) !important; background: #eff6ff !important; }
.clawri-thm-title { position: absolute; top: -11px; left: 8px; padding: 1px 9px; font-family: var(--font-sans); font-size: 12.5px; font-weight: 700; line-height: 1.35; background: #dbeafe; color: var(--blue-accent); border: 1px solid var(--blue-accent); border-radius: 0; }
.clawri-theorem, .clawri-corollary { background: #eff6ff !important; border-color: var(--blue-accent) !important; }
.clawri-theorem .clawri-thm-title, .clawri-corollary .clawri-thm-title { background: #dbeafe; color: var(--blue-accent); border-color: var(--blue-accent); }
.clawri-definition { background: #fef2f2 !important; border-color: var(--red-accent) !important; }
.clawri-definition .clawri-thm-title { background: #fee2e2; color: var(--red-accent); border-color: var(--red-accent); }
.clawri-proposition { background: #f0fdf4 !important; border-color: var(--green-accent) !important; }
.clawri-proposition .clawri-thm-title { background: #dcfce7; color: var(--green-accent); border-color: var(--green-accent); }
.clawri-lemma { background: #fefce8 !important; border-color: var(--yellow-accent) !important; }
.clawri-lemma .clawri-thm-title { background: #fef9c3; color: var(--yellow-accent); border-color: var(--yellow-accent); }
.clawri-box { position: relative; margin: 24px 0 18px 0 !important; padding: 16px 14px 11px 14px !important; border: 1px solid var(--gray-frame) !important; background: #f9fafb !important; color: var(--ink) !important; border-radius: 0 4px 4px 4px !important; }
.clawri-box-title { position: absolute; top: -11px; left: 16px; padding: 1px 9px; font-family: var(--font-sans); font-size: 12px; font-weight: 700; font-variant: small-caps; letter-spacing: 0.03em; background: #e5e7eb; color: #111827; border: 1px solid var(--gray-frame); margin: 0 !important; }
.clawri-solution { background: #f3f4f6 !important; border: none !important; border-left: 5px solid var(--red-accent) !important; border-radius: 0 !important; padding: 10px 14px !important; margin: 14px 0 18px 0 !important; }
.clawri-solution summary { font-family: var(--font-sans); font-size: 13px; color: var(--red-accent); }
blockquote.quote-box { position: relative; background: #ffffff !important; border: 1.5px solid var(--red-accent) !important; border-radius: 0 !important; padding: 14px 26px !important; margin: 20px 0 !important; color: var(--ink) !important; }
blockquote.quote-box::before { content: "“"; position: absolute; top: -6px; left: 5px; font-family: Georgia, serif; font-size: 40px; line-height: 1; color: var(--red-accent); font-weight: 700; }
blockquote.quote-box::after { content: "”"; position: absolute; bottom: -20px; right: 6px; font-family: Georgia, serif; font-size: 40px; line-height: 1; color: var(--red-accent); font-weight: 700; }
.sidenote-desktop { display: none !important; }
.article-footer { display: none; }
@page { size: A4; margin: 12mm; }
@media print { body { background: #fff; padding: 0; } .article-wrapper { box-shadow: none; border: none; padding: 0; max-width: 100%; } .clawri-pdf-btn-wrap { display: none !important; } }`;

  const THEME_PDF_EXAM_CSS = `:root {
    --bg: #e5e7eb; --surface: #ffffff; --ink: #0f172a; --ink-muted: #475569;
    --border: #94a3b8; --border-strong: #0f172a;
    --font-serif: 'Times New Roman', Georgia, serif; --font-sans: Arial, Helvetica, sans-serif; --font-code: 'Fira Code', monospace;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: var(--bg); color: var(--ink); font-family: var(--font-sans); font-size: 15px; line-height: 1.55; }
body { display: flex; flex-direction: column; align-items: center; padding: 24px 14px; }
.article-wrapper { width: 100%; max-width: 794px; background: var(--surface); padding: 44px 54px; box-shadow: 0 10px 30px rgba(0,0,0,0.12); border: 1px solid var(--border); }
.top-nav { display: none; }
.article-header { border: 2px solid var(--border-strong); padding: 14px 18px; margin-bottom: 22px; text-align: left; }
.post-title { font-size: 22px; font-weight: 700; text-transform: uppercase; margin: 0 0 4px 0; }
.subtitle { font-size: 14px; color: var(--ink-muted); margin-bottom: 10px; }
.post-meta { display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; border-top: 1px solid var(--border); padding-top: 8px; }
.article-header::after { content: "STUDENT NAME: ____________________________________   CLASS: ________   SCORE: _____ / _____"; display: block; margin-top: 12px; padding-top: 10px; border-top: 1px dashed var(--border); font-size: 12px; font-weight: 700; letter-spacing: 0.03em; }
.article-content h2 { font-size: 16px; text-transform: uppercase; background: #f1f5f9; padding: 5px 10px; border-left: 4px solid var(--border-strong); margin: 22px 0 10px 0; }
.article-content p { margin: 0 0 12px 0; }
.article-content ul, .article-content ol { margin: 12px 0; padding-left: 26px; }
.clawri-inline-code { background: #f1f5f9; padding: 1px 5px; border-radius: 3px; font-family: var(--font-code); font-size: 0.86em; }
.clawri-pill { display: inline-block; padding: 1px 8px; border-radius: 999px; background: #e2e8f0; font-size: 0.8em; font-weight: 700; }
.clawri-tag { display: inline-block; padding: 1px 6px; border-radius: 3px; background: #f1f5f9; font-size: 0.8em; font-weight: 700; }
.clawri-kbd { display: inline-block; padding: 1px 6px; border-radius: 3px; background: #f1f5f9; font-family: var(--font-code); font-size: 0.82em; }
.sidenote-desktop { display: none !important; }
.article-footer { margin-top: 32px; padding-top: 8px; border-top: 1px solid var(--border-strong); display: flex; justify-content: space-between; font-size: 11px; }
@page { size: A4; margin: 15mm; }
@media print { body { background: #fff; padding: 0; } .article-wrapper { box-shadow: none; border: none; padding: 0; max-width: 100%; } .clawri-pdf-btn-wrap { display: none !important; } }`;

  const THEME_PDF_WORKSHEET_CSS = `:root {
    --bg: #e2e8f0; --surface: #ffffff; --ink: #1e293b; --ink-muted: #475569;
    --accent: #1d4ed8; --border: #cbd5e1;
    --font-serif: 'Latin Modern Roman', Georgia, serif;
    --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --font-code: 'Fira Code', monospace;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: var(--bg); color: var(--ink); font-family: var(--font-serif); font-size: 16px; line-height: 1.6; }
body { display: flex; flex-direction: column; align-items: center; padding: 24px 14px; }
.article-wrapper { width: 100%; max-width: 794px; background: var(--surface); padding: 50px 60px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
.top-nav { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--accent); padding-bottom: 8px; margin-bottom: 18px; font-family: var(--font-sans); font-size: 11px; font-weight: 700; color: var(--accent); }
.back-home { display: none; }
.nav-tag { background: #eff6ff; border: 1px solid #bfdbfe; padding: 2px 8px; border-radius: 3px; }
.article-header { text-align: left; margin-bottom: 22px; }
.post-title { font-family: var(--font-sans); font-size: 26px; font-weight: 800; color: var(--ink); margin: 0 0 4px 0; }
.subtitle { font-size: 15px; color: var(--ink-muted); font-style: italic; }
.post-meta { font-family: var(--font-sans); font-size: 12px; color: var(--ink-muted); display: flex; gap: 16px; margin-top: 6px; }
.article-content h2 { font-family: var(--font-sans); font-size: 18px; color: var(--accent); border-bottom: 1px solid var(--border); padding-bottom: 4px; margin-top: 26px; }
.article-content ul, .article-content ol { margin: 12px 0; padding-left: 26px; }
.clawri-inline-code { background: #f1f5f9; padding: 1px 5px; border-radius: 3px; font-family: var(--font-code); font-size: 0.86em; }
.clawri-pill { display: inline-block; padding: 1px 8px; border-radius: 999px; background: #dbeafe; color: var(--accent); font-family: var(--font-sans); font-size: 0.8em; font-weight: 700; }
.clawri-tag { display: inline-block; padding: 1px 6px; border-radius: 3px; background: #f1f5f9; font-family: var(--font-sans); font-size: 0.8em; font-weight: 600; }
.clawri-kbd { display: inline-block; padding: 1px 6px; border-radius: 3px; background: #f1f5f9; font-family: var(--font-code); font-size: 0.82em; }
.sidenote-desktop { display: none !important; }
.article-footer { margin-top: 34px; padding-top: 10px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; font-family: var(--font-sans); font-size: 11px; color: var(--ink-muted); }
@page { size: A4; margin: 18mm; }
@media print { body { background: #fff; padding: 0; } .article-wrapper { box-shadow: none; padding: 0; max-width: 100%; } .clawri-pdf-btn-wrap { display: none !important; } }`;

  const TEMPLATE_THUMBS = {
    clean: `<svg viewBox="0 0 220 90" xmlns="http://www.w3.org/2000/svg"><rect width="220" height="90" fill="#fafaf9"/><rect x="45" y="10" width="130" height="70" fill="#ffffff" stroke="#e4e4e7"/><line x1="65" y1="22" x2="155" y2="22" stroke="#18181b" stroke-width="3"/><line x1="80" y1="29" x2="140" y2="29" stroke="#71717a" stroke-width="1.5"/><rect x="58" y="37" width="104" height="12" fill="#f4f4f5" stroke="#18181b" stroke-width="0.6"/><line x1="58" y1="56" x2="162" y2="56" stroke="#a1a1aa" stroke-width="1.5"/><line x1="58" y1="62" x2="150" y2="62" stroke="#a1a1aa" stroke-width="1.5"/><line x1="58" y1="68" x2="158" y2="68" stroke="#a1a1aa" stroke-width="1.5"/></svg>`,
    retro: `<svg viewBox="0 0 220 90" xmlns="http://www.w3.org/2000/svg"><rect width="220" height="90" fill="#000000"/><rect x="35" y="8" width="150" height="74" fill="#080808" stroke="#ffffff" stroke-width="1.5"/><line x1="55" y1="20" x2="165" y2="20" stroke="#ffff00" stroke-width="3"/><line x1="75" y1="28" x2="145" y2="28" stroke="#00ffff" stroke-width="1.5"/><rect x="48" y="36" width="124" height="14" fill="#000" stroke="#ff7f00" stroke-width="1"/><line x1="48" y1="58" x2="170" y2="58" stroke="#e0e0e0" stroke-width="1.5"/><line x1="48" y1="65" x2="155" y2="65" stroke="#888888" stroke-width="1.5"/></svg>`,
    pdf_paper: `<svg viewBox="0 0 220 90" xmlns="http://www.w3.org/2000/svg"><rect width="220" height="90" fill="#e5e7eb"/><rect x="65" y="6" width="90" height="78" fill="#ffffff" stroke="#9ca3af"/><line x1="80" y1="16" x2="140" y2="16" stroke="#111827" stroke-width="2.5"/><line x1="75" y1="22" x2="145" y2="22" stroke="#111827" stroke-width="0.8"/><rect x="78" y="27" width="64" height="10" fill="#f9fafb" stroke="#d1d5db" stroke-width="0.5"/><line x1="74" y1="43" x2="146" y2="43" stroke="#6b7280" stroke-width="1.2"/><line x1="74" y1="49" x2="146" y2="49" stroke="#6b7280" stroke-width="1.2"/><line x1="74" y1="55" x2="138" y2="55" stroke="#6b7280" stroke-width="1.2"/><line x1="74" y1="72" x2="115" y2="72" stroke="#111827" stroke-width="0.7"/></svg>`,
    pdf_dispense: `<svg viewBox="0 0 220 90" xmlns="http://www.w3.org/2000/svg"><rect width="220" height="90" fill="#e5e7eb"/><rect x="58" y="5" width="104" height="80" fill="#ffffff" stroke="#cbd5e1"/><text x="67" y="24" fill="#991b1b" font-family="sans-serif" font-size="17" font-weight="800">10</text><line x1="90" y1="14" x2="150" y2="14" stroke="#111827" stroke-width="2.4"/><line x1="90" y1="21" x2="125" y2="21" stroke="#374151" stroke-width="1.8"/><rect x="67" y="31" width="86" height="14" rx="2" fill="#eff6ff" stroke="#1d4ed8" stroke-width="0.9"/><rect x="70" y="28" width="26" height="5" fill="#dbeafe" stroke="#1d4ed8" stroke-width="0.6"/><rect x="67" y="50" width="86" height="13" rx="2" fill="#fef2f2" stroke="#991b1b" stroke-width="0.9"/><rect x="70" y="47" width="28" height="5" fill="#fee2e2" stroke="#991b1b" stroke-width="0.6"/><rect x="67" y="68" width="86" height="10" fill="#f3f4f6"/><line x1="67" y1="68" x2="67" y2="78" stroke="#991b1b" stroke-width="2.5"/></svg>`,
    pdf_exam: `<svg viewBox="0 0 220 90" xmlns="http://www.w3.org/2000/svg"><rect width="220" height="90" fill="#e5e7eb"/><rect x="62" y="6" width="96" height="78" fill="#ffffff" stroke="#0f172a"/><rect x="70" y="12" width="80" height="16" fill="#f8fafc" stroke="#0f172a" stroke-width="1.2"/><line x1="75" y1="17" x2="130" y2="17" stroke="#0f172a" stroke-width="2"/><line x1="75" y1="23" x2="145" y2="23" stroke="#64748b" stroke-width="1"/><rect x="70" y="34" width="80" height="7" fill="#f1f5f9"/><line x1="70" y1="47" x2="148" y2="47" stroke="#475569" stroke-width="1.2"/><rect x="70" y="54" width="80" height="7" fill="#f1f5f9"/><line x1="70" y1="67" x2="142" y2="67" stroke="#475569" stroke-width="1.2"/></svg>`,
    pdf_worksheet: `<svg viewBox="0 0 220 90" xmlns="http://www.w3.org/2000/svg"><rect width="220" height="90" fill="#e2e8f0"/><rect x="64" y="6" width="92" height="78" fill="#ffffff" stroke="#cbd5e1"/><line x1="72" y1="14" x2="148" y2="14" stroke="#1d4ed8" stroke-width="1.8"/><line x1="72" y1="22" x2="132" y2="22" stroke="#1e293b" stroke-width="2.5"/><rect x="72" y="31" width="76" height="16" fill="#eff6ff" stroke="#93c5fd" stroke-width="0.8"/><rect x="72" y="52" width="76" height="16" fill="#f8fafc" stroke="#cbd5e1" stroke-width="0.8"/></svg>`,
    custom: `<svg viewBox="0 0 220 90" xmlns="http://www.w3.org/2000/svg"><rect width="220" height="90" fill="#16161e"/><rect x="40" y="10" width="140" height="70" fill="#1a1b26" stroke="#7aa2f7" stroke-dasharray="4 2"/><text x="110" y="49" fill="#7dcfff" font-family="monospace" font-size="12" text-anchor="middle">{ CUSTOM CSS }</text></svg>`
  };

  const BUILTIN_THEMES = [
    { key: "clean", kind: "WEB", name: "Clean Minimal", desc: "Light editorial blog layout with desktop sidenotes & mobile drawer.", css: THEME_CLEAN_CSS, thumb: TEMPLATE_THUMBS.clean },
    { key: "retro", kind: "WEB", name: "Retro Dark", desc: "Pitch-black terminal & pixel aesthetic with high-contrast accents.", css: THEME_RETRO_CSS, thumb: TEMPLATE_THUMBS.retro },
    { key: "pdf_paper", kind: "PDF", name: "PDF Academic Paper", desc: "LaTeX-inspired A4/Letter article layout with bottom footnotes.", css: THEME_PDF_PAPER_CSS, thumb: TEMPLATE_THUMBS.pdf_paper },
    { key: "pdf_dispense", kind: "PDF", name: "Notes", desc: "tcolorbox lecture notes: red chapter number, Fira Sans + Latin Modern.", css: THEME_PDF_DISPENSE_CSS, thumb: TEMPLATE_THUMBS.pdf_dispense },
    { key: "pdf_exam", kind: "PDF", name: "PDF Exam Sheet", desc: "Printable exam header with student name, class, score & exercises.", css: THEME_PDF_EXAM_CSS, thumb: TEMPLATE_THUMBS.pdf_exam },
    { key: "pdf_worksheet", kind: "PDF", name: "PDF Exercise Sheet", desc: "Structured problem set & worksheet template for math & sciences.", css: THEME_PDF_WORKSHEET_CSS, thumb: TEMPLATE_THUMBS.pdf_worksheet },
    { key: "custom", kind: "CUSTOM", name: "Custom CSS", desc: "Your own custom or uploaded CSS stylesheet.", css: THEME_CLEAN_CSS, thumb: TEMPLATE_THUMBS.custom }
  ];

  const LABEL_PRESETS = {
    en: { backIndex: "< [INDEX]", footerIndex: "[ INDEX ]", dateLabel: "DATE:", authorLabel: "AUTHOR:", abstractLabel: "* Author's Notes", footnotesTitle: "Footnotes", notePrefix: "* NOTE", closeBtn: "[X] CLOSE", licenseTitle: "* License", theoremLabel: "Theorem", lemmaLabel: "Lemma", propositionLabel: "Proposition", corollaryLabel: "Corollary", definitionLabel: "Definition", remarkLabel: "Remark", proofLabel: "Proof", exerciseLabel: "Exercise", solutionLabel: "Solution", indexTitle: "Analytical Index", bibliographyTitle: "Bibliography", pdfDownloadLabel: "Download PDF" },
    it: { backIndex: "< [INDICE]", footerIndex: "[ INDICE ]", dateLabel: "DATA:", authorLabel: "AUTORE:", abstractLabel: "* Note dell'Autore", footnotesTitle: "Note a piè di pagina", notePrefix: "* NOTA", closeBtn: "[X] CHIUDI", licenseTitle: "* Licenza", theoremLabel: "Teorema", lemmaLabel: "Lemma", propositionLabel: "Proposizione", corollaryLabel: "Corollario", definitionLabel: "Definizione", remarkLabel: "Osservazione", proofLabel: "Dimostrazione", exerciseLabel: "Esercizio", solutionLabel: "Soluzione", indexTitle: "Indice Analitico", bibliographyTitle: "Bibliografia", pdfDownloadLabel: "Scarica PDF" },
    fr: { backIndex: "< [INDEX]", footerIndex: "[ INDEX ]", dateLabel: "DATE :", authorLabel: "AUTEUR :", abstractLabel: "* Notes de l'auteur", footnotesTitle: "Notes de bas de page", notePrefix: "* NOTE", closeBtn: "[X] FERMER", licenseTitle: "* Licence", theoremLabel: "Théorème", lemmaLabel: "Lemme", propositionLabel: "Proposition", corollaryLabel: "Corollaire", definitionLabel: "Définition", remarkLabel: "Remarque", proofLabel: "Démonstration", exerciseLabel: "Exercice", solutionLabel: "Solution", indexTitle: "Index", bibliographyTitle: "Bibliographie", pdfDownloadLabel: "Télécharger le PDF" },
    de: { backIndex: "< [VERZEICHNIS]", footerIndex: "[ VERZEICHNIS ]", dateLabel: "DATUM:", authorLabel: "AUTOR:", abstractLabel: "* Anmerkungen", footnotesTitle: "Fußnoten", notePrefix: "* ANM.", closeBtn: "[X] SCHLIESSEN", licenseTitle: "* Lizenz", theoremLabel: "Satz", lemmaLabel: "Lemma", propositionLabel: "Proposition", corollaryLabel: "Korollar", definitionLabel: "Definition", remarkLabel: "Bemerkung", proofLabel: "Beweis", exerciseLabel: "Übung", solutionLabel: "Lösung", indexTitle: "Stichwortverzeichnis", bibliographyTitle: "Literaturverzeichnis", pdfDownloadLabel: "PDF herunterladen" },
    es: { backIndex: "< [ÍNDICE]", footerIndex: "[ ÍNDICE ]", dateLabel: "FECHA:", authorLabel: "AUTOR:", abstractLabel: "* Notas del autor", footnotesTitle: "Notas al pie", notePrefix: "* NOTA", closeBtn: "[X] CERRAR", licenseTitle: "* Licencia", theoremLabel: "Teorema", lemmaLabel: "Lema", propositionLabel: "Proposición", corollaryLabel: "Corolario", definitionLabel: "Definición", remarkLabel: "Observación", proofLabel: "Demostración", exerciseLabel: "Ejercicio", solutionLabel: "Solución", indexTitle: "Índice Analítico", bibliographyTitle: "Bibliografía", pdfDownloadLabel: "Descargar PDF" },
    la: { backIndex: "< [INDEX]", footerIndex: "[ INDEX ]", dateLabel: "DIES:", authorLabel: "AUCTOR:", abstractLabel: "* Praefatio Auctoris", footnotesTitle: "Adnotationes", notePrefix: "* NOTA", closeBtn: "[X] CLAUDE", licenseTitle: "* Licentia", theoremLabel: "Theorema", lemmaLabel: "Lemma", propositionLabel: "Propositio", corollaryLabel: "Corollarium", definitionLabel: "Definitio", remarkLabel: "Observatio", proofLabel: "Demonstratio", exerciseLabel: "Exercitium", solutionLabel: "Solutio", indexTitle: "Index Rerum", bibliographyTitle: "Bibliographia", pdfDownloadLabel: "PDF Deprime" }
  };

  const DEFAULT_SAMPLE_SOURCE = `\\title[MATH & POETRY]{Template}
\\subtitle{A Complete Showcase of Clawri v2.1}
\\author[Department of Mathematics]{Author Name}
\\date[Published]{2026/11/20}

\\abstract{Welcome to Clawri v2.1! Preview scrolling while typing or clicking is now disabled so you can inspect your layout peacefully. Try the hierarchical \\codeinline{:files} tree, borderless inline commands (\\pill{Pill}, \\tag{Tag}, \\kbd{Cmd+D}), Roman & numbered lists, and clipped 2D/3D plots with custom axis labels!}

\\section{1. Lists: Numbers, Lowercase Roman & Uppercase Roman}

\\begin{itemize}[numbers]
\\item Numbered item one (\\codeinline{[numbers]})
\\item Numbered item two with \\pill{borderless pill} and \\tag{clean tag}
\\end{itemize}

\\begin{itemize}[roman]
\\item Lowercase Roman item (\\codeinline{[roman]} or \\codeinline{[i]})
\\item Second lowercase Roman item
\\end{itemize}

\\begin{itemize}[Roman]
\\item Uppercase Roman item (\\codeinline{[Roman]} or \\codeinline{[I]})
\\item Second uppercase Roman item
\\end{itemize}

\\section{2. Clipped 2D & 3D Plots with Custom Axes, Grid & Numbering}

Notice how $f(x) = \\tan(x)$ and $g(x) = x^2 - 2$ cut sharply at the frame edge with zero flat lines along the border, and custom axis names:

\\begin{plot}[2d][xmin=-4, xmax=4, ymin=-3, ymax=3, xlabel=$t$ (Time), ylabel=$y(t)$, grid=true, numbers=true, title=Clipped Functions & Vectors]
\\func{0.5*x^2 - 2}[color=#2563eb, label=$\\frac{1}{2}t^2 - 2$]
\\func{tan(x)}[color=#dc2626, label=$\\tan(t)$]
\\vector{(0,0) -> (2, 1.5)}[color=#16a34a, label=$\\vec{v}$]
\\point{(2, 0)}[color=#9333ea, label=$P(2,0)$]
\\end{plot}

\\begin{plot}[3d][xlabel=Re(z), ylabel=Im(z), zlabel=|f(z)|, grid=true, numbers=true]
\\surface{sin(sqrt(x^2 + y^2))}
\\curve3d{cos(t), sin(t), t/5}[t=0..12.56, color=#dc2626]
\\end{plot}

\\section{3. Mathematics, Block Matrices & Theorems}

$$M = \\bmat{[eye(2), [1, 0; 3, 4]; [2, -1], [5, 0]]}, \\qquad \\system{2x + y - z = 1; x - y + 2z = 3}$$

\\begin{theorem}[Spectral Decomposition]
Every self-adjoint operator $T \\in \\End(V)$ on a finite-dimensional inner product space over $\\R$ or $\\C$ admits an orthonormal eigenbasis.
\\end{theorem}

\\begin{box}[info][Polytonic Greek, IPA & Borderless Typography]
You can write \\highlight[#fef08a]{highlighted text}, \\underline[#2563eb]{custom underlines}, \\textcolor[#dc2626]{colored text}, \\smallcaps{Small Caps}, \\ipa{/ˈklɔːri/}, and polytonic Greek: \\greek{Μῆνιν ἄειδε θεὰ Πηληϊάδεω Ἀχιλῆος}.
\\end{box}

\\copyright[CC BY-NC-ND 4.0]{Licensed under CC BY-NC-ND 4.0. Free to share with attribution.}`;

  let repoDiscoveredThemes = [];

  async function discoverRepoThemes(notify = false) {
    const discovered = [];
    async function scanDir(dirPath, kind) {
      try {
        const manRes = await fetch(`${dirPath}/manifest.json`, { cache: "no-store" });
        if (manRes.ok) {
          const list = await manRes.json();
          const items = Array.isArray(list) ? list : (list.themes || []);
          for (const item of items) {
            const entry = typeof item === "string" ? { file: item } : item;
            const fileUrl = entry.file.startsWith("http") ? entry.file : `${dirPath}/${entry.file}`;
            const fRes = await fetch(fileUrl, { cache: "no-store" });
            if (fRes.ok) {
              if (fileUrl.endsWith(".json")) {
                const data = await fRes.json();
                discovered.push({
                  key: `repo_${kind}_${entry.file}`,
                  kind,
                  name: data.name || entry.name || entry.file,
                  desc: data.description || entry.description || `Loaded from ${dirPath}/${entry.file}`,
                  css: data.css || "",
                  thumb: data.preview || entry.preview || (kind === "PDF" ? TEMPLATE_THUMBS.pdf_paper : TEMPLATE_THUMBS.clean)
                });
              } else if (fileUrl.endsWith(".css")) {
                const cssText = await fRes.text();
                discovered.push({
                  key: `repo_${kind}_${entry.file}`,
                  kind,
                  name: entry.name || entry.file.replace(/\.css$/i, ""),
                  desc: entry.description || `Stylesheet from ${dirPath}/${entry.file}`,
                  css: cssText,
                  thumb: entry.preview || (kind === "PDF" ? TEMPLATE_THUMBS.pdf_paper : TEMPLATE_THUMBS.clean)
                });
              }
            }
          }
        }
      } catch (_) {}
    }

    await Promise.all([scanDir("themes/html", "WEB"), scanDir("themes/pdf-latex", "PDF")]);
    const builtinNames = new Set(BUILTIN_THEMES.map(b => b.name.toLowerCase()));
    repoDiscoveredThemes = discovered.filter(d => !builtinNames.has(d.name.toLowerCase()));

    for (const t of repoDiscoveredThemes) {
      if (!Clawri.State.data.cssByTheme[t.key]) {
        Clawri.State.data.cssByTheme[t.key] = t.css;
      }
    }
    if (document.getElementById("settings-modal").classList.contains("open")) {
      Clawri.UI.renderThemeCardsGrid();
    }
    if (notify) {
      Clawri.UI.setStatus(repoDiscoveredThemes.length > 0
        ? `Discovered ${repoDiscoveredThemes.length} external theme(s)`
        : "Scanned themes/html & themes/pdf-latex");
    }
  }

  return {
    DEFAULT_LATEX_MACROS,
    THEME_CLEAN_CSS,
    THEME_RETRO_CSS,
    THEME_PDF_PAPER_CSS,
    THEME_PDF_DISPENSE_CSS,
    THEME_PDF_EXAM_CSS,
    THEME_PDF_WORKSHEET_CSS,
    TEMPLATE_THUMBS,
    BUILTIN_THEMES,
    LABEL_PRESETS,
    DEFAULT_SAMPLE_SOURCE,
    getRepoThemes: () => repoDiscoveredThemes,
    discoverRepoThemes
  };
})();
