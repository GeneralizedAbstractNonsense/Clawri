<p align="center">
  <img src="media/icon.png" width="120" height="120" alt="Logo">
</p>

<h1 align="center">Clawri</h1>

<p align="center">
  <strong>Just a text editor for my blog.</strong>
</p>

<p align="center">
 Clawri is a client-side, modal text editor designed for writing and publishing static blog articles. It has got a lightweight LaTeX-inspired markup language, live synchronized preview, mathematical rendering and standalone HTML or PDF export.
</p>

<p align="center">
  <a href="https://generalizedabstractnonsense.github.io/Clawri/">Website</a> ·
  <a href="#">Latest release</a> ·
  <a href="#">Issues</a>
</p>
<div align="center">
    <img alt="GitHub Release" src="https://img.shields.io/github/v/release/GeneralizedAbstractNonsense/Clawri?display_name=release">
    <img alt="License" src="https://img.shields.io/github/license/GeneralizedAbstractNonsense/Clawri">
    <img alt="Platforms" src="https://img.shields.io/badge/platform-Android%20%7C%20iOS%20%7C%20macOS%20%7C%20Windows%20%7C%20Linux-2ea44f">
</div>


## Features

- **Split-Screen Workspace**: Equal-width panes featuring an active pane highlighting, status line and real-time preview that automatically scrolls to match your cursor position.
- **Modal & Hybrid Editing**: Full Vim modal navigation (`Normal`, `Insert`, `Visual`) combined with standard system shortcuts (`Cmd/Ctrl + C`, `V`, `X`, `I`, `B`, `U`).
- **Tab Autocompletion**: Context-aware autocomplete menu for LaTeX math symbols, structural commands, and user-defined macros.
- **Math & Code Rendering**: Built-in support for inline (`$ ... $`) and display (`$$ ... $$`) equations via MathJax 3, plus syntax-highlighted code blocks via Highlight.js.
- **Responsive Footnotes**: Automatic footnote numbering that renders as margin sidenotes on wide desktop viewports and as a bottom overlay drawer on smaller screens.
- **Custom Themes & Scripts**: Switch between built-in stylesheets, upload custom `.css` and `.js` files separately, and define custom markup commands.
- **Portable Export**: Export finished articles as self-contained `.html` files ready for static hosting, or print directly to `.pdf`.


## Keybindings

### Modal Navigation & Interface

| Mode | Key | Action |
| :--- | :--- | :--- |
| Normal | `i` / `a` / `o` | Enter Insert mode |
| Insert / Visual | `Cmd/Ctrl + E` | Return to Normal mode |
| Normal | `h` `j` `k` `l` / Arrow keys | Move cursor |
| Normal | `s` | Open Settings (Themes, CSS, JS, Custom Commands) |
| Normal | `t` | Open Article Metadata & Template settings |

### Formatting & Autocomplete

| Key | Action |
| :--- | :--- |
| `Tab` | Accept selected LaTeX or markup autocomplete suggestion |
| `Up` / `Down` | Navigate autocomplete suggestions |
| `Cmd/Ctrl + B` | Wrap selection in `\textbf{}` |
| `Cmd/Ctrl + I` | Wrap selection in `\textit{}` |
| `Cmd/Ctrl + U` | Wrap selection in `\underline{}` |
| `Cmd/Ctrl + S` | Save current state to browser storage |

## Markup Syntax

Clawri compiles a minimal LaTeX-style syntax into semantic HTML:


```latex
\abstract{Introductory note or summary box.}

\section{Main Heading}
\subsection{Subheading}

Inline math $E = mc^2$ and display equations:

$$\int_{-\infty}^{\infty} e^{-x^2}\,dx = \sqrt{\pi}$$

\quote[Author][Source]{Blockquote text.}

\poetry[Author][Work]{
First verse line
Second verse line
---
First line of second stanza
}

Body text with a footnote\footnote{Footnote content.} and a \link{https://example.com}{hyperlink}.

\poem{
This is
a poem.

Yes, it is.}

\code[python]{
def main():
    return True
}

\image[Figure caption]{https://example.com/image.png}

\copyright
```

- `\poetry` automatically numbers every verse line and converts `---` into a stanza divider.
- `\copyright` appends the Creative Commons license notice block at the end of the article.
- Lines starting with `%` are treated as comments and omitted from the output.

## Customization

Press `s` in Normal mode to access the Settings panel:

1. **Themes & CSS**: Choose between the default dark retro theme, a minimal editorial theme, or load your own `.css` file.
2. **External JavaScript**: Attach custom JavaScript that is injected into the exported HTML document independently of the stylesheet.
3. **Custom Commands**: Define new macros (e.g., `\box` with `1` argument mapped to `<div class="box">{{1}}</div>`). Custom commands are automatically indexed by the `Tab` autocomplete menu.
4. **Configuration Backup**: Export or import your CSS, JavaScript, and custom command definitions as a `clawri-theme-config.json` file.

