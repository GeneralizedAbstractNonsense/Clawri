# Clawri v2.1 — Complete Command & Syntax Reference

Clawri combines a LaTeX-inspired markup language (**ClawriTeX**) with live HTML/PDF rendering, MathJax 3 typesetting, vector diagrams, and MATLAB-style 2D/3D plotting.

---

## 1. Document Metadata & Page Control

| Command | Arguments / Options | Description |
| :--- | :--- | :--- |
| `\title[tag]{Title}` | `[tag]` (optional), `{Title}` (required) | Sets the main `<h1>` title and `<title>` metadata. Optional `[tag]` sets the navigation badge or chapter number. |
| `\subtitle{Subtitle}` | `{Subtitle}` | Sets the document subtitle displayed beneath the title. |
| `\author[Role]{Name}` | `[Role]` (optional), `{Name}` | Sets the author name and optional affiliation or role. |
| `\date[Label]{Date}` | `[Label]` (optional), `{Date}` | Sets the publication date (e.g., `2026/11/20`). |
| `\favicon{src}` | `{src}` | Sets a custom page favicon using a VFS asset path (e.g., `assets/icon.png`) or external URL. |
| `\copyright[License]{Text}` | `[License]` (optional), `{Text}` (optional) | Renders a copyright/license notice box at the bottom of the article (e.g., `CC BY-NC-ND 4.0`, `CC BY 4.0`, `MIT`). |
| `\newpage` | None | Inserts a page break for PDF/print output and a visual break indicator in the web preview. |
| `\pdf[style]{Label}` | `[style]`: `primary` \| `minimal` | Inserts an interactive button that triggers `window.print()` to export/print the document as PDF. |

---

## 2. Sections, Alignment & Vertical Spacing

| Command / Environment | Syntax | Description |
| :--- | :--- | :--- |
| `\section{Heading}` | `\section{1. Introduction}` | Renders a major section heading (`<h2>`). |
| `\subsection{Heading}` | `\subsection{1.1 Background}` | Renders a subsection heading (`<h3>`). |
| `\abstract{Text}` | `\abstract{Summary text...}` | Renders a styled Abstract / Author's Notes callout box. |
| `\align[dir]{Content}` | `[dir]`: `left` \| `center` \| `right` \| `justify` | Aligns content horizontally according to `dir`. |
| `\begin{center}...\end{center}` | Block environment | Centers all enclosed content. |
| `\begin{flushleft}...\end{flushleft}` | Block environment | Left-aligns all enclosed content. |
| `\begin{flushright}...\end{flushright}` | Block environment | Right-aligns all enclosed content. |
| `\begin{justify}...\end{justify}` | Block environment | Full-justifies all enclosed text. |
| `\bigskip` | Standalone command | Inserts `28px` of vertical whitespace. |
| `\medskip` | Standalone command | Inserts `16px` of vertical whitespace. |
| `\smallskip` | Standalone command | Inserts `8px` of vertical whitespace. |
| `\\` | Inline command | Inserts an explicit line break (`<br />`). |

---

## 3. Inline Text Formatting & Typography

All inline badges, highlights, and keycaps are borderless by default for clean typography.

