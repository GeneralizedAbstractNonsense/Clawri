/* ============================================================================
   MODULE 3: Clawri.Commands (DECLARATIVE COMMANDS REGISTRY — EASY TO EDIT!)
   Want to add or edit an inline command? Just add an entry to INLINE_COMMANDS!
   ============================================================================ */
Clawri.Commands = (function() {
  const { escapeHtml } = Clawri.Utils;

  /**
   * DECLARATIVE INLINE COMMANDS REGISTRY
   * Each entry defines:
   *  - args: number of required {...} arguments
   *  - desc: description shown in Tab autocomplete
   *  - snippet: text inserted by Tab autocomplete ($1 = cursor position)
   *  - render(reqArgs, optArgs, compileFn): returns clean borderless HTML
   */
  const INLINE_COMMANDS = {
    textbf: {
      args: 1,
      desc: "Bold text",
      snippet: "\\textbf{$1}",
      render: (req, _opt, compile) => `<strong>${compile(req[0])}</strong>`
    },
    textit: {
      args: 1,
      desc: "Italic text",
      snippet: "\\textit{$1}",
      render: (req, _opt, compile) => `<em>${compile(req[0])}</em>`
    },
    underline: {
      args: 1,
      desc: "Custom colored underline",
      snippet: "\\underline[#2563eb]{$1}",
      render: (req, opt, compile) => {
        const col = opt[0] || "currentColor";
        return `<span style="text-decoration:underline;text-decoration-color:${escapeHtml(col)};text-decoration-thickness:2px;text-underline-offset:3px;">${compile(req[0])}</span>`;
      }
    },
    textcolor: {
      args: 1,
      desc: "Colored inline text",
      snippet: "\\textcolor[#2563eb]{$1}",
      render: (req, opt, compile) => {
        const col = opt[0] || (req.length >= 2 ? req[0] : "inherit");
        const body = req[req.length - 1];
        return `<span style="color:${escapeHtml(col)};">${compile(body)}</span>`;
      }
    },
    highlight: {
      args: 1,
      desc: "Marker highlight (borderless)",
      snippet: "\\highlight[#fef08a]{$1}",
      render: (req, opt, compile) => {
        const bg = opt[0] || "#fef08a";
        return `<mark style="background-color:${escapeHtml(bg)};color:#111827;padding:1px 5px;border-radius:3px;">${compile(req[0])}</mark>`;
      }
    },
    fonts: {
      args: 1,
      desc: "Inline font family & size",
      snippet: "\\fonts[Century Gothic, 18px]{$1}",
      render: (req, opt, compile) => {
        const parts = (opt[0] || "").split(",").map(s => s.trim());
        const fam = parts[0] || "inherit";
        const sz = parts[1] || "inherit";
        return `<span style="font-family:${escapeHtml(fam)};font-size:${escapeHtml(sz)};">${compile(req[0])}</span>`;
      }
    },
    codeinline: {
      args: 1,
      desc: "Inline monospace code (borderless)",
      snippet: "\\codeinline{$1}",
      render: (req) => `<code class="clawri-inline-code">${escapeHtml(req[0])}</code>`
    },
    pill: {
      args: 1,
      desc: "Rounded inline pill badge (borderless)",
      snippet: "\\pill{$1}",
      render: (req, opt, compile) => {
        const bg = opt[0] || "";
        const style = bg ? `background:${escapeHtml(bg)};color:#111827;` : "";
        return `<span class="clawri-pill" style="${style}">${compile(req[0])}</span>`;
      }
    },
    tag: {
      args: 1,
      desc: "Inline label tag (borderless)",
      snippet: "\\tag{$1}",
      render: (req, opt, compile) => {
        const bg = opt[0] || "";
        const style = bg ? `background:${escapeHtml(bg)};color:#111827;` : "";
        return `<span class="clawri-tag" style="${style}">${compile(req[0])}</span>`;
      }
    },
    kbd: {
      args: 1,
      desc: "Keyboard key shortcut (borderless)",
      snippet: "\\kbd{$1}",
      render: (req) => `<kbd class="clawri-kbd">${escapeHtml(req[0])}</kbd>`
    },
    smallcaps: {
      args: 1,
      desc: "Small caps typography",
      snippet: "\\smallcaps{$1}",
      render: (req, _opt, compile) => `<span style="font-variant:small-caps;letter-spacing:0.04em;">${compile(req[0])}</span>`
    },
    muted: {
      args: 1,
      desc: "Subtle muted inline note",
      snippet: "\\muted{$1}",
      render: (req, _opt, compile) => `<span style="opacity:0.68;font-size:0.92em;">${compile(req[0])}</span>`
    },
    sub: {
      args: 1,
      desc: "Subscript text",
      snippet: "\\sub{$1}",
      render: (req, _opt, compile) => `<sub>${compile(req[0])}</sub>`
    },
    sup: {
      args: 1,
      desc: "Superscript text",
      snippet: "\\sup{$1}",
      render: (req, _opt, compile) => `<sup>${compile(req[0])}</sup>`
    },
    ipa: {
      args: 1,
      desc: "IPA phonetic transcription",
      snippet: "\\ipa{$1}",
      render: (req, _opt, compile) => `<span class="clawri-ipa" style="font-family:'Gentium Plus','Charis SIL','Noto Serif',serif;letter-spacing:0.02em;background:rgba(125,125,125,0.08);padding:0 4px;border-radius:3px;">${compile(req[0])}</span>`
    },
    greek: {
      args: 1,
      desc: "Polytonic Greek script",
      snippet: "\\greek{$1}",
      render: (req, _opt, compile) => `<span class="clawri-greek" lang="el" style="font-family:'Gentium Plus','GFS Didot','Cardo','Noto Serif',serif;">${compile(req[0])}</span>`
    },
    link: {
      args: 2,
      desc: "Hyperlink \\link{url}{text}",
      snippet: "\\link{https://$1}{text}",
      render: (req, _opt, compile) => `<a href="${escapeHtml(req[0].trim())}" target="_blank" rel="noopener">${compile(req[1])}</a>`
    },
    align: {
      args: 1,
      desc: "Text alignment block",
      snippet: "\\align[center]{$1}",
      render: (req, opt, compile) => {
        const dir = (opt[0] || "center").trim().toLowerCase();
        return `<div style="text-align:${escapeHtml(dir)};margin:12px 0;">${compile(req[0])}</div>`;
      }
    },
    bigskip: { args: 0, desc: "Large vertical spacing", snippet: "\\bigskip", render: () => `<div style="height:28px;"></div>` },
    medskip: { args: 0, desc: "Medium vertical spacing", snippet: "\\medskip", render: () => `<div style="height:16px;"></div>` },
    smallskip: { args: 0, desc: "Small vertical spacing", snippet: "\\smallskip", render: () => `<div style="height:8px;"></div>` },
    dots: { args: 0, desc: "Horizontal ellipsis …", snippet: "\\dots", render: () => `&hellip;` },
    ldots: { args: 0, desc: "Horizontal ellipsis …", snippet: "\\ldots", render: () => `&hellip;` },
    cdots: { args: 0, desc: "Centered dots ⋯", snippet: "\\cdots", render: () => `&ctdot;` },
    vdots: { args: 0, desc: "Vertical dots ⋮", snippet: "\\vdots", render: () => `&vellip;` },
    ddots: { args: 0, desc: "Diagonal dots ⋱", snippet: "\\ddots", render: () => `&dtdot;` }
  };

  /**
   * LIST STYLE RESOLVER (Case-sensitive for Roman vs roman, Alpha vs alpha!)
   */
  function resolveListConfig(envName, rawOpt) {
    const opt = (rawOpt || (envName === "enumerate" ? "numbers" : "dots")).trim();
    const low = opt.toLowerCase();

    if (opt === "Roman" || opt === "ROMAN" || opt === "I" || low === "upper-roman" || low === "roman-upper") {
      return { tag: "ol", cssType: "upper-roman" };
    }
    if (low === "roman" || opt === "i" || low === "lower-roman" || low === "roman-lower") {
      return { tag: "ol", cssType: "lower-roman" };
    }
    if (low === "numbers" || low === "number" || opt === "1" || low === "decimal") {
      return { tag: "ol", cssType: "decimal" };
    }
    if (opt === "Alpha" || opt === "ALPHA" || opt === "A" || low === "upper-alpha" || low === "alpha-upper") {
      return { tag: "ol", cssType: "upper-alpha" };
    }
    if (low === "alpha" || opt === "a" || low === "lower-alpha" || low === "alpha-lower") {
      return { tag: "ol", cssType: "lower-alpha" };
    }
    if (low === "circle" || opt === "o") {
      return { tag: "ul", cssType: "circle" };
    }
    if (low === "square") {
      return { tag: "ul", cssType: "square" };
    }
    if (low === "dash" || opt === "-") {
      return { tag: "ul", cssType: "'–  '" };
    }
    if (low === "none") {
      return { tag: "ul", cssType: "none" };
    }
    return { tag: "ul", cssType: "disc" };
  }

  /**
   * Split \item entries ONLY at top-level (ignoring \item inside nested itemize/enumerate)
   */
  function splitTopLevelItems(envBody) {
    const items = [];
    let depth = 0;
    let i = 0;
    let currentStart = -1;

    while (i < envBody.length) {
      if (envBody.startsWith("\\begin{itemize}", i) || envBody.startsWith("\\begin{enumerate}", i)) {
        depth++;
        i += 15;
        continue;
      }
      if (envBody.startsWith("\\end{itemize}", i) || envBody.startsWith("\\end{enumerate}", i)) {
        depth = Math.max(0, depth - 1);
        i += 13;
        continue;
      }
      if (depth === 0 && envBody.slice(i).match(/^\\item(?![a-zA-Z])/)) {
        if (currentStart !== -1) {
          items.push(envBody.slice(currentStart, i).trim());
        }
        i += 5;
        currentStart = i;
        continue;
      }
      i++;
    }
    if (currentStart !== -1) {
      items.push(envBody.slice(currentStart).trim());
    }
    return items.filter(Boolean);
  }

  function exportCommandsJSON() {
    const payload = {
      customCommands: Clawri.State.data.customCommands || [],
      customBoxes: Clawri.State.data.customBoxes || []
    };
    Clawri.Exporters.downloadFile("commands.json", JSON.stringify(payload, null, 2), "application/json");
    Clawri.UI.setStatus("Exported commands.json");
  }

  return {
    INLINE_COMMANDS,
    resolveListConfig,
    splitTopLevelItems,
    exportCommandsJSON
  };
})();

