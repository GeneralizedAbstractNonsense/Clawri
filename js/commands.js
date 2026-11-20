/* ============================================================================
   MODULE 3: Clawri.Commands (DECLARATIVE COMMANDS REGISTRY — EASY TO EDIT!)
   Want to add or edit an inline command? Just add an entry to INLINE_COMMANDS!
   ============================================================================ */
window.Clawri = window.Clawri || {};

Clawri.Commands = (function () {
  const { escapeHtml } = Clawri.Utils;

  /* --------------------------------------------------------------------------
     1. INLINE COMMANDS REGISTRY (All borderless by default!)
     Format:
       commandName: {
         args: 1,
         desc: "Short description",
         snippet: "\\commandName{$1}",
         render: (req, opt, compile) => `...HTML...`
       }
     -------------------------------------------------------------------------- */
  const INLINE_COMMANDS = {
    textbf: {
      args: 1,
      desc: "Bold text",
      snippet: "\\textbf{$1}",
      render: (req, _, compile) => `<strong>${compile(req[0] || "")}</strong>`
    },
    textit: {
      args: 1,
      desc: "Italic text",
      snippet: "\\textit{$1}",
      render: (req, _, compile) => `<em>${compile(req[0] || "")}</em>`
    },
    underline: {
      args: 1,
      desc: "Clean colored underline",
      snippet: "\\underline[#2563eb]{$1}",
      render: (req, opt, compile) => {
        const col = opt[0] || "currentColor";
        return `<span style="text-decoration:underline;text-decoration-color:${escapeHtml(col)};text-decoration-thickness:2px;text-underline-offset:3px;">${compile(req[0] || "")}</span>`;
      }
    },
    textcolor: {
      args: 1,
      desc: "Colored inline text",
      snippet: "\\textcolor[#2563eb]{$1}",
      render: (req, opt, compile) => {
        const col = opt[0] || (req.length >= 2 ? req[0] : "inherit");
        const body = req[req.length - 1] || "";
        return `<span style="color:${escapeHtml(col)};">${compile(body)}</span>`;
      }
    },
    highlight: {
      args: 1,
      desc: "Soft marker highlight (no border)",
      snippet: "\\highlight[#fef08a]{$1}",
      render: (req, opt, compile) => {
        const bg = opt[0] || "#fef08a";
        return `<mark style="background-color:${escapeHtml(bg)};color:#111827;padding:1px 6px;border-radius:3px;border:none;">${compile(req[0] || "")}</mark>`;
      }
    },
    pill: {
      args: 1,
      desc: "Borderless soft inline badge",
      snippet: "\\pill[rgba(59,130,246,0.14)]{$1}",
      render: (req, opt, compile) => {
        const bg = opt[0] || "rgba(59, 130, 246, 0.14)";
        return `<span style="display:inline-block;background:${escapeHtml(bg)};padding:1px 8px;border-radius:999px;font-size:0.86em;font-weight:500;border:none;">${compile(req[0] || "")}</span>`;
      }
    },
    tag: {
      args: 1,
      desc: "Borderless inline tag",
      snippet: "\\tag[rgba(16,185,129,0.15)]{$1}",
      render: (req, opt, compile) => {
        const bg = opt[0] || "rgba(125, 125, 125, 0.14)";
        return `<span style="display:inline-block;background:${escapeHtml(bg)};padding:1px 7px;border-radius:4px;font-size:0.85em;border:none;">${compile(req[0] || "")}</span>`;
      }
    },
    kbd: {
      args: 1,
      desc: "Clean borderless keyboard keycap",
      snippet: "\\kbd{$1}",
      render: (req) =>
        `<kbd style="display:inline-block;background:rgba(125,125,125,0.14);padding:1px 6px;border-radius:4px;font-family:var(--font-code);font-size:0.84em;border:none;box-shadow:0 1px 0 rgba(0,0,0,0.12);">${escapeHtml(req[0] || "")}</kbd>`
    },
    codeinline: {
      args: 1,
      desc: "Inline monospace snippet (no border)",
      snippet: "\\codeinline{$1}",
      render: (req) =>
        `<code style="background:rgba(125,125,125,0.13);padding:1px 6px;border-radius:3px;font-size:0.88em;border:none;">${escapeHtml(req[0] || "")}</code>`
    },
    smallcaps: {
      args: 1,
      desc: "Small caps typography",
      snippet: "\\smallcaps{$1}",
      render: (req, _, compile) => `<span style="font-variant:small-caps;letter-spacing:0.04em;">${compile(req[0] || "")}</span>`
    },
    sub: {
      args: 1,
      desc: "Subscript text",
      snippet: "\\sub{$1}",
      render: (req, _, compile) => `<sub>${compile(req[0] || "")}</sub>`
    },
    sup: {
      args: 1,
      desc: "Superscript text",
      snippet: "\\sup{$1}",
      render: (req, _, compile) => `<sup>${compile(req[0] || "")}</sup>`
    },
    muted: {
      args: 1,
      desc: "Muted / secondary inline note",
      snippet: "\\muted{$1}",
      render: (req, _, compile) => `<span style="opacity:0.68;">${compile(req[0] || "")}</span>`
    },
    fonts: {
      args: 1,
      desc: "Inline font family & size",
      snippet: "\\fonts[Century Gothic, 18px]{$1}",
      render: (req, opt, compile) => {
        const parts = (opt[0] || "").split(",").map(s => s.trim());
        const fFamily = parts[0] || "inherit";
        const fSize = parts[1] || "inherit";
        return `<span style="font-family:${escapeHtml(fFamily)};font-size:${escapeHtml(fSize)};">${compile(req[0] || "")}</span>`;
      }
    },
    ipa: {
      args: 1,
      desc: "IPA phonetic transcription",
      snippet: "\\ipa{$1}",
      render: (req, _, compile) =>
        `<span class="clawri-ipa" style="font-family:'Gentium Plus','Charis SIL','Noto Serif',serif;letter-spacing:0.02em;background:rgba(125,125,125,0.08);padding:0 4px;border-radius:2px;border:none;">${compile(req[0] || "")}</span>`
    },
    greek: {
      args: 1,
      desc: "Polytonic Greek script",
      snippet: "\\greek{$1}",
      render: (req, _, compile) =>
        `<span class="clawri-greek" lang="el" style="font-family:'Gentium Plus','GFS Didot','Cardo','Noto Serif',serif;">${compile(req[0] || "")}</span>`
    },
    dots: { args: 0, desc: "Horizontal ellipsis …", snippet: "\\dots", render: () => "&hellip;" },
    ldots: { args: 0, desc: "Horizontal ellipsis …", snippet: "\\ldots", render: () => "&hellip;" },
    cdots: { args: 0, desc: "Centered dots ⋯", snippet: "\\cdots", render: () => "&ctdot;" },
    vdots: { args: 0, desc: "Vertical dots ⋮", snippet: "\\vdots", render: () => "&vellip;" },
    ddots: { args: 0, desc: "Diagonal dots ⋱", snippet: "\\ddots", render: () => "&dtdot;" }
  };

  /* --------------------------------------------------------------------------
     2. LIST STYLES REGISTRY (\begin{itemize}[style] & \begin{enumerate}[style])
     Supports numbers, lower-roman (roman), upper-roman (Roman), alpha, Alpha
     -------------------------------------------------------------------------- */
  const LIST_STYLES = {
    numbers: { tag: "ol", listStyleType: "decimal", htmlType: "1" },
    number: { tag: "ol", listStyleType: "decimal", htmlType: "1" },
    decimal: { tag: "ol", listStyleType: "decimal", htmlType: "1" },
    "1": { tag: "ol", listStyleType: "decimal", htmlType: "1" },

    roman: { tag: "ol", listStyleType: "lower-roman", htmlType: "i" },
    i: { tag: "ol", listStyleType: "lower-roman", htmlType: "i" },
    "lower-roman": { tag: "ol", listStyleType: "lower-roman", htmlType: "i" },

    Roman: { tag: "ol", listStyleType: "upper-roman", htmlType: "I" },
    ROMAN: { tag: "ol", listStyleType: "upper-roman", htmlType: "I" },
    I: { tag: "ol", listStyleType: "upper-roman", htmlType: "I" },
    "upper-roman": { tag: "ol", listStyleType: "upper-roman", htmlType: "I" },

    alpha: { tag: "ol", listStyleType: "lower-alpha", htmlType: "a" },
    a: { tag: "ol", listStyleType: "lower-alpha", htmlType: "a" },
    "lower-alpha": { tag: "ol", listStyleType: "lower-alpha", htmlType: "a" },

    Alpha: { tag: "ol", listStyleType: "upper-alpha", htmlType: "A" },
    ALPHA: { tag: "ol", listStyleType: "upper-alpha", htmlType: "A" },
    A: { tag: "ol", listStyleType: "upper-alpha", htmlType: "A" },
    "upper-alpha": { tag: "ol", listStyleType: "upper-alpha", htmlType: "A" },

    dots: { tag: "ul", listStyleType: "disc", htmlType: "" },
    disc: { tag: "ul", listStyleType: "disc", htmlType: "" },
    bullet: { tag: "ul", listStyleType: "disc", htmlType: "" },
    square: { tag: "ul", listStyleType: "square", htmlType: "" },
    dash: { tag: "ul", listStyleType: "'–  '", htmlType: "" }
  };

  /* --------------------------------------------------------------------------
     3. STRUCTURAL & ENVIRONMENT AUTOCOMPLETE ITEMS
     -------------------------------------------------------------------------- */
  const STRUCTURAL_COMPLETIONS = [
    { cmd: "\\title[]{}", insert: "\\title[$1]{}", desc: "Set document title & chapter/tag" },
    { cmd: "\\subtitle{}", insert: "\\subtitle{$1}", desc: "Set document subtitle" },
    { cmd: "\\author[]{}", insert: "\\author[$1]{}", desc: "Set author & role" },
    { cmd: "\\date[]{}", insert: "\\date[$1]{}", desc: "Set publication date" },
    { cmd: "\\favicon{}", insert: "\\favicon{$1}", desc: "Set page favicon" },
    { cmd: "\\copyright[]{}", insert: "\\copyright[CC BY-NC-ND 4.0]{$1}", desc: "Custom license box" },
    { cmd: "\\newpage", insert: "\\newpage", desc: "Page break (PDF & Web)" },
    { cmd: "\\pdf[]{}", insert: "\\pdf[primary]{$1Download PDF}", desc: "Download PDF button" },
    { cmd: "\\section{}", insert: "\\section{$1}", desc: "Section heading (H2)" },
    { cmd: "\\subsection{}", insert: "\\subsection{$1}", desc: "Subsection heading (H3)" },
    { cmd: "\\abstract{}", insert: "\\abstract{$1}", desc: "Abstract / Author's notes" },
    { cmd: "\\poem[every5]{}", insert: "\\poem[every5]{\n$1\n}", desc: "Centered poem (5-verse numbering)" },
    { cmd: "\\poetry[][]{}", insert: "\\poetry[$1][]{}", desc: "Boxed poem with attribution" },
    { cmd: "\\quote[][]{}", insert: "\\quote[$1][]{}", desc: "Blockquote with author/source" },
    { cmd: "\\footnote[]{}", insert: "\\footnote[bottom]{$1}", desc: "Footnote (bottom/margin/here/end)" },
    { cmd: "\\footnotehere{}", insert: "\\footnotehere{$1}", desc: "Inline/local note here" },
    { cmd: "\\index{}", insert: "\\index{$1}", desc: "Analytical index entry" },
    { cmd: "\\printindex", insert: "\\printindex", desc: "Render analytical index" },
    { cmd: "\\cite{}", insert: "\\cite{$1}", desc: "Cite bibliography key" },
    { cmd: "\\bibliography", insert: "\\bibliography", desc: "Render references.bib" },
    { cmd: "\\begin{bibliography}", insert: "\\begin{bibliography}\n\\bibitem{$1} Author, \\textit{Title}, Year.\n\\end{bibliography}", desc: "Bibliography environment" },
    { cmd: "\\image[]{}", insert: "\\image[caption=$1, width=80%, align=center]{assets/}", desc: "Image with size, caption & float" },
    { cmd: "\\begin{compose}", insert: "\\begin{compose}[2, row]\n\\image[caption=$1]{assets/}\n\\image[caption=]{assets/}\n\\end{compose}", desc: "Compose multiple images together" },
    { cmd: "\\begin{table}", insert: "\\begin{table}[3, 3, booktabs]\n\\line[#f1f5f9, #0f172a, bold] $1 || Col 2 || Col 3 ||\n\\line[#ffffff, #18181b, normal] A || B || C ||\n\\end{table}", desc: "Styled table with \\line / \\column" },
    { cmd: "\\begin{box}", insert: "\\begin{box}[info][$1Title]\nContent...\n\\end{box}", desc: "Callout box" },
    { cmd: "\\begin{curiosita}", insert: "\\begin{curiosita}\n$1\n\\end{curiosita}", desc: "Curiosità callout box" },
    { cmd: "\\begin{videobox}", insert: "\\begin{videobox}\n$1\n\\end{videobox}", desc: "Video consigliato callout box" },
    { cmd: "\\solu{}", insert: "\\solu{$1}", desc: "Right-aligned red bracketed solution hint" },
    { cmd: "\\exercisebox{}{}", insert: "\\exercisebox{$1}{2}", desc: "Numbered exercise badge" },
    { cmd: "\\begin{theorem}", insert: "\\begin{theorem}[$1]\n\n\\end{theorem}", desc: "Theorem environment" },
    { cmd: "\\begin{lemma}", insert: "\\begin{lemma}[$1]\n\n\\end{lemma}", desc: "Lemma environment" },
    { cmd: "\\begin{proposition}", insert: "\\begin{proposition}[$1]\n\n\\end{proposition}", desc: "Proposition environment" },
    { cmd: "\\begin{corollary}", insert: "\\begin{corollary}[$1]\n\n\\end{corollary}", desc: "Corollary environment" },
    { cmd: "\\begin{definition}", insert: "\\begin{definition}[$1]\n\n\\end{definition}", desc: "Definition environment" },
    { cmd: "\\begin{proof}", insert: "\\begin{proof}\n$1\n\\end{proof}", desc: "Proof environment with QED" },
    { cmd: "\\begin{exercise}", insert: "\\begin{exercise}[$1]\n\n\\end{exercise}", desc: "Numbered exercise box" },
    { cmd: "\\begin{solution}", insert: "\\begin{solution}\n$1\n\\end{solution}", desc: "Solution block" },
    { cmd: "\\begin{itemize}[numbers]", insert: "\\begin{itemize}[numbers]\n\\item $1\n\\item \n\\end{itemize}", desc: "Numbered list (1, 2, 3)" },
    { cmd: "\\begin{itemize}[roman]", insert: "\\begin{itemize}[roman]\n\\item $1\n\\item \n\\end{itemize}", desc: "Lowercase Roman list (i, ii, iii)" },
    { cmd: "\\begin{itemize}[Roman]", insert: "\\begin{itemize}[Roman]\n\\item $1\n\\item \n\\end{itemize}", desc: "Uppercase Roman list (I, II, III)" },
    { cmd: "\\begin{itemize}[alpha]", insert: "\\begin{itemize}[alpha]\n\\item $1\n\\item \n\\end{itemize}", desc: "Alphabetical list (a, b, c)" },
    { cmd: "\\begin{draw}[diagram]", insert: "\\begin{draw}[diagram]\n\\node (A) at (0,0) {$A$}\n\\node (B) at (3,0) {$B$}\n\\arrow (A) -> (B) [label=$f$]\n\\end{draw}", desc: "Commutative / arrow diagram" },
    { cmd: "\\begin{draw}[set]", insert: "\\begin{draw}[set]\n\\draw Universe [label=$U$]\n\\draw set A at (-0.8,0) [r=1.3, color=#3b82f6, label=$A$]\n\\draw set B at (0.8,0) [r=1.3, color=#10b981, label=$B$]\n\\make intersection A, B [color=#f59e0b, label=$A\\cap B$]\n\\end{draw}", desc: "Set & intersection Venn diagram" },
    { cmd: "\\begin{graph}", insert: "\\begin{graph}[directed]\n\\node 1; \\node 2; \\node 3;\n\\edge 1 -> 2 [weight=1];\n\\edge 2 -> 3;\n\\end{graph}", desc: "Graph with nodes & weighted edges" },
    { cmd: "\\begin{tree}", insert: "\\begin{tree}\n\\root $R$\n\\child $A$ { \\child $A_1$ \\child $A_2$ }\n\\child $B$\n\\end{tree}", desc: "Hierarchical tree diagram" },
    { cmd: "\\begin{plot}[2d]", insert: "\\begin{plot}[2d][xlim=[-5,5], ylim=[-2,2], xlabel=$x$, ylabel=$y$, title=Plot 2D, grid=on, numbers=on]\n\\func{sin(x)}[color=#0072BD, linewidth=2, label=$\\sin(x)$]\n\\end{plot}", desc: "MATLAB-style 2D Plot (custom axes, grid, legend)" },
    { cmd: "\\begin{plot}[3d]", insert: "\\begin{plot}[3d][xlim=[-3,3], ylim=[-3,3], zlim=[-1.5,1.5], xlabel=$x$, ylabel=$y$, zlabel=$z$, view=-37.5,30, colormap=parula, colorbar=on]\n\\surface{sin(sqrt(x^2+y^2))}\n\\curve3d{cos(t), sin(t), t/10}[t=0..12.56, color=#D95319, linewidth=2.5]\n\\end{plot}", desc: "MATLAB-style 3D Surface & Curve Plot" },
    { cmd: "\\bmat{}", insert: "\\bmat{[eye(2), [1,0;3,4]; [1,2], [5,6]]}", desc: "MATLAB block matrix with dividers" },
    { cmd: "\\align[]{}", insert: "\\align[center]{$1}", desc: "Text alignment (left/center/right/justify)" },
    { cmd: "\\bigskip", insert: "\\bigskip", desc: "Large vertical spacing" },
    { cmd: "\\medskip", insert: "\\medskip", desc: "Medium vertical spacing" },
    { cmd: "\\smallskip", insert: "\\smallskip", desc: "Small vertical spacing" },
    { cmd: "\\code[]{}", insert: "\\code[python]{\n$1\n}", desc: "Syntax-highlighted code block" },
    { cmd: "\\link{}{}", insert: "\\link{https://$1}{text}", desc: "Hyperlink" },
    { cmd: "\\R", insert: "\\R", desc: "Real numbers ℝ" },
    { cmd: "\\C", insert: "\\C", desc: "Complex numbers ℂ" },
    { cmd: "\\Z", insert: "\\Z", desc: "Integers ℤ" },
    { cmd: "\\Q", insert: "\\Q", desc: "Rationals ℚ" },
    { cmd: "\\N", insert: "\\N", desc: "Naturals ℕ" },
    { cmd: "\\K", insert: "\\K", desc: "Field 𝕂" },
    { cmd: "\\cvec{}", insert: "\\cvec{$1}", desc: "Column vector \\cvec{a,b,c}" },
    { cmd: "\\rvec{}", insert: "\\rvec{$1}", desc: "Row vector \\rvec{a,b,c}" },
    { cmd: "\\mat{}", insert: "\\mat{$1}", desc: "Matrix \\mat{a,b; c,d}" },
    { cmd: "\\system{}", insert: "\\system{$1}", desc: "Equation system \\system{a; b}" }
  ];

  function getAllCompletions(state) {
    const inlineItems = Object.entries(INLINE_COMMANDS).map(([name, def]) => ({
      cmd: "\\" + name + (def.args > 0 ? "{}" : ""),
      insert: def.snippet,
      desc: def.desc
    }));

    const custom = (state.customCommands || [])
      .filter(c => c.name && c.name.startsWith("\\"))
      .map(c => {
        const braces = Array.from({ length: Number(c.args) || 0 }, (_, i) => (i === 0 ? "{$1}" : "{}")).join("");
        return { cmd: c.name + braces, insert: c.name + (braces || "$1"), desc: "Custom user command" };
      });

    const macroMatches = [...(state.latexMacros || "").matchAll(/\\(?:re)?newcommand\{\\([a-zA-Z]+)\}/g)];
    const macroItems = macroMatches.map(m => ({
      cmd: "\\" + m[1],
      insert: "\\" + m[1],
      desc: "User \\newcommand macro"
    }));

    const seen = new Set();
    return [...custom, ...inlineItems, ...STRUCTURAL_COMPLETIONS, ...macroItems].filter(item => {
      if (seen.has(item.cmd)) return false;
      seen.add(item.cmd);
      return true;
    });
  }

  function exportCommandsJSON() {
    const state = Clawri.State.get();
    Clawri.Exporters.downloadFile(
      "clawri-commands.json",
      JSON.stringify(state.customCommands || [], null, 2),
      "application/json"
    );
  }

  return {
    INLINE_COMMANDS,
    LIST_STYLES,
    getAllCompletions,
    exportCommandsJSON
  };
})();