| Command | Syntax Example | Description |
| :--- | :--- | :--- |
| `\textbf{text}` | `\textbf{bold}` | Renders bold text (`<strong>`). |
| `\textit{text}` | `\textit{italic}` | Renders italicized text (`<em>`). |
| `\underline[color]{text}` | `\underline[#2563eb]{underlined}` | Renders a clean colored underline (defaults to `currentColor`). |
| `\textcolor[color]{text}` | `\textcolor[#dc2626]{red text}` | Colors inline text (also supports `\textcolor{color}{text}`). |
| `\highlight[bg]{text}` | `\highlight[#fef08a]{highlighted}` | Applies a soft background marker highlight (defaults to `#fef08a`). |
| `\pill[bg]{text}` | `\pill[rgba(59,130,246,0.14)]{Badge}` | Renders a rounded, borderless inline pill badge. |
| `\tag[bg]{text}` | `\tag[rgba(16,185,129,0.15)]{v2.1}` | Renders a rectangular, borderless inline tag. |
| `\kbd{keys}` | `\kbd{Cmd+D}` | Styles text as a borderless keyboard keycap. |
| `\codeinline{code}` | `\codeinline{:files}` | Renders an inline monospace code snippet. |
| `\smallcaps{text}` | `\smallcaps{Small Caps}` | Renders text in small capitals (`font-variant: small-caps`). |
| `\sub{text}` | `H\sub{2}O` | Renders subscript text (`<sub>`). |
| `\sup{text}` | `x\sup{2}` | Renders superscript text (`<sup>`). |
| `\muted{text}` | `\muted{(optional note)}` | Renders secondary inline text at reduced opacity (`0.68`). |
| `\fonts[Family, size]{text}` | `\fonts[Fira Sans, 18px]{Custom}` | Overrides font family and/or size for an inline span. |
| `\ipa{phonetics}` | `\ipa{/ˈklɔːri/}` | Formats International Phonetic Alphabet (IPA) transcriptions with phonetic serif fonts. |
| `\greek{text}` | `\greek{Μῆνιν ἄειδε θεά}` | Formats polytonic Greek text with dedicated Greek typefaces (*Gentium Plus*, *GFS Didot*, *Cardo*). |
| `\link{url}{text}` | `\link{https://example.com}{Website}` | Creates an external hyperlink opening in a new tab. |
| `\dots` / `\ldots` | `a, b, \dots, z` | Inserts a horizontal ellipsis (`…`). |
| `\cdots` | `1 + 2 + \cdots + n` | Inserts centered horizontal dots (`⋯`). |
| `\vdots` | `\vdots` | Inserts vertical dots (`⋮`). |
| `\ddots` | `\ddots` | Inserts diagonal dots (`⋱`). |
| `\badge{text}` | `\badge{Featured}` | Default user-defined custom command (editable or extendable in `:settings`). |

---

## 4. Lists (`itemize` & `enumerate`)

Both `\begin{itemize}[style]` and `\begin{enumerate}[style]` accept a style option and `\item` entries (supporting nested lists).

| Style Option | Aliases | Marker Output |
| :--- | :--- | :--- |
| `numbers` | `number`, `decimal`, `1` | `1, 2, 3, ...` |
| `roman` | `i`, `lower-roman` | `i, ii, iii, ...` |
| `Roman` | `ROMAN`, `I`, `upper-roman` | `I, II, III, ...` |
| `alpha` | `a`, `lower-alpha` | `a, b, c, ...` |
| `Alpha` | `ALPHA`, `A`, `upper-alpha` | `A, B, C, ...` |
| `dots` | `disc`, `bullet` | Standard round bullets (`•`) |
| `square` | — | Square bullets (`▪`) |
| `dash` | — | En-dash bullets (`–`) |

```latex
\begin{itemize}[Roman]
\item First uppercase Roman item
\item Second uppercase Roman item
\end{itemize}
```

---

## 5. Quotes & Poetry

| Command | Syntax | Description |
| :--- | :--- | :--- |
| `\quote[Author][Source]{Text}` | `\quote[Plato][Republic]{...}` | Renders a styled blockquote with optional author and source citation (also supports 3-brace syntax `\quote{Author}{Source}{Text}`). |
| `\poem[mode][Author][Work]{Verses}` | `[mode]`: `every5` \| `none` | Renders a centered stanza-by-stanza poem. Blank lines or `---` separate stanzas. Verse numbers appear on every line by default, every 5th line (`every5`), or never (`none`). |
| `\poetry[Author][Work][every5]{Lines}` | Boxed poem container | Renders a left-aligned framed poem box with line numbers and attribution. |

---

## 6. Footnotes, Analytical Index & Bibliography

| Command / Environment | Syntax | Description |
| :--- | :--- | :--- |
| `\footnote[mode]{Text}` | `[mode]`: `margin` \| `bottom` \| `here` \| `end` | Creates a numbered footnote. On wide desktop screens (`>= 1280px`), `margin` notes appear in the right margin as sidenotes and open in a bottom drawer on mobile. |
| `\footnotehere{Text}` | `\footnotehere{Inline remark}` | Renders an inline/local bracketed note directly in place. |
| `\index{Term}` | `\index{Eigenvalues}` | Places an anchor at the current position and registers `Term` in the analytical index. |
| `\printindex` | `\printindex` | Renders a sorted two-column analytical index linking back to every `\index{...}` anchor. |
| `\cite{keys}` | `\cite{lang02, artin11}` | Inserts clickable citation links `[lang02, artin11]` pointing to bibliography entries. |
| `\bibliography` | `\bibliography` | Automatically parses BibTeX entries from `references.bib` in the project VFS and renders the bibliography section. |
| `\begin{bibliography}...\end{bibliography}` | `\bibitem{key} Citation text...` | Manually defines bibliography entries using `\bibitem{key}`. |

---

