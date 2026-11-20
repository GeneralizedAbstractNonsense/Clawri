
/* ============================================================================
   MODULE 6: Clawri.Compiler (ClawriTeX -> HTML & LaTeX Macro Preprocessor)
   ============================================================================ */
window.Clawri = window.Clawri || {};

Clawri.Compiler = (function () {
  const { escapeHtml, readBalanced, splitTopLevel, parseKeyValOptions } = Clawri.Utils;

  function expandCustomListMacros(texStr) {
    let res = texStr;

    function replaceMacro(str, name, fn) {
      let out = "";
      let i = 0;
      const token = "\\" + name;
      while (i < str.length) {
        const idx = str.indexOf(token, i);
        if (idx === -1) {
          out += str.slice(i);
          break;
        }
        const nextChar = str[idx + token.length];
        if (nextChar && /[a-zA-Z]/.test(nextChar)) {
          out += str.slice(i, idx + token.length);
          i = idx + token.length;
          continue;
        }
        out += str.slice(i, idx);
        let cursor = idx + token.length;
        while (str[cursor] === " ") cursor++;
        if (str[cursor] === "{") {
          const bal = readBalanced(str, cursor, "{", "}");
          if (bal) {
            out += fn(bal.content);
            i = bal.nextPos;
            continue;
          }
        }
        out += token;
        i = idx + token.length;
      }
      return out;
    }

    res = replaceMacro(res, "cvec", arg => {
      const items = splitTopLevel(arg, ",").map(s => s.trim());
      return `\\begin{pmatrix}${items.join(" \\\\ ")}\\end{pmatrix}`;
    });

    res = replaceMacro(res, "rvec", arg => {
      const items = splitTopLevel(arg, ",").map(s => s.trim());
      return `\\begin{pmatrix}${items.join(" & ")}\\end{pmatrix}`;
    });

    res = replaceMacro(res, "mat", arg => {
      const rows = splitTopLevel(arg, ";").map(r =>
        splitTopLevel(r, ",").map(c => c.trim()).join(" & ")
      );
      return `\\begin{pmatrix}${rows.join(" \\\\ ")}\\end{pmatrix}`;
    });

    res = replaceMacro(res, "system", arg => {
      const rows = splitTopLevel(arg, ";").map(r => r.trim());
      return `\\begin{cases}${rows.join(" \\\\ ")}\\end{cases}`;
    });

    res = replaceMacro(res, "bmat", arg => buildMatlabBlockMatrixLaTeX(arg));

    return res;
  }

  function evalMatlabBlockExpr(expr) {
    const s = expr.trim();
    const eyeM = s.match(/^eye\(\s*(\d+)\s*\)$/i);
    if (eyeM) {
      const n = Math.min(8, Math.max(1, parseInt(eyeM[1], 10)));
      return Array.from({ length: n }, (_, r) =>
        Array.from({ length: n }, (__, c) => (r === c ? "1" : "0"))
      );
    }
    const zeroM = s.match(/^zeros\(\s*(\d+)(?:\s*,\s*(\d+))?\s*\)$/i);
    if (zeroM) {
      const r = Math.min(8, Math.max(1, parseInt(zeroM[1], 10)));
      const c = zeroM[2] ? Math.min(8, Math.max(1, parseInt(zeroM[2], 10))) : r;
      return Array.from({ length: r }, () => Array.from({ length: c }, () => "0"));
    }
    const oneM = s.match(/^ones\(\s*(\d+)(?:\s*,\s*(\d+))?\s*\)$/i);
    if (oneM) {
      const r = Math.min(8, Math.max(1, parseInt(oneM[1], 10)));
      const c = oneM[2] ? Math.min(8, Math.max(1, parseInt(oneM[2], 10))) : r;
      return Array.from({ length: r }, () => Array.from({ length: c }, () => "1"));
    }
    if (s.startsWith("[") && s.endsWith("]")) {
      const inner = s.slice(1, -1).trim();
      const rowStrs = splitTopLevel(inner, ";").filter(x => x.trim().length > 0);
      const grid = [];
      for (const rStr of rowStrs) {
        const colBlocks = splitTopLevel(rStr, ",").map(evalMatlabBlockExpr);
        const maxH = Math.max(...colBlocks.map(b => b.length));
        for (let r = 0; r < maxH; r++) {
          const rowCells = [];
          for (const blk of colBlocks) {
            const w = blk[0] ? blk[0].length : 1;
            if (r < blk.length) rowCells.push(...blk[r]);
            else rowCells.push(...Array(w).fill("0"));
          }
          grid.push(rowCells);
        }
      }
      return grid.length > 0 ? grid : [[""]];
    }
    return [[s]];
  }

  function buildMatlabBlockMatrixLaTeX(rawInput) {
    let clean = rawInput.trim();
    if (clean.startsWith("[") && clean.endsWith("]")) clean = clean.slice(1, -1).trim();
    const blockRowsRaw = splitTopLevel(clean, ";").filter(x => x.trim().length > 0);
    if (blockRowsRaw.length === 0) return "\\begin{pmatrix}\\end{pmatrix}";

    const parsedBlockRows = blockRowsRaw.map(rStr =>
      splitTopLevel(rStr, ",").map(cell => evalMatlabBlockExpr(cell))
    );

    const numBlockCols = Math.max(...parsedBlockRows.map(r => r.length));
    const blockColWidths = Array(numBlockCols).fill(1);
    for (const bRow of parsedBlockRows) {
      bRow.forEach((blk, cIdx) => {
        const w = blk[0] ? blk[0].length : 1;
        if (w > blockColWidths[cIdx]) blockColWidths[cIdx] = w;
      });
    }

    const colSpec = blockColWidths.map(w => "c".repeat(w)).join("|");
    const latexRowGroups = [];

    for (const bRow of parsedBlockRows) {
      const blockHeight = Math.max(...bRow.map(blk => blk.length));
      const subRows = [];
      for (let r = 0; r < blockHeight; r++) {
        const cells = [];
        for (let c = 0; c < numBlockCols; c++) {
          const blk = bRow[c];
          const targetW = blockColWidths[c];
          if (!blk) {
            cells.push(...Array(targetW).fill(""));
          } else {
            const rowVals = r < blk.length ? [...blk[r]] : Array(blk[0].length).fill("");
            while (rowVals.length < targetW) rowVals.push("");
            cells.push(...rowVals);
          }
        }
        subRows.push(cells.join(" & "));
      }
      latexRowGroups.push(subRows.join(" \\\\ "));
    }

    return `\\left(\\begin{array}{${colSpec}} ${latexRowGroups.join(" \\\\ \\hline ")} \\end{array}\\right)`;
  }

  function resolveAssetSrc(src, rewriteMap = null) {
    const clean = src.trim();
    if (rewriteMap && rewriteMap[clean]) return rewriteMap[clean];
    const proj = Clawri.State.getActiveProject();
    if (proj && proj.vfs && proj.vfs.files && proj.vfs.files[clean]) {
      return proj.vfs.files[clean].content;
    }
    return clean;
  }

  /* Trova \end{envName} rispettando eventuali ambienti annidati con lo stesso nome */
  function findMatchingEnd(str, startPos, envName) {
    const openToken = `\\begin{${envName}}`;
    const closeToken = `\\end{${envName}}`;
    let depth = 1;
    let pos = startPos;
    while (pos < str.length) {
      const nextOpen = str.indexOf(openToken, pos);
      const nextClose = str.indexOf(closeToken, pos);
      if (nextClose === -1) return -1;
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        pos = nextOpen + openToken.length;
      } else {
        depth--;
        if (depth === 0) return nextClose;
        pos = nextClose + closeToken.length;
      }
    }
    return -1;
  }

  /* Divide gli \item al livello principale senza spezzare eventuali liste annidate */
  function splitTopLevelItems(body) {
    const items = [];
    let depth = 0;
    let currentStart = -1;
    let i = 0;

    while (i < body.length) {
      if (body.startsWith("\\begin{", i)) {
        const closeBrace = body.indexOf("}", i + 7);
        if (closeBrace !== -1) {
          depth++;
          i = closeBrace + 1;
          continue;
        }
      }
      if (body.startsWith("\\end{", i)) {
        const closeBrace = body.indexOf("}", i + 5);
        if (closeBrace !== -1) {
          depth = Math.max(0, depth - 1);
          i = closeBrace + 1;
          continue;
        }
      }
      if (depth === 0 && body.startsWith("\\item", i)) {
        const after = body[i + 5];
        if (!after || !/[a-zA-Z]/.test(after)) {
          if (currentStart !== -1) {
            items.push(body.slice(currentStart, i).trim());
          }
          currentStart = i + 5;
          i += 5;
          continue;
        }
      }
      i++;
    }

    if (currentStart !== -1) {
      items.push(body.slice(currentStart).trim());
    }
    return items.filter(Boolean);
  }

  function compileDocument(rawSource, assetRewriteMap = null) {
    const proj = Clawri.State.getActiveProject();
    const state = Clawri.State.get();
    const labels = state.labels || Clawri.Config.LABEL_PRESETS.en;
    const mathTokens = [];
    const footnotes = [];
    const indexEntries = [];
    const bibItems = [];
    const theoremCounters = {};

    let hasCopyrightBox = false;
    let customLicenseType = proj.meta.licenseType || "CC BY-NC-ND 4.0";
    let customLicenseBody = null;
    let inlineTitle = null;
    let inlineTag = null;
    let inlineSubtitle = null;
    let inlineAuthor = null;
    let inlineDate = null;
    let inlineFavicon = null;
    let shouldPrintIndex = false;
    let shouldPrintBibFromVfs = false;

    let text = rawSource;

    // 1. Proteggi blocchi matematici $$...$$ e $...$
    text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, inner) => {
      const id = mathTokens.length;
      mathTokens.push({ display: true, raw: "$$" + expandCustomListMacros(inner) + "$$" });
      return `\n\n@@MATH_${id}@@\n\n`;
    });

    text = text.replace(/(?<!\\)\$([^\$\n]+?)\$/g, (_, inner) => {
      const id = mathTokens.length;
      mathTokens.push({ display: false, raw: "$" + expandCustomListMacros(inner) + "$" });
      return `@@MATH_${id}@@`;
    });

    // 2. Rimuovi commenti %
    text = text.split("\n").map(l => l.trim().startsWith("%") ? "" : l).join("\n");

    function parseImageCommand(optArgs, reqArgs) {
      const rawOpt = optArgs[0] || "";
      const src = resolveAssetSrc(reqArgs[0] || "", assetRewriteMap);
      let caption = "";
      let width = "";
      let align = "center";

      if (rawOpt.includes("=")) {
        const opts = parseKeyValOptions(rawOpt);
        caption = opts.caption || "";
        width = opts.width || opts.size || "";
        align = opts.align || opts.pos || "center";
      } else {
        caption = rawOpt;
      }

      let figStyle = "";
      if (align === "left") figStyle = "float:left;margin:6px 22px 14px 0;max-width:48%;";
      else if (align === "right") figStyle = "float:right;margin:6px 0 14px 22px;max-width:48%;";
      else if (align === "full") figStyle = "width:100%;margin:24px 0;";
      if (width) figStyle += `width:${escapeHtml(width)};max-width:100%;`;

      return `<figure class="article-image" style="${figStyle}"><img src="${escapeHtml(src)}" alt="${escapeHtml(caption)}" style="${width ? 'width:100%;' : ''}" />${caption ? `<figcaption>${transformCommands(caption)}</figcaption>` : ""}</figure>`;
    }

    function renderStyledBox(styleKey, boxTitle, envBody) {
      const boxDef = (state.customBoxes || []).find(b => b.name.toLowerCase() === styleKey) || {
        border: "#3b82f6", bg: "rgba(59,130,246,0.08)", text: "inherit", icon: "✦", iconType: "text"
      };
      const iconHtml = boxDef.icon
        ? (boxDef.iconType === "image"
            ? `<img src="${escapeHtml(resolveAssetSrc(boxDef.icon, assetRewriteMap))}" alt="" style="width:18px;height:18px;object-fit:contain;vertical-align:middle;margin-right:7px;" />`
            : `<span style="margin-right:7px;font-style:normal;">${escapeHtml(boxDef.icon)}</span>`)
        : "";
      const headerHtml = (boxTitle || iconHtml)
        ? `<div class="clawri-box-title" style="font-weight:700;margin-bottom:6px;display:flex;align-items:center;">${iconHtml}<span>${transformCommands(boxTitle || styleKey.toUpperCase())}</span></div>`
        : "";
      return `\n\n<div class="clawri-box clawri-box-${escapeHtml(styleKey)}" style="border-left:4px solid ${escapeHtml(boxDef.border)};background:${escapeHtml(boxDef.bg)};color:${escapeHtml(boxDef.text)};padding:14px 18px;margin:22px 0;border-radius:3px;">${headerHtml}<div class="clawri-box-body">${transformCommands(envBody.trim())}</div></div>\n\n`;
    }

    function transformCommands(input) {
      let out = "";
      let i = 0;

      while (i < input.length) {
        if (input.startsWith("@@MATH_", i)) {
          const endTok = input.indexOf("@@", i + 7);
          if (endTok !== -1) {
            out += input.slice(i, endTok + 2);
            i = endTok + 2;
            continue;
          }
        }

        if (input[i] === "\\" && input[i + 1] === "\\") {
          out += "<br />";
          i += 2;
          continue;
        }

        if (input[i] === "\\") {
          const cmdMatch = input.slice(i).match(/^\\([a-zA-Z]+)/);
          if (cmdMatch) {
            const cmdName = cmdMatch[1];
            let cursor = i + cmdMatch[0].length;

            // Leggi eventuali argomenti opzionali [...] prima delle graffe
            const optArgs = [];
            while (input[cursor] === "[") {
              const opt = readBalanced(input, cursor, "[", "]");
              if (!opt) break;
              optArgs.push(opt.content);
              cursor = opt.nextPos;
            }

            // Leggi argomenti obbligatori {...}
            const reqArgs = [];
            while (input[cursor] === "{") {
              const req = readBalanced(input, cursor, "{", "}");
              if (!req) break;
              reqArgs.push(req.content);
              cursor = req.nextPos;
            }

            // ---------------- ENVIRONMENTS: \begin{env}[opt1][opt2] ... \end{env} ----------------
            if (cmdName === "begin" && reqArgs.length >= 1) {
              const envName = reqArgs[0].trim();

              // IMPORTANTE: negli ambienti LaTeX le opzioni [...] stanno DOPO \begin{env}!
              while (input[cursor] === "[" || input[cursor] === " ") {
                if (input[cursor] === " ") {
                  cursor++;
                  continue;
                }
                const optAfter = readBalanced(input, cursor, "[", "]");
                if (!optAfter) break;
                optArgs.push(optAfter.content);
                cursor = optAfter.nextPos;
              }

              const endIdx = findMatchingEnd(input, cursor, envName);
              if (endIdx !== -1) {
                const envBody = input.slice(cursor, endIdx);
                const afterEnd = endIdx + `\\end{${envName}}`.length;
                const envOpts = optArgs;

                if (envName === "center" || envName === "flushleft" || envName === "flushright" || envName === "justify") {
                  const alignMap = { center: "center", flushleft: "left", flushright: "right", justify: "justify" };
                  out += `\n\n<div style="text-align:${alignMap[envName]};margin:14px 0;">${transformCommands(envBody.trim())}</div>\n\n`;
                  i = afterEnd;
                  continue;
                }

                // LISTE: itemize & enumerate (numbers, roman, Roman, alpha, Alpha, dots, square, dash)
                if (envName === "itemize" || envName === "enumerate") {
                  const styleOpt = (envOpts[0] || (envName === "enumerate" ? "numbers" : "dots")).trim();
                  const items = splitTopLevelItems(envBody);
                  const styleConfig = Clawri.Commands.LIST_STYLES[styleOpt] ||
                                      Clawri.Commands.LIST_STYLES[styleOpt.toLowerCase()] ||
                                      { tag: "ul", listStyleType: "disc", htmlType: "" };

                  const liHtml = items.map(it =>
                    `<li style="margin-bottom:6px;display:list-item;">${transformCommands(it)}</li>`
                  ).join("");

                  const typeAttr = styleConfig.htmlType ? ` type="${styleConfig.htmlType}"` : "";
                  out += `\n\n<${styleConfig.tag}${typeAttr} class="clawri-list clawri-list-${escapeHtml(styleOpt)}" style="list-style-type:${styleConfig.listStyleType} !important;list-style-position:outside;padding-left:2.4em;margin:16px 0;">${liHtml}</${styleConfig.tag}>\n\n`;
                  i = afterEnd;
                  continue;
                }

                if (envName === "compose") {
                  const params = (envOpts[0] || "2, row").split(",").map(s => s.trim().toLowerCase());
                  const count = parseInt(params.find(p => /^\d+$/.test(p)) || "2", 10);
                  const layoutType = params.find(p => !/^\d+$/.test(p)) || "row";
                  const compiledInner = transformCommands(envBody);
                  let gridStyle = `display:grid;grid-template-columns:repeat(${Math.max(1, count)}, 1fr);gap:14px;align-items:start;margin:24px 0;`;
                  if (layoutType === "column" || layoutType === "col") {
                    gridStyle = `display:flex;flex-direction:column;gap:14px;margin:24px 0;`;
                  }
                  out += `\n\n<div class="clawri-compose" style="${gridStyle}">${compiledInner}</div>\n\n`;
                  i = afterEnd;
                  continue;
                }

                if (envName === "table") {
                  const tblParams = (envOpts[0] || "").split(",").map(s => s.trim().toLowerCase());
                  const tblStyle = tblParams.find(p => !/^\d+$/.test(p)) || "booktabs";
                  const rowMatches = [...envBody.matchAll(/\\(line|column)(?:\[([^\]]*)\])?\s*([^\n\\]+)/g)];

                  let borderCss = "border-collapse:collapse;width:100%;margin:24px 0;font-size:0.92em;";
                  if (tblStyle === "booktabs") borderCss += "border-top:2px solid currentColor;border-bottom:2px solid currentColor;";
                  else if (tblStyle === "grid") borderCss += "border:1px solid currentColor;";

                  const rowsHtml = rowMatches.map((rm, rIdx) => {
                    const rowOpts = (rm[2] || "").split(",").map(s => s.trim());
                    const bg = rowOpts[0] || (tblStyle === "striped" && rIdx % 2 === 1 ? "rgba(125,125,125,0.08)" : "transparent");
                    const txt = rowOpts[1] || "inherit";
                    const fontOpt = rowOpts[2] || "normal";
                    const rawCells = rm[3].replace(/\|\|\s*$/, "").split("||").map(c => c.trim());
                    const cellTag = (rIdx === 0 && (tblStyle === "booktabs" || fontOpt.includes("bold"))) ? "th" : "td";
                    const rowBorder = (tblStyle === "booktabs" && rIdx === 0)
                      ? "border-bottom:1.5px solid currentColor;"
                      : (tblStyle === "grid" ? "border:1px solid rgba(125,125,125,0.4);" : "border-bottom:1px solid rgba(125,125,125,0.2);");

                    const tds = rawCells.map(c =>
                      `<${cellTag} style="padding:9px 12px;text-align:left;${rowBorder}">${transformCommands(c)}</${cellTag}>`
                    ).join("");
                    return `<tr style="background:${escapeHtml(bg)};color:${escapeHtml(txt)};${fontOpt.includes('bold') ? 'font-weight:700;' : ''}">${tds}</tr>`;
                  }).join("");

                  out += `\n\n<div style="overflow-x:auto;"><table style="${borderCss}">${rowsHtml}</table></div>\n\n`;
                  i = afterEnd;
                  continue;
                }

                if (envName === "box") {
                  const styleKey = (envOpts[0] || "note").trim().toLowerCase();
                  const boxTitle = envOpts[1] || "";
                  out += renderStyledBox(styleKey, boxTitle, envBody);
                  i = afterEnd;
                  continue;
                }

                if (envName === "curiosita") {
                  out += renderStyledBox("curiosita", envOpts[0] || "Curiosità", envBody);
                  i = afterEnd;
                  continue;
                }

                if (envName === "videobox") {
                  out += renderStyledBox("videobox", envOpts[0] || "Video consigliato", envBody);
                  i = afterEnd;
                  continue;
                }

                // TEOREMI, LEMMI, DEFINIZIONI, ESERCIZI CON TITOLO OPZIONALE [...]
                const thmTypes = ["theorem", "lemma", "proposition", "corollary", "definition", "remark", "exercise"];
                if (thmTypes.includes(envName)) {
                  theoremCounters[envName] = (theoremCounters[envName] || 0) + 1;
                  const num = theoremCounters[envName];
                  const labelText = labels[envName + "Label"] || (envName[0].toUpperCase() + envName.slice(1));
                  const optTitle = envOpts[0] ? ` (${transformCommands(envOpts[0])})` : "";
                  const isEx = envName === "exercise";
                  const boxStyle = isEx
                    ? "border:1.5px solid currentColor;padding:14px 18px;margin:22px 0;border-radius:3px;"
                    : "border-left:3px solid currentColor;padding:12px 18px;margin:22px 0;background:rgba(125,125,125,0.05);";
                  out += `\n\n<div class="clawri-thm clawri-${envName}" style="${boxStyle}"><div class="clawri-thm-title" style="font-weight:700;margin-bottom:6px;">${escapeHtml(labelText)} ${num}${optTitle}</div><div class="clawri-thm-body" style="${envName === 'definition' || isEx ? '' : 'font-style:italic;'}">${transformCommands(envBody.trim())}</div></div>\n\n`;
                  i = afterEnd;
                  continue;
                }

                if (envName === "proof") {
                  const pTitle = envOpts[0] ? transformCommands(envOpts[0]) : escapeHtml(labels.proofLabel || "Proof");
                  out += `\n\n<div class="clawri-proof" style="margin:16px 0 24px 0;padding-left:14px;"><em>${pTitle}.</em> ${transformCommands(envBody.trim())} <span style="float:right;font-style:normal;">&#9633;</span><div style="clear:both;"></div></div>\n\n`;
                  i = afterEnd;
                  continue;
                }

                if (envName === "solution") {
                  const sLabel = escapeHtml(labels.solutionLabel || "Solution");
                  out += `\n\n<details class="clawri-solution" open style="margin:12px 0 22px 0;padding:10px 14px;border:1px dashed rgba(125,125,125,0.5);"><summary style="cursor:pointer;font-weight:700;">${sLabel}</summary><div style="margin-top:8px;">${transformCommands(envBody.trim())}</div></details>\n\n`;
                  i = afterEnd;
                  continue;
                }

                // DIAGRAMMI E INSIEMI (\begin{draw}[set], \begin{draw}[diagram], \begin{set}, \begin{venn})
                if (envName === "draw") {
                  const drawType = (envOpts[0] || "diagram").trim().toLowerCase();
                  if (drawType === "set" || drawType === "sets" || drawType === "venn") {
                    out += "\n\n" + Clawri.Graphics.renderSetDiagramSVG(envBody) + "\n\n";
                  } else {
                    out += "\n\n" + Clawri.Graphics.renderDiagramSVG(envBody) + "\n\n";
                  }
                  i = afterEnd;
                  continue;
                }

                if (envName === "set" || envName === "sets" || envName === "venn") {
                  out += "\n\n" + Clawri.Graphics.renderSetDiagramSVG(envBody) + "\n\n";
                  i = afterEnd;
                  continue;
                }

                if (envName === "graph") {
                  out += "\n\n" + Clawri.Graphics.renderGraphSVG(envOpts[0] || "", envBody) + "\n\n";
                  i = afterEnd;
                  continue;
                }

                if (envName === "tree") {
                  out += "\n\n" + Clawri.Graphics.renderTreeSVG(envBody) + "\n\n";
                  i = afterEnd;
                  continue;
                }

                if (envName === "plot") {
                  out += "\n\n" + Clawri.Graphics.renderPlotSVG(envOpts[0] || "2d", envOpts[1] || "", envBody) + "\n\n";
                  i = afterEnd;
                  continue;
                }

                if (envName === "bibliography") {
                  const entries = envBody.split(/\\bibitem/).map(s => s.trim()).filter(Boolean);
                  for (const ent of entries) {
                    const km = ent.match(/^\{([^}]+)\}\s*([\s\S]*)$/);
                    if (km) {
                      bibItems.push({ key: km[1].trim(), html: transformCommands(km[2].trim()) });
                    }
                  }
                  i = afterEnd;
                  continue;
                }
              }
            }

            // ---------------- REGISTRO MODULARE COMANDI INLINE ----------------
            const inlineDef = Clawri.Commands.INLINE_COMMANDS[cmdName];
            if (inlineDef) {
              out += inlineDef.render(reqArgs, optArgs, transformCommands);
              i = cursor;
              continue;
            }

            // ---------------- COMANDI METADATI & STRUTTURALI ----------------
            if (cmdName === "title" && reqArgs.length >= 1) {
              inlineTitle = reqArgs[0].trim();
              if (optArgs[0]) inlineTag = optArgs[0].trim();
              i = cursor;
              continue;
            }

            if (cmdName === "subtitle" && reqArgs.length >= 1) {
              inlineSubtitle = reqArgs[0].trim();
              i = cursor;
              continue;
            }

            if (cmdName === "author" && reqArgs.length >= 1) {
              inlineAuthor = optArgs[0] ? `${reqArgs[0].trim()} (${optArgs[0].trim()})` : reqArgs[0].trim();
              i = cursor;
              continue;
            }

            if (cmdName === "date" && reqArgs.length >= 1) {
              inlineDate = reqArgs[0].trim();
              i = cursor;
              continue;
            }

            if (cmdName === "favicon" && reqArgs.length >= 1) {
              inlineFavicon = resolveAssetSrc(reqArgs[0].trim(), assetRewriteMap);
              i = cursor;
              continue;
            }

            if (cmdName === "solu" && reqArgs.length >= 1) {
              const inner = expandCustomListMacros(reqArgs[0].trim());
              out += `\n\n<div class="clawri-solu" style="text-align:right;color:#991b1b;font-size:0.84em;margin-top:-8px;margin-bottom:12px;">$\\left[\\begin{array}{l} ${inner} \\end{array}\\right]$</div>\n\n`;
              i = cursor;
              continue;
            }

            if (cmdName === "exercisebox" && reqArgs.length >= 2) {
              const exNum = escapeHtml(reqArgs[0].trim());
              const diff = Math.max(0, Math.min(3, parseInt(reqArgs[1].trim(), 10) || 1));
              const dots = [1, 2, 3].map(d =>
                `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${d <= diff ? '#991b1b' : '#9ca3af'};margin:0 1.5px;"></span>`
              ).join("");
              out += `<span class="clawri-ex-badge" style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;margin-right:8px;"><span style="line-height:1;margin-bottom:2px;">${dots}</span><span style="border:1.2px solid #991b1b;border-radius:5px;padding:1px 8px;font-family:'Fira Sans',sans-serif;font-weight:700;font-size:0.9em;color:#111827;">${exNum}</span></span>`;
              i = cursor;
              continue;
            }

            if (cmdName === "copyright") {
              hasCopyrightBox = true;
              if (optArgs[0]) customLicenseType = optArgs[0].trim();
              if (reqArgs[0]) customLicenseBody = transformCommands(reqArgs[0].trim());
              i = cursor;
              continue;
            }

            if (cmdName === "newpage") {
              out += `\n\n<div class="clawri-newpage" style="page-break-before:always;break-before:page;border-top:1px dashed rgba(125,125,125,0.4);margin:32px 0;text-align:center;font-size:10px;opacity:0.5;">— PAGE BREAK —</div>\n\n`;
              i = cursor;
              continue;
            }

            if (cmdName === "pdf") {
              const pStyle = (optArgs[0] || "primary").trim().toLowerCase();
              const btnLabel = reqArgs[0] ? transformCommands(reqArgs[0]) : escapeHtml(labels.pdfDownloadLabel || "Download PDF");
              const cssBtn = pStyle === "minimal"
                ? "background:transparent;border:1px solid currentColor;color:inherit;padding:6px 14px;cursor:pointer;font-size:13px;"
                : "background:#0f172a;border:1px solid #0f172a;color:#ffffff;padding:8px 18px;border-radius:4px;cursor:pointer;font-size:13px;font-weight:600;";
              out += `\n\n<div class="clawri-pdf-btn-wrap" style="margin:18px 0;text-align:center;"><button type="button" onclick="window.print()" style="${cssBtn}">${btnLabel}</button></div>\n\n`;
              i = cursor;
              continue;
            }

            if (cmdName === "section" && reqArgs.length >= 1) {
              out += `\n\n<h2>${transformCommands(reqArgs[0])}</h2>\n\n`;
              i = cursor;
              continue;
            }

            if (cmdName === "subsection" && reqArgs.length >= 1) {
              out += `\n\n<h3>${transformCommands(reqArgs[0])}</h3>\n\n`;
              i = cursor;
              continue;
            }

            if (cmdName === "abstract" && reqArgs.length >= 1) {
              out += `\n\n<div class="abstract-box p-summary"><span class="abstract-label">${escapeHtml(labels.abstractLabel)}</span><p class="abstract-text">${transformCommands(reqArgs[0])}</p></div>\n\n`;
              i = cursor;
              continue;
            }

            if (cmdName === "quote" && reqArgs.length >= 1) {
              const author = optArgs[0] || (reqArgs.length >= 3 ? reqArgs[0] : "");
              const source = optArgs[1] || (reqArgs.length >= 3 ? reqArgs[1] : "");
              const body = reqArgs[reqArgs.length - 1];
              const citeHtml = (author || source)
                ? `<cite>— ${escapeHtml(author)} ${source ? `<span class="quote-source">(${escapeHtml(source)})</span>` : ""}</cite>`
                : "";
              out += `\n\n<blockquote class="quote-box"><p>${transformCommands(body)}</p>${citeHtml}</blockquote>\n\n`;
              i = cursor;
              continue;
            }

            if (cmdName === "poem" && reqArgs.length >= 1) {
              const opt0 = (optArgs[0] || "").toLowerCase();
              const isEvery5 = opt0.includes("every5");
              const isNone = opt0.includes("none");
              const author = !isEvery5 && !isNone ? (optArgs[0] || "") : (optArgs[1] || "");
              const work = !isEvery5 && !isNone ? (optArgs[1] || "") : (optArgs[2] || "");
              const rawPoem = reqArgs[reqArgs.length - 1].trim();
              const stanzas = rawPoem.split(/\n\s*\n|\n\s*-{3,}\s*\n/).map(s => s.trim()).filter(Boolean);

              let vCounter = 0;
              const stanzasHtml = stanzas.map(stanza => {
                const verses = stanza.split("\n").map(v => v.trim()).filter(Boolean);
                const versesHtml = verses.map(v => {
                  vCounter++;
                  const vLabel = isEvery5 ? (vCounter % 5 === 0 ? String(vCounter) : "") : String(vCounter);
                  return `<div class="verse" data-vnum="${vLabel}">${transformCommands(v)}</div>`;
                }).join("");
                return `<div class="stanza">${versesHtml}</div>`;
              }).join("");

              const metaHtml = (author || work)
                ? `<div class="poem-attribution">— ${escapeHtml(author)}${work ? `, <cite>${escapeHtml(work)}</cite>` : ""}</div>`
                : "";
              const cls = isEvery5 ? "poem-every5" : (isNone ? "poem-none" : "");
              out += `\n\n<div class="canto-container ${cls}">${stanzasHtml}${metaHtml}</div>\n\n`;
              i = cursor;
              continue;
            }

            if (cmdName === "poetry" && reqArgs.length >= 1) {
              const allOpts = optArgs.join(" ").toLowerCase();
              const isEvery5 = allOpts.includes("every5");
              const author = optArgs[0] && !optArgs[0].toLowerCase().includes("every5") ? optArgs[0] : "";
              const work = optArgs[1] && !optArgs[1].toLowerCase().includes("every5") ? optArgs[1] : "";
              const rawPoem = reqArgs[reqArgs.length - 1].trim();
              const lines = rawPoem.split("\n");
              let verseCounter = 0;
              const linesHtml = lines.map(line => {
                const trimmed = line.trim();
                if (!trimmed) return "";
                if (/^-{3,}$/.test(trimmed)) return `<div class="verse-divider">-------------</div>`;
                verseCounter++;
                const numText = isEvery5 ? (verseCounter % 5 === 0 ? verseCounter : "") : verseCounter;
                return `<div class="verse-line"><span class="verse-num">${numText}</span><span>${transformCommands(trimmed)}</span></div>`;
              }).join("");

              const metaHtml = (author || work)
                ? `<figcaption class="poem-meta">— ${escapeHtml(author)} ${work ? `<cite>${escapeHtml(work)}</cite>` : ""}</figcaption>`
                : "";

              out += `\n\n<figure class="poem-box"><div class="poem-content">${linesHtml}</div>${metaHtml}</figure>\n\n`;
              i = cursor;
              continue;
            }

            if ((cmdName === "footnote" || cmdName === "footnotehere") && reqArgs.length >= 1) {
              const fnNum = footnotes.length + 1;
              const posMode = cmdName === "footnotehere" ? "here" : (optArgs[0] || proj.meta.footnoteMode || "margin").trim().toLowerCase();
              const fnHtml = transformCommands(reqArgs[0]);
              if (posMode === "here" || posMode === "inline") {
                out += `<span class="clawri-fn-here" style="display:inline-block;background:rgba(125,125,125,0.1);border-left:2px solid currentColor;padding:1px 8px;margin:0 4px;font-size:0.86em;">[${fnNum}: ${fnHtml}]</span>`;
              } else {
                footnotes.push({ num: fnNum, html: fnHtml, mode: posMode });
                out += `<sup class="fn-ref" id="fnref-${fnNum}" data-fnmode="${escapeHtml(posMode)}"><a href="#fn-${fnNum}" data-fn="${fnNum}">[${fnNum}]</a></sup>`;
              }
              i = cursor;
              continue;
            }

            if (cmdName === "index" && reqArgs.length >= 1) {
              const term = reqArgs[0].trim();
              const idxId = "idx_" + (indexEntries.length + 1);
              indexEntries.push({ id: idxId, term });
              out += `<span id="${idxId}" class="clawri-index-anchor"></span>`;
              i = cursor;
              continue;
            }

            if (cmdName === "printindex") {
              shouldPrintIndex = true;
              out += `\n\n@@PRINT_INDEX_SLOT@@\n\n`;
              i = cursor;
              continue;
            }

            if (cmdName === "cite" && reqArgs.length >= 1) {
              const keys = reqArgs[0].split(",").map(k => k.trim()).filter(Boolean);
              const links = keys.map(k => `<a href="#bib-${escapeHtml(k)}" style="text-decoration:none;">${escapeHtml(k)}</a>`).join(", ");
              out += `<span class="clawri-cite">[${links}]</span>`;
              i = cursor;
              continue;
            }

            if (cmdName === "bibliography") {
              shouldPrintBibFromVfs = true;
              i = cursor;
              continue;
            }

            if (cmdName === "code" && reqArgs.length >= 1) {
              const lang = optArgs[0] || "plaintext";
              const codeContent = escapeHtml(reqArgs[0].replace(/^\n+|\n+$/g, ""));
              out += `\n\n<pre><code class="language-${escapeHtml(lang)}">${codeContent}</code></pre>\n\n`;
              i = cursor;
              continue;
            }

            if (cmdName === "image" && reqArgs.length >= 1) {
              out += `\n\n${parseImageCommand(optArgs, reqArgs)}\n\n`;
              i = cursor;
              continue;
            }

            if (cmdName === "link" && reqArgs.length >= 2) {
              out += `<a href="${escapeHtml(reqArgs[0].trim())}" target="_blank" rel="noopener">${transformCommands(reqArgs[1])}</a>`;
              i = cursor;
              continue;
            }

            if (cmdName === "align" && reqArgs.length >= 1) {
              const dir = (optArgs[0] || "center").trim().toLowerCase();
              out += `<div style="text-align:${escapeHtml(dir)};margin:12px 0;">${transformCommands(reqArgs[0])}</div>`;
              i = cursor;
              continue;
            }

            if (cmdName === "bigskip") { out += `<div style="height:28px;"></div>`; i = cursor; continue; }
            if (cmdName === "medskip") { out += `<div style="height:16px;"></div>`; i = cursor; continue; }
            if (cmdName === "smallskip") { out += `<div style="height:8px;"></div>`; i = cursor; continue; }

            // Comandi personalizzati creati dall'utente in :settings
            const customDef = (state.customCommands || []).find(c => c.name === "\\" + cmdName);
            if (customDef) {
              let rendered = customDef.template;
              rendered = rendered.split("{{opt}}").join(optArgs[0] ? transformCommands(optArgs[0]) : "");
              reqArgs.forEach((arg, idx) => {
                const compiledArg = transformCommands(arg);
                rendered = rendered.split(`{{${idx + 1}}}`).join(compiledArg);
              });
              out += rendered;
              i = cursor;
              continue;
            }
          }
        }

        out += input[i];
        i++;
      }
      return out;
    }

    let compiled = transformCommands(text);

    compiled = compiled.replace(/@@MATH_(\d+)@@/g, (_, idx) => {
      const tok = mathTokens[Number(idx)];
      if (!tok) return "";
      return tok.display ? `<div class="math-block">${tok.raw}</div>` : tok.raw;
    });

    if (shouldPrintIndex) {
      const sorted = [...indexEntries].sort((a, b) => a.term.localeCompare(b.term));
      const indexHtml = sorted.length > 0
        ? `<section class="clawri-index"><div class="section-title-box">${escapeHtml(labels.indexTitle || "Analytical Index")}</div><ul style="columns:2;column-gap:28px;list-style:none;padding:0;">${sorted.map(e => `<li style="margin-bottom:5px;"><a href="#${e.id}">${escapeHtml(e.term)}</a></li>`).join("")}</ul></section>`
        : "";
      compiled = compiled.replace("@@PRINT_INDEX_SLOT@@", indexHtml);
    }

    const blocks = compiled.split(/\n{2,}/).map(b => b.trim()).filter(Boolean);
    let searchOffset = 0;

    const htmlBlocks = blocks.map(block => {
      const probe = block.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 26);
      let lineNum = 1;
      let colNum = 1;
      if (probe.length > 2) {
        const foundPos = rawSource.indexOf(probe, searchOffset);
        if (foundPos !== -1) {
          const before = rawSource.slice(0, foundPos);
          const linesBefore = before.split("\n");
          lineNum = linesBefore.length;
          colNum = linesBefore[linesBefore.length - 1].length + 1;
          searchOffset = foundPos;
        }
      }

      const isBlockTag = /^<(h2|h3|div|blockquote|figure|pre|section|ul|ol|table|details)/i.test(block);
      if (isBlockTag) {
        return block.replace(/^<([a-z0-9]+)/i, `<$1 data-source-line="${lineNum}" data-source-col="${colNum}"`);
      }
      return `<p data-source-line="${lineNum}" data-source-col="${colNum}">${block.replace(/\n/g, "<br>")}</p>`;
    });

    if (shouldPrintBibFromVfs && proj.vfs && proj.vfs.files["references.bib"]) {
      const bibRaw = proj.vfs.files["references.bib"].content || "";
      const bibMatches = [...bibRaw.matchAll(/@\w+\{([^,]+),([\s\S]*?)\n\}/g)];
      for (const bm of bibMatches) {
        const key = bm[1].trim();
        if (bibItems.some(x => x.key === key)) continue;
        const body = bm[2];
        const authorM = body.match(/author\s*=\s*[\{"]([^\}"]+)/i);
        const titleM = body.match(/title\s*=\s*[\{"]([^\}"]+)/i);
        const yearM = body.match(/year\s*=\s*[\{"]([^\}"]+)/i);
        const pubM = body.match(/publisher\s*=\s*[\{"]([^\}"]+)/i);
        const formatted = `${authorM ? escapeHtml(authorM[1]) + ", " : ""}${titleM ? `<em>${escapeHtml(titleM[1])}</em>` : escapeHtml(key)}${pubM ? ", " + escapeHtml(pubM[1]) : ""}${yearM ? ", " + escapeHtml(yearM[1]) : ""}.`;
        bibItems.push({ key, html: formatted });
      }
    }

    if (bibItems.length > 0) {
      const bibList = bibItems.map(b =>
        `<li id="bib-${escapeHtml(b.key)}" style="margin-bottom:8px;"><strong>[${escapeHtml(b.key)}]</strong> ${b.html}</li>`
      ).join("");
      htmlBlocks.push(`
        <section class="clawri-bibliography" id="bibliography-section">
          <div class="section-title-box">${escapeHtml(labels.bibliographyTitle || "Bibliography")}</div>
          <ol style="list-style:none;padding-left:0;">${bibList}</ol>
        </section>
      `);
    }

    if (footnotes.length > 0) {
      const fnItems = footnotes.map(fn =>
        `<li id="fn-${fn.num}">${fn.html} <a href="#fnref-${fn.num}" class="fn-backlink">↩</a></li>`
      ).join("");
      htmlBlocks.push(`
        <section class="footnotes" id="footnotes-section">
          <div class="section-title-box">${escapeHtml(labels.footnotesTitle)}</div>
          <ol>${fnItems}</ol>
        </section>
      `);
    }

    const defaultLicenseTexts = {
      "CC BY-NC-ND 4.0": "This work is licensed under a Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License (CC BY-NC-ND 4.0). You may share it with proper attribution to the author and source, without modifying it or using it for commercial purposes.",
      "CC BY 4.0": "This work is licensed under a Creative Commons Attribution 4.0 International License (CC BY 4.0).",
      "CC BY-SA 4.0": "This work is licensed under a Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0).",
      "MIT": "Licensed under the MIT License. Free to use, copy, modify, and distribute with attribution.",
      "PUBLIC DOMAIN": "Dedicated to the Public Domain (CC0 1.0). No rights reserved.",
      "ALL RIGHTS RESERVED": "All rights reserved. No part of this publication may be reproduced without prior permission."
    };

    const licenseHtml = hasCopyrightBox ? `
      <div class="abstract-box p-summary" style="clear:both;">
        <span class="abstract-label">${escapeHtml(labels.licenseTitle)} — ${escapeHtml(customLicenseType)}</span>
        <p class="abstract-text">${customLicenseBody || escapeHtml(defaultLicenseTexts[customLicenseType] || defaultLicenseTexts["CC BY-NC-ND 4.0"])}</p>
      </div>` : "";

    return {
      bodyHtml: htmlBlocks.join("\n"),
      licenseHtml,
      inlineTitle,
      inlineTag,
      inlineSubtitle,
      inlineAuthor,
      inlineDate,
      inlineFavicon
    };
  }

  return {
    expandCustomListMacros,
    resolveAssetSrc,
    compileDocument
  };
})();
