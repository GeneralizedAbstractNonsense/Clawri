
/* ============================================================================
   MODULE 6: Clawri.Compiler (ClawriTeX -> HTML & LaTeX Macro Preprocessor)
   ============================================================================ */
Clawri.Compiler = (function() {
  const { escapeHtml, splitTopLevel, parseKeyValOptions, readBalanced, findMatchingEndEnv } = Clawri.Utils;

  function evalMatlabBlockExpr(expr) {
    const s = expr.trim();
    const eyeM = s.match(/^eye\(\s*(\d+)\s*\)$/i);
    if (eyeM) {
      const n = Math.min(8, Math.max(1, parseInt(eyeM[1], 10)));
      return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (__, c) => (r === c ? "1" : "0")));
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

    const parsedBlockRows = blockRowsRaw.map(rStr => splitTopLevel(rStr, ",").map(cell => evalMatlabBlockExpr(cell)));
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
          if (!blk) cells.push(...Array(targetW).fill(""));
          else {
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

  function expandCustomListMacros(texStr) {
    let res = texStr;
    function replaceMacro(str, name, fn) {
      let out = "", i = 0;
      const token = "\\" + name;
      while (i < str.length) {
        const idx = str.indexOf(token, i);
        if (idx === -1) { out += str.slice(i); break; }
        const nextChar = str[idx + token.length];
        if (nextChar && /[a-zA-Z]/.test(nextChar)) { out += str.slice(i, idx + token.length); i = idx + token.length; continue; }
        out += str.slice(i, idx);
        let cursor = idx + token.length;
        while (str[cursor] === " ") cursor++;
        if (str[cursor] === "{") {
          const bal = readBalanced(str, cursor, "{", "}");
          if (bal) { out += fn(bal.content); i = bal.nextPos; continue; }
        }
        out += token;
        i = idx + token.length;
      }
      return out;
    }

    res = replaceMacro(res, "cvec", arg => `\\begin{pmatrix}${splitTopLevel(arg, ",").map(s => s.trim()).join(" \\\\ ")}\\end{pmatrix}`);
    res = replaceMacro(res, "rvec", arg => `\\begin{pmatrix}${splitTopLevel(arg, ",").map(s => s.trim()).join(" & ")}\\end{pmatrix}`);
    res = replaceMacro(res, "mat", arg => `\\begin{pmatrix}${splitTopLevel(arg, ";").map(r => splitTopLevel(r, ",").map(c => c.trim()).join(" & ")).join(" \\\\ ")}\\end{pmatrix}`);
    res = replaceMacro(res, "system", arg => `\\begin{cases}${splitTopLevel(arg, ";").map(r => r.trim()).join(" \\\\ ")}\\end{cases}`);
    res = replaceMacro(res, "bmat", arg => buildMatlabBlockMatrixLaTeX(arg));
    return res;
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

  function compileDocument(rawSource, assetRewriteMap = null) {
    const state = Clawri.State.data;
    const proj = Clawri.State.getActiveProject();
    const labels = state.labels || Clawri.Config.LABEL_PRESETS.en;
    const mathTokens = [];
    const footnotes = [];
    const indexEntries = [];
    const bibItems = [];
    const theoremCounters = {};

    let hasCopyrightBox = false;
    let customLicenseType = proj.meta.licenseType || "CC BY-NC-ND 4.0";
    let customLicenseBody = null;
    let inlineTitle = null, inlineTag = null, inlineSubtitle = null, inlineAuthor = null, inlineDate = null, inlineFavicon = null;
    let shouldPrintIndex = false, shouldPrintBibFromVfs = false;

    let text = rawSource;

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

    text = text.split("\n").map(l => l.trim().startsWith("%") ? "" : l).join("\n");

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
          if (endTok !== -1) { out += input.slice(i, endTok + 2); i = endTok + 2; continue; }
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

            const optArgs = [];
            while (input[cursor] === "[") {
              const opt = readBalanced(input, cursor, "[", "]");
              if (!opt) break;
              optArgs.push(opt.content);
              cursor = opt.nextPos;
            }

            const reqArgs = [];
            while (input[cursor] === "{") {
              const req = readBalanced(input, cursor, "{", "}");
              if (!req) break;
              reqArgs.push(req.content);
              cursor = req.nextPos;
            }

            // 1. ENVIRONMENTS (\begin{...} ... \end{...})
            if (cmdName === "begin" && reqArgs.length >= 1) {
              const envName = reqArgs[0].trim();
              const endIdx = findMatchingEndEnv(input, cursor, envName);
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

                // FIXED ITEMIZE & ENUMERATE (numbers, roman, Roman, alpha, Alpha, dots, nested!)
                if (envName === "itemize" || envName === "enumerate") {
                  const { tag, cssType } = Clawri.Commands.resolveListConfig(envName, envOpts[0]);
                  const items = Clawri.Commands.splitTopLevelItems(envBody);
                  const liHtml = items.map(it => `<li style="margin-bottom:6px;">${transformCommands(it)}</li>`).join("");
                  out += `\n\n<${tag} style="list-style-type:${cssType};padding-left:26px;margin:18px 0;">${liHtml}</${tag}>\n\n`;
                  i = afterEnd;
                  continue;
                }

                if (envName === "compose") {
                  const params = (envOpts[0] || "2, row").split(",").map(s => s.trim().toLowerCase());
                  const count = parseInt(params.find(p => /^\d+$/.test(p)) || "2", 10);
                  const layoutType = params.find(p => !/^\d+$/.test(p)) || "row";
                  const gridStyle = (layoutType === "column" || layoutType === "col")
                    ? `display:flex;flex-direction:column;gap:14px;margin:24px 0;`
                    : `display:grid;grid-template-columns:repeat(${Math.max(1, count)}, 1fr);gap:14px;align-items:start;margin:24px 0;`;
                  out += `\n\n<div class="clawri-compose" style="${gridStyle}">${transformCommands(envBody)}</div>\n\n`;
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
                    const tds = rawCells.map(c => `<${cellTag} style="padding:9px 12px;text-align:left;${rowBorder}">${transformCommands(c)}</${cellTag}>`).join("");
                    return `<tr style="background:${escapeHtml(bg)};color:${escapeHtml(txt)};${fontOpt.includes('bold') ? 'font-weight:700;' : ''}">${tds}</tr>`;
                  }).join("");
                  out += `\n\n<div style="overflow-x:auto;"><table style="${borderCss}">${rowsHtml}</table></div>\n\n`;
                  i = afterEnd;
                  continue;
                }

                if (envName === "box") {
                  out += renderStyledBox((envOpts[0] || "note").trim().toLowerCase(), envOpts[1] || "", envBody);
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
                  const pLabel = envOpts[0] ? transformCommands(envOpts[0]) : escapeHtml(labels.proofLabel || "Proof");
                  out += `\n\n<div class="clawri-proof" style="margin:16px 0 24px 0;"><em style="font-weight:600;">${pLabel}.</em> ${transformCommands(envBody.trim())} <span style="float:right;font-style:normal;">&#9723;</span><div style="clear:both;"></div></div>\n\n`;
                  i = afterEnd;
                  continue;
                }

                if (envName === "solution") {
                  const sLabel = envOpts[0] ? transformCommands(envOpts[0]) : escapeHtml(labels.solutionLabel || "Solution");
                  out += `\n\n<details class="clawri-solution" open style="margin:14px 0 22px 0;padding:12px 16px;border-left:3px solid #10b981;background:rgba(16,185,129,0.06);"><summary style="cursor:pointer;font-weight:700;margin-bottom:6px;">${sLabel}</summary><div>${transformCommands(envBody.trim())}</div></details>\n\n`;
                  i = afterEnd;
                  continue;
                }

                if (envName === "draw") {
                  const drawKind = (envOpts[0] || "diagram").trim().toLowerCase();
                  out += `\n\n${drawKind === "set" ? Clawri.Graphics.renderSetDiagramSVG(envBody) : Clawri.Graphics.renderDiagramSVG(envBody)}\n\n`;
                  i = afterEnd;
                  continue;
                }

                if (envName === "graph") {
                  out += `\n\n${Clawri.Graphics.renderGraphSVG(envOpts[0] || "", envBody)}\n\n`;
                  i = afterEnd;
                  continue;
                }

                if (envName === "tree") {
                  out += `\n\n${Clawri.Graphics.renderTreeSVG(envBody)}\n\n`;
                  i = afterEnd;
                  continue;
                }

                if (envName === "plot") {
                  out += `\n\n${Clawri.Graphics.renderPlotSVG(envOpts[0] || "2d", envOpts[1] || "", envBody)}\n\n`;
                  i = afterEnd;
                  continue;
                }

                if (envName === "bibliography") {
                  const bibMatches = [...envBody.matchAll(/\\bibitem(?:\[([^\]]*)\])?\{([^}]+)\}([\s\S]*?)(?=\\bibitem|$)/g)];
                  bibMatches.forEach((bm, idx) => {
                    bibItems.push({
                      key: bm[2].trim(),
                      label: bm[1] ? bm[1].trim() : String(idx + 1),
                      text: transformCommands(bm[3].trim())
                    });
                  });
                  out += `\n\n@@PRINT_BIBLIOGRAPHY@@\n\n`;
                  i = afterEnd;
                  continue;
                }
              }
            }

            // 2. USER-DEFINED CUSTOM COMMANDS FROM SETTINGS
            const customMatch = (state.customCommands || []).find(c => c.name === "\\" + cmdName);
            if (customMatch && reqArgs.length >= (Number(customMatch.args) || 0)) {
              let tpl = customMatch.template || "";
              tpl = tpl.replace(/\{\{opt\}\}/g, optArgs[0] || "");
              reqArgs.forEach((argVal, idx) => {
                tpl = tpl.replace(new RegExp(`\\{\\{${idx + 1}\\}\\}`, "g"), transformCommands(argVal));
              });
              out += tpl;
              i = cursor;
              continue;
            }

            // 3. DECLARATIVE INLINE COMMANDS REGISTRY (Clawri.Commands.INLINE_COMMANDS)
            const inlineDef = Clawri.Commands.INLINE_COMMANDS[cmdName];
            if (inlineDef && reqArgs.length >= inlineDef.args) {
              out += inlineDef.render(reqArgs, optArgs, transformCommands);
              i = cursor;
              continue;
            }

            // 4. DOCUMENT METADATA & STRUCTURAL COMMANDS
            if (cmdName === "title" && reqArgs.length >= 1) {
              if (optArgs[0]) inlineTag = optArgs[0];
              inlineTitle = reqArgs[0];
              i = cursor; continue;
            }
            if (cmdName === "subtitle" && reqArgs.length >= 1) {
              inlineSubtitle = reqArgs[0];
              i = cursor; continue;
            }
            if (cmdName === "author" && reqArgs.length >= 1) {
              inlineAuthor = optArgs[0] ? `${reqArgs[0]} (${optArgs[0]})` : reqArgs[0];
              i = cursor; continue;
            }
            if (cmdName === "date" && reqArgs.length >= 1) {
              inlineDate = reqArgs[0];
              i = cursor; continue;
            }
            if (cmdName === "favicon" && reqArgs.length >= 1) {
              inlineFavicon = resolveAssetSrc(reqArgs[0], assetRewriteMap);
              i = cursor; continue;
            }
            if (cmdName === "newpage") {
              out += `\n\n<div class="clawri-page-break" style="page-break-after:always;break-after:page;border-top:1px dashed rgba(125,125,125,0.35);margin:32px 0;"></div>\n\n`;
              i = cursor; continue;
            }
            if (cmdName === "pdf") {
              const btnLabel = reqArgs[0] || labels.pdfDownloadLabel || "Download PDF";
              out += `\n\n<div class="clawri-pdf-btn-wrap" style="margin:20px 0;text-align:center;"><button onclick="window.print()" style="cursor:pointer;padding:9px 20px;font-family:inherit;font-size:0.85em;font-weight:700;background:#0f172a;color:#ffffff;border:none;border-radius:4px;">&#128196; ${escapeHtml(btnLabel)}</button></div>\n\n`;
              i = cursor; continue;
            }
            if (cmdName === "section" && reqArgs.length >= 1) {
              out += `\n\n<h2>${transformCommands(reqArgs[0])}</h2>\n\n`;
              i = cursor; continue;
            }
            if (cmdName === "subsection" && reqArgs.length >= 1) {
              out += `\n\n<h3>${transformCommands(reqArgs[0])}</h3>\n\n`;
              i = cursor; continue;
            }
            if (cmdName === "abstract" && reqArgs.length >= 1) {
              out += `\n\n<div class="abstract-box"><span class="abstract-label">${escapeHtml(labels.abstractLabel)}</span><p class="abstract-text">${transformCommands(reqArgs[0])}</p></div>\n\n`;
              i = cursor; continue;
            }
            if (cmdName === "quote" && reqArgs.length >= 1) {
              const qAuthor = optArgs[0] || "", qSource = optArgs[1] || "";
              const citeStr = [qAuthor, qSource].filter(Boolean).join(" — ");
              out += `\n\n<blockquote class="quote-box"><p>${transformCommands(reqArgs[0])}</p>${citeStr ? `<cite>— ${escapeHtml(citeStr)}</cite>` : ""}</blockquote>\n\n`;
              i = cursor; continue;
            }
            if (cmdName === "solu" && reqArgs.length >= 1) {
              out += `\n\n<div style="text-align:right;font-size:0.9em;color:#991b1b;font-family:var(--font-sans);margin:4px 0 12px 0;">[${transformCommands(reqArgs[0])}]</div>\n\n`;
              i = cursor; continue;
            }
            if (cmdName === "exercisebox" && reqArgs.length >= 2) {
              const exNum = escapeHtml(reqArgs[0].trim());
              const diff = Math.min(3, Math.max(1, parseInt(reqArgs[1].trim(), 10) || 1));
              const stars = "●".repeat(diff) + "○".repeat(3 - diff);
              out += `<span style="display:inline-flex;align-items:center;gap:6px;background:#fef2f2;color:#991b1b;padding:2px 8px;border-radius:4px;font-family:var(--font-sans);font-weight:700;font-size:0.88em;margin-right:6px;">Es. ${exNum} <span style="font-size:0.85em;letter-spacing:1px;">${stars}</span></span>`;
              i = cursor; continue;
            }
            if (cmdName === "image" && reqArgs.length >= 1) {
              const rawOpt = optArgs[0] || "";
              const src = resolveAssetSrc(reqArgs[0] || "", assetRewriteMap);
              let caption = "", width = "", align = "center";
              if (rawOpt.includes("=")) {
                const opts = parseKeyValOptions(rawOpt);
                caption = opts.caption || ""; width = opts.width || opts.size || ""; align = opts.align || opts.pos || "center";
              } else { caption = rawOpt; }
              let figStyle = "";
              if (align === "left") figStyle = "float:left;margin:6px 22px 14px 0;max-width:48%;";
              else if (align === "right") figStyle = "float:right;margin:6px 0 14px 22px;max-width:48%;";
              else if (align === "full") figStyle = "width:100%;margin:24px 0;";
              if (width) figStyle += `width:${escapeHtml(width)};max-width:100%;`;
              out += `\n\n<figure class="article-image" style="${figStyle}"><img src="${escapeHtml(src)}" alt="${escapeHtml(caption)}" style="${width ? 'width:100%;' : ''}" />${caption ? `<figcaption>${transformCommands(caption)}</figcaption>` : ""}</figure>\n\n`;
              i = cursor; continue;
            }
            if (cmdName === "code" && reqArgs.length >= 1) {
              const lang = optArgs[0] || "plaintext";
              out += `\n\n<pre><code class="language-${escapeHtml(lang)}">${escapeHtml(reqArgs[0].replace(/^\n+|\n+$/g, ""))}</code></pre>\n\n`;
              i = cursor; continue;
            }
            if (cmdName === "index" && reqArgs.length >= 1) {
              const term = reqArgs[0].trim();
              const idxId = "idx_" + (indexEntries.length + 1);
              indexEntries.push({ id: idxId, term });
              out += `<span id="${idxId}" class="clawri-index-anchor"></span>`;
              i = cursor; continue;
            }
            if (cmdName === "printindex") {
              shouldPrintIndex = true;
              out += `\n\n@@PRINT_INDEX@@\n\n`;
              i = cursor; continue;
            }
            if (cmdName === "cite" && reqArgs.length >= 1) {
              const keys = reqArgs[0].split(",").map(s => s.trim()).filter(Boolean);
              const links = keys.map(k => `<a href="#bib-${escapeHtml(k)}" class="clawri-cite" style="text-decoration:none;font-weight:600;">[${escapeHtml(k)}]</a>`);
              out += links.join(", ");
              i = cursor; continue;
            }
            if (cmdName === "bibliography") {
              shouldPrintBibFromVfs = true;
              out += `\n\n@@PRINT_BIBLIOGRAPHY@@\n\n`;
              i = cursor; continue;
            }
            if ((cmdName === "footnote" || cmdName === "footnotehere") && reqArgs.length >= 1) {
              const placement = cmdName === "footnotehere" ? "here" : (optArgs[0] || proj.meta.footnoteMode || "margin").trim().toLowerCase();
              const num = footnotes.length + 1;
              const compiledNote = transformCommands(reqArgs[0]);
              footnotes.push({ num, html: compiledNote, placement });
              if (placement === "here") {
                out += `<sup class="fn-ref">[${num}]</sup><span class="clawri-footnote-here" style="display:inline-block;margin:0 4px;padding:1px 8px;background:rgba(125,125,125,0.10);border-radius:4px;font-size:0.84em;"><strong>[${num}]</strong> ${compiledNote}</span>`;
              } else {
                out += `<sup class="fn-ref" id="ref-${num}"><a href="#fn-${num}" data-fn-id="${num}" onclick="openFootnote(${num}); return false;">[${num}]</a></sup>`;
              }
              i = cursor; continue;
            }
            if (cmdName === "poem" && reqArgs.length >= 1) {
              const numMode = (optArgs[0] || "all").trim().toLowerCase();
              const rawPoem = reqArgs[0].trim();
              const stanzas = rawPoem.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
              let verseCounter = 0;
              const stanzasHtml = stanzas.map(stanza => {
                const lines = stanza.split("\n").map(l => l.trim()).filter(Boolean);
                const versesHtml = lines.map(line => {
                  verseCounter++;
                  const showNum = numMode === "all" ? verseCounter : (numMode === "every5" && verseCounter % 5 === 0 ? verseCounter : "");
                  return `<div class="verse" data-vnum="${showNum}">${transformCommands(line)}</div>`;
                }).join("");
                return `<div class="stanza">${versesHtml}</div>`;
              }).join("");
              const attrHtml = optArgs[1] ? `<div class="poem-attribution">— ${escapeHtml(optArgs[1])}</div>` : "";
              out += `\n\n<div class="canto-container poem-${escapeHtml(numMode)}">${stanzasHtml}${attrHtml}</div>\n\n`;
              i = cursor; continue;
            }
            if (cmdName === "poetry" && reqArgs.length >= 1) {
              const pAuthor = optArgs[0] || "", pSource = optArgs[1] || "";
              const rawPoem = reqArgs[0].trim();
              const rawLines = rawPoem.split("\n");
              let verseCount = 0;
              const linesHtml = rawLines.map(line => {
                const trimmed = line.trim();
                if (!trimmed) return `<div class="verse-divider">* * *</div>`;
                verseCount++;
                return `<div class="verse-line"><span class="verse-num">${verseCount}</span><span>${transformCommands(trimmed)}</span></div>`;
              }).join("");
              const metaStr = [pAuthor, pSource].filter(Boolean).join(" — ");
              out += `\n\n<figure class="poem-box"><div class="poem-content">${linesHtml}</div>${metaStr ? `<p class="poem-meta">— ${escapeHtml(metaStr)}</p>` : ""}</figure>\n\n`;
              i = cursor; continue;
            }
            if (cmdName === "copyright") {
              hasCopyrightBox = true;
              if (optArgs[0]) customLicenseType = optArgs[0];
              if (reqArgs[0]) customLicenseBody = reqArgs[0];
              i = cursor; continue;
            }
          }
        }

        out += input[i];
        i++;
      }
      return out;
    }

    let html = transformCommands(text);

    // Analytical Index
    if (shouldPrintIndex && indexEntries.length > 0) {
      const sorted = [...indexEntries].sort((a, b) => a.term.localeCompare(b.term));
      const idxHtml = `<section class="clawri-index-section" style="margin-top:36px;"><h3 class="section-title-box">${escapeHtml(labels.indexTitle || "Analytical Index")}</h3><ul style="columns:2;gap:24px;font-size:0.9em;list-style:none;padding:0;">${sorted.map(e => `<li style="margin-bottom:4px;"><a href="#${e.id}">${escapeHtml(e.term)}</a></li>`).join("")}</ul></section>`;
      html = html.replace("@@PRINT_INDEX@@", idxHtml);
    } else {
      html = html.replace("@@PRINT_INDEX@@", "");
    }

    // Bibliography
    if (shouldPrintBibFromVfs && proj.vfs.files["references.bib"]) {
      const bibRaw = proj.vfs.files["references.bib"].content || "";
      const entries = [...bibRaw.matchAll(/@\w+\{([^,]+),([\s\S]*?)\n\}/g)];
      entries.forEach((em, idx) => {
        const key = em[1].trim();
        const body = em[2];
        const titleM = body.match(/title\s*=\s*[\{"]([^\}"]+)[\}"]/i);
        const authorM = body.match(/author\s*=\s*[\{"]([^\}"]+)[\}"]/i);
        const yearM = body.match(/year\s*=\s*[\{"]([^\}"]+)[\}"]/i);
        if (!bibItems.some(b => b.key === key)) {
          bibItems.push({
            key,
            label: String(bibItems.length + 1),
            text: `${authorM ? escapeHtml(authorM[1]) + ", " : ""}<em>${titleM ? escapeHtml(titleM[1]) : escapeHtml(key)}</em>${yearM ? " (" + escapeHtml(yearM[1]) + ")" : ""}.`
          });
        }
      });
    }

    if (bibItems.length > 0) {
      const bibHtml = `<section class="clawri-bibliography" style="margin-top:36px;"><h3 class="section-title-box">${escapeHtml(labels.bibliographyTitle || "Bibliography")}</h3><ol style="font-size:0.92em;padding-left:22px;">${bibItems.map(b => `<li id="bib-${escapeHtml(b.key)}" style="margin-bottom:6px;"><strong>[${escapeHtml(b.key)}]</strong> ${b.text}</li>`).join("")}</ol></section>`;
      if (html.includes("@@PRINT_BIBLIOGRAPHY@@")) html = html.replace("@@PRINT_BIBLIOGRAPHY@@", bibHtml);
      else html += `\n\n${bibHtml}`;
    } else {
      html = html.replace("@@PRINT_BIBLIOGRAPHY@@", "");
    }

    // Paragraph wrapping
    const blocks = html.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
    const wrappedBlocks = blocks.map(block => {
      if (/^<(h[1-6]|div|figure|blockquote|pre|ul|ol|table|section|details|hr)\b/i.test(block)) {
        return block;
      }
      return `<p>${block.replace(/\n/g, " ")}</p>`;
    });

    let finalHtml = wrappedBlocks.join("\n\n");

    // Restore math
    finalHtml = finalHtml.replace(/@@MATH_(\d+)@@/g, (_, idx) => {
      const tok = mathTokens[Number(idx)];
      return tok ? tok.raw : "";
    });

    // Bottom / End Footnotes
    const bottomFootnotes = footnotes.filter(fn => fn.placement !== "here");
    if (bottomFootnotes.length > 0) {
      const fnListItems = bottomFootnotes.map(fn =>
        `<li id="fn-${fn.num}">${fn.html} <a href="#ref-${fn.num}" class="fn-backlink">↩</a></li>`
      ).join("\n");
      finalHtml += `\n\n<section class="footnotes">\n<h3 class="section-title-box">${escapeHtml(labels.footnotesTitle)}</h3>\n<ol>\n${fnListItems}\n</ol>\n</section>`;
    }

    // License box
    if (hasCopyrightBox || customLicenseBody) {
      const licText = customLicenseBody
        ? transformCommands(customLicenseBody)
        : `This work is licensed under <strong>${escapeHtml(customLicenseType)}</strong>.`;
      finalHtml += `\n\n<div class="abstract-box" style="margin-top:36px;">\n<span class="abstract-label">${escapeHtml(labels.licenseTitle)} — ${escapeHtml(customLicenseType)}</span>\n<p class="abstract-text" style="font-style:normal;font-size:15px;">${licText}</p>\n</div>`;
    }

    return {
      bodyHtml: finalHtml,
      footnotes: bottomFootnotes,
      overrides: { inlineTitle, inlineTag, inlineSubtitle, inlineAuthor, inlineDate, inlineFavicon }
    };
  }

  function buildFullDocumentHTML(options = {}) {
    const { isExport = false, assetRewriteMap = null } = options;
    const state = Clawri.State.data;
    const proj = Clawri.State.getActiveProject();
    const compiled = compileDocument(proj.source, assetRewriteMap);
    const labels = state.labels || Clawri.Config.LABEL_PRESETS.en;
    const meta = proj.meta;
    const fonts = state.fonts;
    const ov = compiled.overrides;

    const effectiveTitle = ov.inlineTitle || meta.title || "Untitled Article";
    const effectiveTag = ov.inlineTag !== null ? ov.inlineTag : (meta.tag || "");
    const effectiveSubtitle = ov.inlineSubtitle !== null ? ov.inlineSubtitle : (meta.subtitle || "");
    const effectiveAuthor = ov.inlineAuthor || meta.author || "";
    const effectiveDate = ov.inlineDate || meta.date || "";
    const effectiveFavicon = ov.inlineFavicon || resolveAssetSrc(meta.favicon || "media/icon.png", assetRewriteMap);

    const activeCSS = state.cssByTheme[state.activeTheme] || Clawri.Config.THEME_CLEAN_CSS;

    const extraFonts = (fonts.googleExtra || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)
      .map(f => `family=${encodeURIComponent(f)}:ital,wght@0,400;0,700;1,400`)
      .join("&");

    const googleFontsHref = `https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&family=Fira+Sans:ital,wght@0,400;0,600;0,700;0,800;1,400&family=Gentium+Plus:ital,wght@0,400;0,700;1,400&family=GFS+Didot&family=Cardo:ital,wght@0,400;0,700;1,400&family=Noto+Serif:ital,wght@0,400;0,700;1,400&family=Press+Start+2P&family=VT323${extraFonts ? "&" + extraFonts : ""}&display=swap`;

    const fontOverrideCSS = `
      html, body { font-family: ${fonts.body} !important; font-size: ${fonts.size} !important; }
      .post-title, .article-content h2, .article-content h3 { font-family: ${fonts.heading === 'inherit' ? fonts.body : fonts.heading} !important; }
      code, pre { font-family: ${fonts.code} !important; }
      @page { size: ${meta.pdfSize || 'A4'}; }
    `;

    const fnMapObj = {};
    compiled.footnotes.forEach(f => { fnMapObj[f.num] = f.html; });

    const rawMacros = (state.latexMacros || "")
      .replace(/\\newcommand\{\\(cvec|rvec|mat|system|bmat)\}[\s\S]*?\n/g, "");

    const mathjaxConfigScript = `
    <script>
      window.MathJax = {
        tex: {
          inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
          displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
          processEscapes: true,
          packages: {'[+]': ['ams', 'color', 'boldsymbol', 'newcommand']}
        },
        options: {
          skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
        },
        startup: {
          ready() {
            MathJax.startup.defaultReady();
          }
        }
      };
    <\/script>
    <div style="display:none;" aria-hidden="true">$$${rawMacros}$$</div>`;

    const interactiveFootnotesScript = `
    <script>
      const footnotesData = ${JSON.stringify(fnMapObj)};
      const notePrefixLabel = ${JSON.stringify(labels.notePrefix)};

      function openFootnote(id) {
        const overlay = document.getElementById('fn-overlay');
        const title = document.getElementById('fn-overlay-title');
        const body = document.getElementById('fn-overlay-body');
        if (!overlay || !footnotesData[id]) return;
        title.textContent = notePrefixLabel + ' [' + id + ']';
        body.innerHTML = footnotesData[id];
        overlay.style.display = 'block';
        if (window.MathJax && MathJax.typesetPromise) {
          MathJax.typesetPromise([body]).catch(function(){});
        }
      }

      function closeFootnote() {
        const overlay = document.getElementById('fn-overlay');
        if (overlay) overlay.style.display = 'none';
      }

      function positionDesktopSidenotes() {
        document.querySelectorAll('.sidenote-desktop').forEach(el => el.remove());
        if (window.innerWidth < 1280) return;
        const container = document.querySelector('.article-content');
        if (!container) return;
        const containerRect = container.getBoundingClientRect();
        let lastBottom = 0;

        Object.keys(footnotesData).forEach(id => {
          const ref = document.getElementById('ref-' + id);
          if (!ref) return;
          const refRect = ref.getBoundingClientRect();
          let topPos = refRect.top - containerRect.top;
          if (topPos < lastBottom + 12) topPos = lastBottom + 12;

          const noteDiv = document.createElement('aside');
          noteDiv.className = 'sidenote-desktop';
          noteDiv.style.top = topPos + 'px';
          noteDiv.innerHTML = '<span class="sidenote-num">[' + id + ']</span>' + footnotesData[id];
          container.appendChild(noteDiv);
          lastBottom = topPos + noteDiv.offsetHeight;
        });

        if (window.MathJax && MathJax.typesetPromise) {
          MathJax.typesetPromise(Array.from(document.querySelectorAll('.sidenote-desktop'))).catch(function(){});
        }
      }

      window.addEventListener('load', () => setTimeout(positionDesktopSidenotes, 300));
      window.addEventListener('resize', positionDesktopSidenotes);
      ${isExport ? (state.customJS || "") : ""}
    <\/script>`;

    return `<!DOCTYPE html>
<html lang="${escapeHtml(meta.lang || 'en')}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(effectiveTitle)}</title>
  <meta name="description" content="${escapeHtml(meta.desc)}" />
  <link rel="icon" type="image/png" href="${escapeHtml(effectiveFavicon)}" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${googleFontsHref}" rel="stylesheet">
  <style id="theme-css">${activeCSS}</style>
  <style id="font-override-css">${fontOverrideCSS}</style>
  ${mathjaxConfigScript}
  <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js"><\/script>
</head>
<body>
  <main class="article-wrapper">
    <nav class="top-nav">
      <a href="${escapeHtml(meta.backlink || '/blog.html')}" class="back-home">${escapeHtml(labels.backIndex)}</a>
      <span class="nav-tag">${escapeHtml(effectiveTag)}</span>
    </nav>

    <header class="article-header" data-tag="${escapeHtml(effectiveTag)}">
      <div class="header-main-group">
        <h1 class="post-title" id="doc-title">${escapeHtml(effectiveTitle)}</h1>
        ${effectiveSubtitle ? `<div class="subtitle" id="doc-subtitle">${escapeHtml(effectiveSubtitle)}</div>` : ""}
        <div class="post-meta">
          ${effectiveDate ? `<span>${escapeHtml(labels.dateLabel)} <time>${escapeHtml(effectiveDate)}</time></span>` : ""}
          ${effectiveAuthor ? `<span>${escapeHtml(labels.authorLabel)} ${escapeHtml(effectiveAuthor)}</span>` : ""}
        </div>
      </div>
    </header>

    <article class="article-content" id="article-body">
${compiled.bodyHtml}
    </article>

    <footer class="article-footer">
      <a href="${escapeHtml(meta.backlink || '/blog.html')}">${escapeHtml(labels.footerIndex)}</a>
      <span>${escapeHtml(meta.footer || '')}</span>
    </footer>
  </main>

  <div class="fn-overlay" id="fn-overlay">
    <div class="fn-overlay-content">
      <div class="fn-overlay-header">
        <span id="fn-overlay-title">${escapeHtml(labels.notePrefix)}</span>
        <button class="fn-overlay-close" onclick="closeFootnote()">${escapeHtml(labels.closeBtn)}</button>
      </div>
      <div id="fn-overlay-body" style="font-size: 16px; line-height: 1.5;"></div>
    </div>
  </div>

  ${interactiveFootnotesScript}
</body>
</html>`;
  }

  return {
    compileDocument,
    buildFullDocumentHTML,
    resolveAssetSrc
  };
})();