## 7. Images, Multi-Image Layouts, Tables & Code Blocks

### Images & Composition
* `\image[options]{src}`
  * **Key-value options**: `caption=...`, `width=...` (e.g. `80%`, `320px`), `align=left|right|center|full` (or plain caption `\image[Figure 1]{assets/fig1.png}`).
  * `src` resolves files stored in the project VFS (`assets/...`) as well as external URLs.
* `\begin{compose}[cols, layout] ... \end{compose}`
  * Arranges multiple `\image` commands side by side in a grid (`row`, e.g. `[2, row]`) or stacked vertically (`column`).

### Tables
* `\begin{table}[cols, rows, style] ... \end{table}`
  * **Styles**: `booktabs` (default), `grid`, `striped`.
  * **Row syntax**: `\line[bgColor, textColor, bold|normal] Cell 1 || Cell 2 || Cell 3 ||` (also accepts `\column[...]`).

```latex
\begin{table}[3, 3, booktabs]
\line[#f1f5f9, #0f172a, bold] Method || Convergence || Cost ||
\line[#ffffff, #18181b, normal] Euler || $O(h)$ || Low ||
\line[#ffffff, #18181b, normal] RK4 || $O(h^4)$ || Medium ||
\end{table}
```

### Code Blocks
* `\code[language]{ ... }` — Renders a styled `<pre><code>` block with language class (`python`, `javascript`, `latex`, `cpp`, etc.).

---

## 8. Callout Boxes, Theorems, Proofs & Exercises

### Callout Boxes
* `\begin{box}[style][Title] ... \end{box}`
  * **Built-in styles**: `note`, `info`, `warning`, `tip`, `important`, `curiosita`, `videobox` (custom styles can be added in `:settings`).
* `\begin{curiosita}[Title] ... \end{curiosita}` — Shorthand curiosity box.
* `\begin{videobox}[Title] ... \end{videobox}` — Shorthand recommended video box.

### Mathematical Environments & Exercises
| Environment / Command | Syntax | Description |
| :--- | :--- | :--- |
| `theorem` | `\begin{theorem}[Name] ... \end{theorem}` | Auto-numbered Theorem block. |
| `lemma` | `\begin{lemma}[Name] ... \end{lemma}` | Auto-numbered Lemma block. |
| `proposition` | `\begin{proposition}[Name] ... \end{proposition}` | Auto-numbered Proposition block. |
| `corollary` | `\begin{corollary}[Name] ... \end{corollary}` | Auto-numbered Corollary block. |
| `definition` | `\begin{definition}[Name] ... \end{definition}` | Auto-numbered Definition block (upright body text). |
| `remark` | `\begin{remark}[Name] ... \end{remark}` | Auto-numbered Remark block. |
| `exercise` | `\begin{exercise}[Name] ... \end{exercise}` | Auto-numbered framed Exercise block. |
| `proof` | `\begin{proof}[Custom Title] ... \end{proof}` | Proof block ending with a right-aligned QED symbol ($\square$). |
| `solution` | `\begin{solution} ... \end{solution}` | Collapsible `<details>` solution block. |
| `\exercisebox{num}{diff}` | `\exercisebox{12}{2}` | Inline exercise badge with number `num` and `diff` (`0`–`3`) difficulty dots. |
| `\solu{content}` | `\solu{x = 2, \; y = -1}` | Right-aligned dark-red bracketed solution hint. |

---

## 9. Mathematics & Built-in LaTeX Macros

Use `$ ... $` for inline mathematics and `$$ ... $$` for display equations.

### Matrix, Vector & System Helpers
| Command | Example | Output |
| :--- | :--- | :--- |
| `\cvec{...}` | `\cvec{1, 2, 3}` | Column vector (`pmatrix`). |
| `\rvec{...}` | `\rvec{1, 2, 3}` | Row vector (`pmatrix`). |
| `\mat{...}` | `\mat{a, b; c, d}` | Matrix (`pmatrix`, `;` separates rows, `,` separates columns). |
| `\system{...}` | `\system{x + y = 1; x - y = 0}` | Left-braced system of equations (`cases`). |
| `\bmat{...}` | `\bmat{[eye(2), [1,0;3,4]; zeros(1,2), ones(1,2)]}` | MATLAB-style block matrix with automatic vertical and horizontal partition lines. Supports `eye(n)`, `zeros(r,c)`, and `ones(r,c)`. |

### Built-in Mathematical Shorthands
* **Number Sets & Spaces**: `\R` ($\mathbb{R}$), `\C` ($\mathbb{C}$), `\Z` ($\mathbb{Z}$), `\Q` ($\mathbb{Q}$), `\F` ($\mathbb{F}$), `\N` ($\mathbb{N}$), `\K` ($\mathbb{K}$), `\Nz` ($\mathbb{N}_0$), `\Rn`, `\Cn`, `\Kn`, `\An`, `\En`, `\Pn`, `\A`, `\E`, `\Pro`, `\uzero`, `\zero`, `\mapsfrom`.
* **Operators & Linear Algebra**: `\id`, `\End`, `\Hom{...}`, `\Bil{...}`, `\Ann`, `\Rad`, `\Spec{...}`, `\Specf{k}{...}`, `\Zc`, `\Nil`, `\rk`, `\codim`, `\giac{...}`, `\dist{...}`, `\Stab{...}`, `\Span{...}`, `\Spanf{k}{...}`.
* **Delimiters, Norms & Calculus**: `\inv{x}`, `\Set{...}`, `\rot{...}`, `\Base{...}`, `\norm{...}`, `\scal{u}{v}`, `\<`, `\>`, `\restr{f}{A}`, `\oproj{W}{v}`, `\pproj{U}{W}{v}`, `\vect{AB}`, `\diff{y}{x}`, `\pdiff{f}{x}`.
* **Groups, Quotients & Colors**: `\calE`, `\calB`, `\calC`, `\calO`, `\U`, `\SO`, `\SU`, `\Aff`, `\braid{...}`, `\quotient{A}{B}`, `\rquotient{A}{B}`, `\darrow{a}{b}`, `\tot{a}{b}`, `\coly{...}`, `\colb{...}`, `\colg{...}`, `\colm{...}`.

---

## 10. Vector Diagrams: Commutative Diagrams, Sets, Graphs & Trees

All vector diagrams render as crisp SVGs and automatically export as 300-DPI PNG figures during `:export tex`.

### Commutative & Arrow Diagrams (`\begin{draw}[diagram]`)
* `\node (ID) at (x,y) {Label}` — Places a labeled node at coordinates `(x, y)`.
* `\arrow (A) -> (B) [options]` — Draws a morphism arrow between nodes.
  * **Arrow types**: `->`, `<->`, `=>`, `<=>`, `-->` (dashed), `-.>` (dotted).
  * **Options**: `label=...`, `bend=<px>`, `style=dashed`, `color=...`, `side=left|right`.

### Set & Venn Diagrams (`\begin{draw}[set]`, `\begin{set}`, or `\begin{venn}`)
* `\draw Universe [label=$U$]` — Draws the outer universe rectangle.
* `\draw set ID at (x,y) [r=1.35, rx=..., ry=..., color=..., label=...]` — Draws a circular or elliptical set.
* `\make intersection|union|difference A, B [color=..., label=...]` — Shades set operations between `A` and `B`.
* `\draw in set ID elements [with dots] {el1, el2, ...}` — Lists elements inside set `ID`.
* `\draw set containing {el1, el2} at (x,y) [color=..., label=...]` — Draws an oval container around explicit elements.

### Graphs (`\begin{graph}[directed|undirected]`)
* `\node ID [at (x,y)] [label=...]` — Defines a graph vertex (auto-arranged in a circle if `at (x,y)` is omitted).
* `\edge A -> B [weight=..., label=...]` or `\edge A -- B` — Connects two vertices.

### Trees (`\begin{tree}`)
* `\root Label` — Defines the root node.
* `\child Label { \child Sub1 \child Sub2 }` — Recursively defines child branches.

---

## 11. MATLAB-Style 2D & 3D Plots

### 2D Plots: `\begin{plot}[2d][options] ... \end{plot}`
* **Environment Options**:
  * `xlim=[min,max]` (or `xmin=...`, `xmax=...`), `ylim=[min,max]` (or `ymin=...`, `ymax=...`)
  * `xlabel=...`, `ylabel=...`, `title=...`
  * `grid=on|off`, `minorgrid=on|off`, `numbers=on|off`
  * `axes=box|center|none`, `aspect=equal`
  * `legend=northeast|northwest|southeast|southwest|outside|off`
  * `xstep=...`, `ystep=...`, `xticks=[...]`, `yticks=[...]`
* **2D Plot Commands**:
  * `\func{expr}[color=..., linewidth=2, style=solid|dashed|dotted|dashdot, domain=a..b, samples=420, label=...]` — Plots $y = f(x)$ clipped cleanly to the frame with automatic vertical asymptote splitting.
  * `\area{expr}[from=a, to=b, color=..., opacity=0.2, label=...]` — Shades the area under $y = f(x)$.
  * `\plot{x1, x2, ...; y1, y2, ...}[color=..., marker=o|s|^|d|+|x|filled|none, linewidth=1.8, style=..., label=...]` — Plots discrete $(x, y)$ data series.
  * `\curve{x(t), y(t)}[t=0..2*pi, color=..., linewidth=2, style=..., label=...]` — Plots a parametric 2D curve.
  * `\vector{(x1,y1) -> (x2,y2)}[color=..., linewidth=2.1, label=...]` — Draws a 2D vector arrow.
  * `\scatter{(x1,y1), (x2,y2)}[color=..., marker=o, size=4.2, label=...]` & `\point{(x,y)}[...]` — Plots scatter points or a single labeled point.
  * `\hline{y0}[color=..., style=dashed]` & `\vline{x0}[color=..., style=dashed]` — Draws horizontal or vertical reference lines.
  * `\text{(x,y)}{Label}[color=...]` — Places a text/LaTeX annotation at `(x, y)`.

### 3D Plots: `\begin{plot}[3d][options] ... \end{plot}`
* **Environment Options**:
  * `xlim=[min,max]`, `ylim=[min,max]`, `zlim=[min,max]`
  * `xlabel=...`, `ylabel=...`, `zlabel=...`, `title=...`
  * `view=az,el` — Camera azimuth and elevation in degrees (default `-37.5,30`).
  * `grid=on|off`, `box=on|off`, `numbers=on|off`
  * `colormap=parula|viridis|jet|hot|cool|bw`, `colorbar=on|off`
* **3D Plot Commands**:
  * `\surface{f(x,y)}[samples=24, colormap=..., style=surf|mesh|wireframe, opacity=0.88]` — Renders a depth-sorted 3D surface $z = f(x, y)$.
  * `\param3d{x(u,v), y(u,v), z(u,v)}[u=0..2*pi, v=0..pi, samples=22, colormap=..., opacity=0.88]` — Renders a parametric 3D surface.
  * `\curve3d{x(t), y(t), z(t)}[t=0..4*pi, color=..., linewidth=2.4, style=solid|dashed, samples=240]` — Renders a 3D space curve.
  * `\point3d{(x,y,z)}[...]` & `\scatter3{(x1,y1,z1), ...}[...]` — Plots 3D points.
  * `\vector3d{(x1,y1,z1) -> (x2,y2,z2)}[color=..., linewidth=2.2, label=...]` — Draws a 3D vector arrow.

---

## 12. Editor Command Line (`:`) & Leader Shortcuts

Press `:` in Vim **Normal** mode to open the command bar, or press `Space` (`<Leader>`) followed by a shortcut key:

| Ex Command | Leader Key | Description |
| :--- | :--- | :--- |
| `:home` / `:projects` | `Space h` | Open the Projects Dashboard (switch, create, import, or trash projects). |
| `:files` / `:tree` | `Space e` | Toggle the project Virtual File System (VFS) explorer sidebar. |
| `:term` / `:terminal` | `Space t` | Open the integrated VFS terminal (`ls`, `cd`, `mkdir`, `touch`, `mv`, `cp`, `rm`, `cat`, `open`). |
| `:settings` / `:set` | `Space s` | Open Hard Settings (Templates, CSS, Fonts, Labels, Macros, Custom Commands, RSS). |
| `:properties` / `:props` | `Space p` | Open Soft Document Properties (Title, Author, Favicon, Footnote mode, License, PDF size). |
| `:full` / `:zen` | `Space f` | Toggle Zen Fullscreen mode. |
| `:export zip` | `Space z` (`Cmd/Ctrl+D`) | Download a self-contained, ready-to-deploy blog `.zip` archive (`index.html`, `assets/`, `rss.xml`, `.clawri`). |
| `:export html` | — | Export a standalone `index.html` file. |
| `:export pdf` | — | Open the browser print dialog to save as PDF. |
| `:export tex` | `Space x` | Export LaTeX `.tex` source (bundled with 300-DPI PNG figures if diagrams/plots are present). |
| `:export clawri` | — | Export a portable `.clawri` JSON project bundle. |
| `:export rss` | — | Download the generated `rss.xml` feed. |
| `:w` / `:save` | `Space w` | Save the active project to local browser storage. |
| `:new` | — | Create a new project. |
| `:sample` | — | Load the interactive Clawri showcase document. |
| `:help` / `:h` | — | Open the built-in quick reference modal. |