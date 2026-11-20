/* ============================================================================
   MODULE 5: Clawri.Graphics (Diagrams, Sets, Graphs, Trees, Clipped 2D/3D Plots)
   ============================================================================ */
Clawri.Graphics = (function() {
  const { escapeHtml, splitTopLevel, parseKeyValOptions, readBalanced, safeMathEval } = Clawri.Utils;

  function renderDiagramSVG(content) {
    const nodes = {};
    const arrows = [];
    const lines = content.split("\n").map(l => l.trim()).filter(Boolean);

    for (const line of lines) {
      const nMatch = line.match(/^\\node\s*\(([^)]+)\)\s*(?:at\s*\(([^,]+),([^)]+)\))?\s*\{([\s\S]*)\}/);
      if (nMatch) {
        nodes[nMatch[1].trim()] = {
          id: nMatch[1].trim(),
          x: nMatch[2] !== undefined ? parseFloat(nMatch[2]) : Object.keys(nodes).length * 2.5,
          y: nMatch[3] !== undefined ? parseFloat(nMatch[3]) : 0,
          label: nMatch[4].trim()
        };
        continue;
      }
      const aMatch = line.match(/^\\arrow\s*\(([^)]+)\)\s*(->|<->|=>|<=>|-->|-\.>)\s*\(([^)]+)\)\s*(?:\[([^\]]*)\])?/);
      if (aMatch) {
        arrows.push({
          from: aMatch[1].trim(),
          type: aMatch[2].trim(),
          to: aMatch[3].trim(),
          opts: parseKeyValOptions(aMatch[4] || "")
        });
      }
    }

    const nodeList = Object.values(nodes);
    if (nodeList.length === 0) return `<div class="clawri-diagram-box"><em>Empty diagram</em></div>`;

    const xs = nodeList.map(n => n.x);
    const ys = nodeList.map(n => -n.y);
    const minX = Math.min(...xs) - 1.2, maxX = Math.max(...xs) + 1.2;
    const minY = Math.min(...ys) - 1.0, maxY = Math.max(...ys) + 1.0;
    const scale = 85;
    const width = Math.max(320, (maxX - minX) * scale);
    const height = Math.max(180, (maxY - minY) * scale);
    const toPx = (x, y) => ({ px: (x - minX) * scale, py: (-y - minY) * scale });

    const uid = "diag_" + Math.random().toString(36).slice(2, 7);
    let svgInner = `
      <defs>
        <marker id="${uid}_arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill="currentColor" />
        </marker>
        <marker id="${uid}_arrow_start" markerWidth="10" markerHeight="10" refX="1" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M9,0 L9,6 L0,3 z" fill="currentColor" />
        </marker>
      </defs>`;

    for (const ar of arrows) {
      const n1 = nodes[ar.from], n2 = nodes[ar.to];
      if (!n1 || !n2) continue;
      const p1 = toPx(n1.x, n1.y), p2 = toPx(n2.x, n2.y);
      const dx = p2.px - p1.px, dy = p2.py - p1.py;
      const dist = Math.hypot(dx, dy) || 1;
      const ux = dx / dist, uy = dy / dist;
      const pad = 24;
      const sx = p1.px + ux * pad, sy = p1.py + uy * pad;
      const ex = p2.px - ux * pad, ey = p2.py - uy * pad;
      const bend = parseFloat(ar.opts.bend || "0");
      const mx = (sx + ex) / 2 - uy * bend;
      const my = (sy + ey) / 2 + ux * bend;

      const dashed = (ar.type === "-->" || ar.type === "-.>" || ar.opts.style === "dashed") ? `stroke-dasharray="5,4"` : "";
      const isDouble = ar.type === "=>" || ar.type === "<=>";
      const hasStart = ar.type === "<->" || ar.type === "<=>";
      const color = ar.opts.color || "currentColor";

      svgInner += `<path d="M ${sx.toFixed(1)} ${sy.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}" fill="none" stroke="${escapeHtml(color)}" stroke-width="${isDouble ? 2.6 : 1.6}" ${dashed} marker-end="url(#${uid}_arrow)" ${hasStart ? `marker-start="url(#${uid}_arrow_start)"` : ""} />`;

      if (ar.opts.label) {
        const sideMult = ar.opts.side === "left" ? -1 : 1;
        const lx = mx - uy * 14 * sideMult;
        const ly = my + ux * 14 * sideMult;
        svgInner += `<foreignObject x="${lx - 55}" y="${ly - 14}" width="110" height="28"><div xmlns="http://www.w3.org/1999/xhtml" style="text-align:center;font-size:13px;line-height:1.2;">${ar.opts.label}</div></foreignObject>`;
      }
    }

    for (const n of nodeList) {
      const p = toPx(n.x, n.y);
      svgInner += `<foreignObject x="${p.px - 60}" y="${p.py - 18}" width="120" height="36"><div xmlns="http://www.w3.org/1999/xhtml" style="display:flex;align-items:center;justify-content:center;height:100%;font-size:15px;font-weight:600;">${n.label}</div></foreignObject>`;
    }

    return `<div class="clawri-diagram-wrap" style="margin:24px 0;display:flex;justify-content:center;"><svg class="clawri-exportable-svg" viewBox="0 0 ${width} ${height}" width="${Math.min(width, 640)}" height="${height}" style="max-width:100%;height:auto;color:inherit;">${svgInner}</svg></div>`;
  }

  function renderSetDiagramSVG(content) {
    const sets = {};
    const intersections = [];
    const elements = [];
    const containers = [];
    let hasUniverse = false;
    let universeLabel = "$U$";

    const lines = content.split("\n").map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (/^\\draw\s+Universe/i.test(line)) {
        hasUniverse = true;
        const optM = line.match(/\[([^\]]*)\]/);
        if (optM) {
          const opts = parseKeyValOptions(optM[1]);
          if (opts.label) universeLabel = opts.label;
        }
        continue;
      }
      const setM = line.match(/^\\draw\s+set\s+([a-zA-Z0-9_]+)\s*(?:at\s*\(([^,]+),([^)]+)\))?\s*(?:\[([^\]]*)\])?/i);
      if (setM) {
        const id = setM[1];
        const opts = parseKeyValOptions(setM[4] || "");
        const idx = Object.keys(sets).length;
        sets[id] = {
          id,
          x: setM[2] !== undefined ? parseFloat(setM[2]) : (idx - 0.5) * 1.6,
          y: setM[3] !== undefined ? parseFloat(setM[3]) : 0,
          r: parseFloat(opts.r || "1.35"),
          color: opts.color || ["#3b82f6", "#10b981", "#ec4899", "#8b5cf6"][idx % 4],
          label: opts.label || `$${id}$`
        };
        continue;
      }
      const intM = line.match(/^\\make\s+intersection\s+([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*(?:\[([^\]]*)\])?/i);
      if (intM) {
        intersections.push({ a: intM[1], b: intM[2], opts: parseKeyValOptions(intM[3] || "") });
        continue;
      }
      const elM = line.match(/^\\draw\s+in\s+set\s+([a-zA-Z0-9_]+)\s+elements(?:\s+with\s+dots)?\s*\{([^}]*)\}/i);
      if (elM) {
        elements.push({ setId: elM[1], items: splitTopLevel(elM[2], ",").map(s => s.trim()).filter(Boolean) });
        continue;
      }
      const contM = line.match(/^\\draw\s+set\s+containing\s*\{([^}]*)\}\s*(?:at\s*\(([^,]+),([^)]+)\))?\s*(?:\[([^\]]*)\])?/i);
      if (contM) {
        const opts = parseKeyValOptions(contM[4] || "");
        containers.push({
          items: splitTopLevel(contM[1], ",").map(s => s.trim()).filter(Boolean),
          x: contM[2] !== undefined ? parseFloat(contM[2]) : 0,
          y: contM[3] !== undefined ? parseFloat(contM[3]) : -2.1,
          color: opts.color || "#6366f1",
          label: opts.label || ""
        });
      }
    }

    const width = 480, height = containers.length > 0 ? 330 : 260;
    const cx = width / 2, cy = containers.length > 0 ? 115 : 130;
    const scale = 64;
    const uid = "set_" + Math.random().toString(36).slice(2, 7);

    let defs = "<defs>";
    let body = "";

    if (hasUniverse) {
      body += `<rect x="14" y="12" width="${width - 28}" height="${height - 24}" rx="8" fill="none" stroke="currentColor" stroke-width="1.6" />`;
      body += `<foreignObject x="${width - 75}" y="16" width="55" height="26"><div xmlns="http://www.w3.org/1999/xhtml" style="font-size:14px;font-weight:700;text-align:right;">${universeLabel}</div></foreignObject>`;
    }

    Object.values(sets).forEach(s => {
      const px = cx + s.x * scale, py = cy - s.y * scale, pr = s.r * scale;
      defs += `<clipPath id="${uid}_clip_${s.id}"><circle cx="${px}" cy="${py}" r="${pr}" /></clipPath>`;
      body += `<circle cx="${px}" cy="${py}" r="${pr}" fill="${escapeHtml(s.color)}" fill-opacity="0.16" stroke="${escapeHtml(s.color)}" stroke-width="2.2" />`;
      const lx = px + (s.x < 0 ? -pr * 0.72 : (s.x > 0 ? pr * 0.72 : 0));
      const ly = py - pr - 22;
      body += `<foreignObject x="${lx - 40}" y="${Math.max(4, ly)}" width="80" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="text-align:center;font-size:14px;font-weight:700;color:${escapeHtml(s.color)};">${s.label}</div></foreignObject>`;
    });

    intersections.forEach(inter => {
      const sa = sets[inter.a], sb = sets[inter.b];
      if (!sa || !sb) return;
      const pxb = cx + sb.x * scale, pyb = cy - sb.y * scale, prb = sb.r * scale;
      const pxa = cx + sa.x * scale, pya = cy - sa.y * scale;
      const fillCol = inter.opts.color || "#f59e0b";
      body += `<g clip-path="url(#${uid}_clip_${sa.id})"><circle cx="${pxb}" cy="${pyb}" r="${prb}" fill="${escapeHtml(fillCol)}" fill-opacity="0.45" /></g>`;
      if (inter.opts.label) {
        const mx = (pxa + pxb) / 2, my = (pya + pyb) / 2;
        body += `<foreignObject x="${mx - 45}" y="${my - 14}" width="90" height="28"><div xmlns="http://www.w3.org/1999/xhtml" style="text-align:center;font-size:13px;font-weight:700;">${inter.opts.label}</div></foreignObject>`;
      }
    });

    elements.forEach(el => {
      const s = sets[el.setId];
      if (!s) return;
      const px = cx + s.x * scale, py = cy - s.y * scale;
      const offsetDir = s.x <= 0 ? -0.35 * s.r * scale : 0.35 * s.r * scale;
      el.items.forEach((item, idx) => {
        const ey = py - ((el.items.length - 1) * 12) + idx * 24;
        const ex = px + offsetDir;
        body += `<circle cx="${ex - 14}" cy="${ey}" r="3.2" fill="currentColor" />`;
        body += `<foreignObject x="${ex - 8}" y="${ey - 12}" width="64" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="font-size:13px;">$${item}$</div></foreignObject>`;
      });
    });

    containers.forEach(cont => {
      const px = cx + cont.x * scale, py = cy - cont.y * scale;
      const rx = Math.max(68, cont.items.length * 34), ry = 30;
      body += `<ellipse cx="${px}" cy="${py}" rx="${rx}" ry="${ry}" fill="${escapeHtml(cont.color)}" fill-opacity="0.14" stroke="${escapeHtml(cont.color)}" stroke-width="2" />`;
      if (cont.label) {
        body += `<foreignObject x="${px - rx - 55}" y="${py - 12}" width="50" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="text-align:right;font-size:13px;font-weight:700;color:${escapeHtml(cont.color)};">${cont.label}</div></foreignObject>`;
      }
      cont.items.forEach((it, idx) => {
        const step = (rx * 1.5) / Math.max(1, cont.items.length);
        const ix = px - rx * 0.65 + idx * step + 12;
        body += `<circle cx="${ix}" cy="${py}" r="3" fill="currentColor" />`;
        body += `<foreignObject x="${ix + 5}" y="${py - 12}" width="42" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="font-size:13px;">$${it}$</div></foreignObject>`;
      });
    });

    defs += "</defs>";
    return `<div class="clawri-set-wrap" style="margin:24px 0;display:flex;justify-content:center;"><svg class="clawri-exportable-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="max-width:100%;height:auto;color:inherit;">${defs}${body}</svg></div>`;
  }

  function renderGraphSVG(optStr, content) {
    const directed = (optStr || "").toLowerCase().includes("directed");
    const nodes = {};
    const edges = [];
    const lines = content.split(/[\n;]+/).map(l => l.trim()).filter(Boolean);

    for (const line of lines) {
      const nm = line.match(/^\\node\s+([^\s\[;]+)\s*(?:at\s*\(([^,]+),([^)]+)\))?\s*(?:\[([^\]]*)\])?/);
      if (nm) {
        const id = nm[1];
        const opts = parseKeyValOptions(nm[4] || "");
        nodes[id] = {
          id,
          x: nm[2] !== undefined ? parseFloat(nm[2]) : null,
          y: nm[3] !== undefined ? parseFloat(nm[3]) : null,
          label: opts.label || id
        };
        continue;
      }
      const em = line.match(/^\\edge\s+([^\s-]+)\s*(--|->)\s*([^\s\[;]+)\s*(?:\[([^\]]*)\])?/);
      if (em) {
        const from = em[1], arrow = em[2], to = em[3];
        if (!nodes[from]) nodes[from] = { id: from, x: null, y: null, label: from };
        if (!nodes[to]) nodes[to] = { id: to, x: null, y: null, label: to };
        edges.push({ from, to, isDir: directed || arrow === "->", opts: parseKeyValOptions(em[4] || "") });
      }
    }

    const nodeArr = Object.values(nodes);
    if (nodeArr.length === 0) return "";
    const width = 420, height = 260, cx = 210, cy = 130, rad = 85;
    nodeArr.forEach((n, idx) => {
      if (n.x === null || n.y === null) {
        const ang = (2 * Math.PI * idx) / nodeArr.length - Math.PI / 2;
        n.px = cx + rad * Math.cos(ang);
        n.py = cy + rad * Math.sin(ang);
      } else {
        n.px = cx + n.x * 55;
        n.py = cy - n.y * 55;
      }
    });

    const uid = "gr_" + Math.random().toString(36).slice(2, 7);
    let svg = `<defs><marker id="${uid}_arr" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="currentColor" /></marker></defs>`;

    for (const e of edges) {
      const a = nodes[e.from], b = nodes[e.to];
      const dx = b.px - a.px, dy = b.py - a.py, d = Math.hypot(dx, dy) || 1;
      const r = 18;
      const sx = a.px + (dx / d) * r, sy = a.py + (dy / d) * r;
      const ex = b.px - (dx / d) * r, ey = b.py - (dy / d) * r;
      svg += `<line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" stroke="currentColor" stroke-width="1.7" ${e.isDir ? `marker-end="url(#${uid}_arr)"` : ""} />`;
      if (e.opts.weight || e.opts.label) {
        const lbl = e.opts.weight || e.opts.label;
        svg += `<text x="${(sx + ex) / 2}" y="${(sy + ey) / 2 - 6}" fill="#2563eb" font-size="12" font-weight="bold" text-anchor="middle">${escapeHtml(lbl)}</text>`;
      }
    }

    for (const n of nodeArr) {
      svg += `<circle cx="${n.px}" cy="${n.py}" r="18" fill="#ffffff" stroke="currentColor" stroke-width="2" />`;
      svg += `<text x="${n.px}" y="${n.py + 4}" fill="#111827" font-size="13" font-weight="bold" text-anchor="middle">${escapeHtml(n.label)}</text>`;
    }

    return `<div style="margin:24px 0;display:flex;justify-content:center;"><svg class="clawri-exportable-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="max-width:100%;height:auto;color:inherit;">${svg}</svg></div>`;
  }

  function renderTreeSVG(content) {
    function parseChildren(str, pos = 0) {
      const list = [];
      let i = pos;
      while (i < str.length) {
        const m = str.slice(i).match(/^[\s;]*\\(root|child)\s+/);
        if (!m) break;
        i += m[0].length;
        let labelEnd = i;
        while (labelEnd < str.length && str[labelEnd] !== "{" && str[labelEnd] !== "}" && !str.slice(labelEnd).match(/^\s*\\(root|child)\b/)) {
          labelEnd++;
        }
        const label = str.slice(i, labelEnd).trim();
        i = labelEnd;
        let children = [];
        if (str[i] === "{") {
          const bal = readBalanced(str, i, "{", "}");
          if (bal) {
            children = parseChildren(bal.content, 0);
            i = bal.nextPos;
          }
        }
        list.push({ label, children });
      }
      return list;
    }

    const roots = parseChildren(content, 0);
    if (roots.length === 0) return "";
    const root = roots[0];

    let leafCounter = 0;
    function layout(node, depth) {
      node.depth = depth;
      if (!node.children || node.children.length === 0) {
        node.xIndex = leafCounter++;
      } else {
        node.children.forEach(c => layout(c, depth + 1));
        node.xIndex = (node.children[0].xIndex + node.children[node.children.length - 1].xIndex) / 2;
      }
    }
    layout(root, 0);

    const maxDepth = (function getD(n) {
      return n.children.length ? 1 + Math.max(...n.children.map(getD)) : 0;
    })(root);

    const xGap = 76, yGap = 68;
    const width = Math.max(280, leafCounter * xGap + 40);
    const height = (maxDepth + 1) * yGap + 30;
    let svg = "";

    function drawNode(n) {
      const px = 38 + n.xIndex * xGap;
      const py = 28 + n.depth * yGap;
      for (const c of n.children) {
        const cpx = 38 + c.xIndex * xGap;
        const cpy = 28 + c.depth * yGap;
        svg += `<line x1="${px}" y1="${py + 14}" x2="${cpx}" y2="${cpy - 14}" stroke="currentColor" stroke-width="1.6" />`;
        drawNode(c);
      }
      svg += `<circle cx="${px}" cy="${py}" r="15" fill="#ffffff" stroke="currentColor" stroke-width="1.8" />`;
      svg += `<foreignObject x="${px - 30}" y="${py - 12}" width="60" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="text-align:center;font-size:12px;font-weight:700;color:#111827;">${n.label}</div></foreignObject>`;
    }
    drawNode(root);

    return `<div style="margin:24px 0;display:flex;justify-content:center;"><svg class="clawri-exportable-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="max-width:100%;height:auto;color:inherit;">${svg}</svg></div>`;
  }

  /**
   * UPGRADED 2D & 3D PLOT ENGINE
   * - True SVG <clipPath> clipping (no flat clamped lines at plot boundaries!)
   * - Asymptote discontinuity detection
   * - Custom axis labels (xlabel, ylabel, zlabel), plot title, grid toggle, tick numbering toggle, axes style
   */
  function niceStep(span) {
    const raw = span / 8;
    const pow10 = Math.pow(10, Math.floor(Math.log10(raw || 1)));
    const norm = raw / pow10;
    if (norm < 1.5) return 1 * pow10;
    if (norm < 3.5) return 2 * pow10;
    if (norm < 7.5) return 5 * pow10;
    return 10 * pow10;
  }

  function formatTickNum(v) {
    if (Math.abs(v) < 1e-10) return "0";
    return Number(v.toFixed(3)).toString();
  }

  function renderPlotSVG(dimOpt, rangeOpt, content) {
    const is3D = (dimOpt || "").toLowerCase().includes("3d");
    const cfg = parseKeyValOptions(rangeOpt || "");
    const showGrid = cfg.nogrid ? false : (cfg.grid === undefined ? true : String(cfg.grid).toLowerCase() !== "false");
    const showNumbers = cfg.nonumbers ? false : (cfg.numbers === undefined ? true : String(cfg.numbers).toLowerCase() !== "false");
    const xlabel = cfg.xlabel || "x";
    const ylabel = cfg.ylabel || "y";
    const zlabel = cfg.zlabel || "z";
    const plotTitle = cfg.title || "";
    const axesStyle = (cfg.axes || "center").toLowerCase(); // center | box | none
    const uid = "plt_" + Math.random().toString(36).slice(2, 7);

    if (!is3D) {
      const xmin = parseFloat(cfg.xmin ?? "-5");
      const xmax = parseFloat(cfg.xmax ?? "5");
      const ymin = parseFloat(cfg.ymin ?? "-3");
      const ymax = parseFloat(cfg.ymax ?? "3");
      const xSpan = Math.max(1e-6, xmax - xmin);
      const ySpan = Math.max(1e-6, ymax - ymin);

      const padL = showNumbers ? 48 : 30;
      const padR = 46;
      const padT = plotTitle ? 36 : 24;
      const padB = showNumbers ? 42 : 28;
      const plotW = 480;
      const plotH = cfg.aspect === "equal" ? Math.round(plotW * (ySpan / xSpan)) : 280;
      const width = padL + plotW + padR;
      const height = padT + plotH + padB;

      const toPx = (x, y) => ({
        px: padL + ((x - xmin) / xSpan) * plotW,
        py: padT + plotH - ((y - ymin) / ySpan) * plotH
      });

      const xStep = parseFloat(cfg.xstep) || niceStep(xSpan);
      const yStep = parseFloat(cfg.ystep) || niceStep(ySpan);

      let defs = `<defs>
        <clipPath id="${uid}_clip"><rect x="${padL}" y="${padT}" width="${plotW}" height="${plotH}" /></clipPath>
        <marker id="${uid}_axis_arr" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#334155" /></marker>
        <marker id="${uid}_vec_arr" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="context-stroke" /></marker>
      </defs>`;

      let svg = `<rect x="${padL}" y="${padT}" width="${plotW}" height="${plotH}" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />`;

      if (plotTitle) {
        svg += `<foreignObject x="${padL}" y="4" width="${plotW}" height="26"><div xmlns="http://www.w3.org/1999/xhtml" style="text-align:center;font-size:13.5px;font-weight:700;color:#0f172a;">${plotTitle}</div></foreignObject>`;
      }

      // Grid lines
      if (showGrid) {
        const firstGX = Math.ceil(xmin / xStep) * xStep;
        for (let gx = firstGX; gx <= xmax + xStep * 0.001; gx += xStep) {
          const p = toPx(gx, 0);
          svg += `<line x1="${p.px.toFixed(1)}" y1="${padT}" x2="${p.px.toFixed(1)}" y2="${padT + plotH}" stroke="#e2e8f0" stroke-width="1" />`;
        }
        const firstGY = Math.ceil(ymin / yStep) * yStep;
        for (let gy = firstGY; gy <= ymax + yStep * 0.001; gy += yStep) {
          const p = toPx(0, gy);
          svg += `<line x1="${padL}" y1="${p.py.toFixed(1)}" x2="${padL + plotW}" y2="${p.py.toFixed(1)}" stroke="#e2e8f0" stroke-width="1" />`;
        }
      }

      // Axes
      const orig = toPx(0, 0);
      const xAxisY = (axesStyle === "box" || orig.py < padT || orig.py > padT + plotH) ? (padT + plotH) : orig.py;
      const yAxisX = (axesStyle === "box" || orig.px < padL || orig.px > padL + plotW) ? padL : orig.px;

      if (axesStyle !== "none") {
        svg += `<line x1="${padL}" y1="${xAxisY.toFixed(1)}" x2="${padL + plotW + 6}" y2="${xAxisY.toFixed(1)}" stroke="#334155" stroke-width="1.4" marker-end="url(#${uid}_axis_arr)" />`;
        svg += `<line x1="${yAxisX.toFixed(1)}" y1="${padT + plotH}" x2="${yAxisX.toFixed(1)}" y2="${padT - 6}" stroke="#334155" stroke-width="1.4" marker-end="url(#${uid}_axis_arr)" />`;
      }

      // Axis labels
      svg += `<foreignObject x="${padL + plotW + 8}" y="${xAxisY - 12}" width="65" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="font-size:12px;font-weight:600;color:#1e293b;">${xlabel}</div></foreignObject>`;
      svg += `<foreignObject x="${Math.max(2, yAxisX - 36)}" y="${Math.max(2, padT - 24)}" width="76" height="22"><div xmlns="http://www.w3.org/1999/xhtml" style="text-align:center;font-size:12px;font-weight:600;color:#1e293b;">${ylabel}</div></foreignObject>`;

      // Ticks & Numbers
      if (showNumbers && axesStyle !== "none") {
        const firstGX = Math.ceil(xmin / xStep) * xStep;
        for (let gx = firstGX; gx <= xmax + xStep * 0.001; gx += xStep) {
          if (Math.abs(gx) < 1e-9 && axesStyle === "center" && orig.px > padL + 10 && orig.px < padL + plotW - 10) continue;
          const p = toPx(gx, 0);
          svg += `<line x1="${p.px.toFixed(1)}" y1="${(xAxisY - 3).toFixed(1)}" x2="${p.px.toFixed(1)}" y2="${(xAxisY + 3).toFixed(1)}" stroke="#334155" stroke-width="1.2" />`;
          svg += `<text x="${p.px.toFixed(1)}" y="${(xAxisY + 15).toFixed(1)}" font-size="10.5" fill="#475569" text-anchor="middle">${formatTickNum(gx)}</text>`;
        }
        const firstGY = Math.ceil(ymin / yStep) * yStep;
        for (let gy = firstGY; gy <= ymax + yStep * 0.001; gy += yStep) {
          if (Math.abs(gy) < 1e-9 && axesStyle === "center" && orig.py > padT + 10 && orig.py < padT + plotH - 10) continue;
          const p = toPx(0, gy);
          svg += `<line x1="${(yAxisX - 3).toFixed(1)}" y1="${p.py.toFixed(1)}" x2="${(yAxisX + 3).toFixed(1)}" y2="${p.py.toFixed(1)}" stroke="#334155" stroke-width="1.2" />`;
          svg += `<text x="${(yAxisX - 6).toFixed(1)}" y="${(p.py + 3.5).toFixed(1)}" font-size="10.5" fill="#475569" text-anchor="end">${formatTickNum(gy)}</text>`;
        }
      }

      // Clipped Plotted Layer (<clipPath> prevents flat border lines!)
      let clippedLayer = `<g clip-path="url(#${uid}_clip)">`;
      let legendHtml = "";
      let legendY = padT + 14;

      const lines = content.split("\n").map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        // \area{expr}[from=a, to=b, color=#3b82f6, opacity=0.2]
        const am = line.match(/^\\area\{([^}]+)\}\s*(?:\[([^\]]*)\])?/);
        if (am) {
          const expr = am[1];
          const opts = parseKeyValOptions(am[2] || "");
          const a = parseFloat(opts.from ?? xmin);
          const b = parseFloat(opts.to ?? xmax);
          const col = opts.color || "#3b82f6";
          const op = opts.opacity || "0.22";
          const steps = 200;
          const pStart = toPx(a, 0);
          let d = `M ${pStart.px.toFixed(1)} ${pStart.py.toFixed(1)} `;
          for (let s = 0; s <= steps; s++) {
            const x = a + (s / steps) * (b - a);
            const y = safeMathEval(expr, { x });
            if (isNaN(y)) continue;
            const pt = toPx(x, Math.max(ymin - ySpan * 5, Math.min(ymax + ySpan * 5, y)));
            d += `L ${pt.px.toFixed(1)} ${pt.py.toFixed(1)} `;
          }
          const pEnd = toPx(b, 0);
          d += `L ${pEnd.px.toFixed(1)} ${pEnd.py.toFixed(1)} Z`;
          clippedLayer += `<path d="${d}" fill="${escapeHtml(col)}" fill-opacity="${escapeHtml(op)}" stroke="none" />`;
          continue;
        }

        // \func{expr}[color=..., label=..., style=dashed, width=2.2]
        const fm = line.match(/^\\func\{([^}]+)\}\s*(?:\[([^\]]*)\])?/);
        if (fm) {
          const expr = fm[1];
          const opts = parseKeyValOptions(fm[2] || "");
          const color = opts.color || "#2563eb";
          const strokeW = opts.width || "2.2";
          const dash = opts.style === "dashed" ? `stroke-dasharray="6,4"` : "";
          const steps = 600;
          let d = "";
          let penDown = false;
          let prevY = NaN;

          for (let s = 0; s <= steps; s++) {
            const x = xmin + (s / steps) * xSpan;
            const y = safeMathEval(expr, { x });
            if (isNaN(y) || Math.abs(y) > 1e6) {
              penDown = false;
              prevY = NaN;
              continue;
            }
            // Break path across vertical asymptotes (e.g. tan(x), 1/x)
            if (!isNaN(prevY) && Math.abs(y - prevY) > ySpan * 1.4 && (y * prevY < 0)) {
              penDown = false;
            }
            // Do NOT clamp to [ymin, ymax]! Let <clipPath> slice the curve cleanly at the frame border!
            const safeY = Math.max(ymin - ySpan * 20, Math.min(ymax + ySpan * 20, y));
            const pt = toPx(x, safeY);
            d += `${penDown ? "L" : "M"} ${pt.px.toFixed(2)} ${pt.py.toFixed(2)} `;
            penDown = true;
            prevY = y;
          }

          clippedLayer += `<path d="${d}" fill="none" stroke="${escapeHtml(color)}" stroke-width="${escapeHtml(strokeW)}" ${dash} stroke-linejoin="round" />`;
          if (opts.label && cfg.legend !== "none") {
            legendHtml += `<line x1="${padL + 12}" y1="${legendY}" x2="${padL + 30}" y2="${legendY}" stroke="${escapeHtml(color)}" stroke-width="2.5" ${dash} />`;
            legendHtml += `<foreignObject x="${padL + 36}" y="${legendY - 11}" width="160" height="22"><div xmlns="http://www.w3.org/1999/xhtml" style="font-size:12px;color:#0f172a;">${opts.label}</div></foreignObject>`;
            legendY += 20;
          }
          continue;
        }

        // \curve{x(t), y(t)}[t=0..6.28, color=...]
        const cm = line.match(/^\\curve\{([^,]+),([^}]+)\}\s*(?:\[([^\]]*)\])?/);
        if (cm) {
          const opts = parseKeyValOptions(cm[3] || "");
          const tRange = (opts.t || "0..6.283").split("..");
          const t0 = parseFloat(tRange[0] || "0"), t1 = parseFloat(tRange[1] || "6.283");
          const color = opts.color || "#9333ea";
          let d = "";
          let pen = false;
          for (let s = 0; s <= 350; s++) {
            const t = t0 + (s / 350) * (t1 - t0);
            const x = safeMathEval(cm[1], { t }), y = safeMathEval(cm[2], { t });
            if (isNaN(x) || isNaN(y)) { pen = false; continue; }
            const pt = toPx(x, y);
            d += `${pen ? "L" : "M"} ${pt.px.toFixed(2)} ${pt.py.toFixed(2)} `;
            pen = true;
          }
          clippedLayer += `<path d="${d}" fill="none" stroke="${escapeHtml(color)}" stroke-width="2.2" />`;
          continue;
        }

        // \vector{(x1,y1) -> (x2,y2)}[color=..., label=...]
        const vm = line.match(/^\\vector\{\(([^,]+),([^)]+)\)\s*->\s*\(([^,]+),([^)]+)\)\}\s*(?:\[([^\]]*)\])?/);
        if (vm) {
          const p1 = toPx(parseFloat(vm[1]), parseFloat(vm[2]));
          const p2 = toPx(parseFloat(vm[3]), parseFloat(vm[4]));
          const opts = parseKeyValOptions(vm[5] || "");
          const col = opts.color || "#16a34a";
          clippedLayer += `<line x1="${p1.px}" y1="${p1.py}" x2="${p2.px}" y2="${p2.py}" stroke="${escapeHtml(col)}" stroke-width="2.3" marker-end="url(#${uid}_vec_arr)" />`;
          if (opts.label) {
            clippedLayer += `<foreignObject x="${p2.px + 4}" y="${p2.py - 16}" width="80" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="font-size:12px;font-weight:bold;color:${escapeHtml(col)};">${opts.label}</div></foreignObject>`;
          }
          continue;
        }

        // \point{(x,y)}[color=..., label=..., r=4]
        const pm = line.match(/^\\point\{\(([^,]+),([^)]+)\)\}\s*(?:\[([^\]]*)\])?/);
        if (pm) {
          const pt = toPx(parseFloat(pm[1]), parseFloat(pm[2]));
          const opts = parseKeyValOptions(pm[3] || "");
          const col = opts.color || "#9333ea";
          const rad = parseFloat(opts.r || "4");
          clippedLayer += `<circle cx="${pt.px}" cy="${pt.py}" r="${rad}" fill="${escapeHtml(col)}" />`;
          if (opts.label) {
            clippedLayer += `<foreignObject x="${pt.px + 6}" y="${pt.py - 18}" width="95" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="font-size:11.5px;font-weight:600;color:${escapeHtml(col)};">${opts.label}</div></foreignObject>`;
          }
        }
      }

      clippedLayer += `</g>`;
      return `<div style="margin:24px 0;display:flex;justify-content:center;"><svg class="clawri-exportable-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="max-width:100%;height:auto;">${defs}${svg}${clippedLayer}${legendHtml}</svg></div>`;
    } else {
      // 3D Plot with <clipPath> and Custom Axis Labels
      const width = 520, height = 320;
      const cx = width / 2, cy = height / 2 + 25;
      const proj3D = (x, y, z) => ({
        px: cx + (x - y) * 32,
        py: cy + (x + y) * 16 - z * 45
      });

      let defs = `<defs><clipPath id="${uid}_clip3d"><rect x="20" y="15" width="${width - 40}" height="${height - 30}" /></clipPath></defs>`;
      let svg = `<rect x="20" y="15" width="${width - 40}" height="${height - 30}" fill="#ffffff" stroke="#cbd5e1" />`;

      if (plotTitle) {
        svg += `<foreignObject x="20" y="18" width="${width - 40}" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="text-align:center;font-size:13px;font-weight:700;color:#0f172a;">${plotTitle}</div></foreignObject>`;
      }

      const o = proj3D(0, 0, 0), ax = proj3D(3.5, 0, 0), ay = proj3D(0, 3.5, 0), az = proj3D(0, 0, 2.2);
      svg += `<line x1="${o.px}" y1="${o.py}" x2="${ax.px}" y2="${ax.py}" stroke="#64748b" stroke-width="1.3" />`;
      svg += `<line x1="${o.px}" y1="${o.py}" x2="${ay.px}" y2="${ay.py}" stroke="#64748b" stroke-width="1.3" />`;
      svg += `<line x1="${o.px}" y1="${o.py}" x2="${az.px}" y2="${az.py}" stroke="#64748b" stroke-width="1.3" />`;
      svg += `<foreignObject x="${ax.px + 4}" y="${ax.py - 10}" width="60" height="22"><div xmlns="http://www.w3.org/1999/xhtml" style="font-size:11px;color:#475569;">${xlabel}</div></foreignObject>`;
      svg += `<foreignObject x="${ay.px - 58}" y="${ay.py - 10}" width="54" height="22"><div xmlns="http://www.w3.org/1999/xhtml" style="text-align:right;font-size:11px;color:#475569;">${ylabel}</div></foreignObject>`;
      svg += `<foreignObject x="${az.px - 30}" y="${az.py - 22}" width="60" height="22"><div xmlns="http://www.w3.org/1999/xhtml" style="text-align:center;font-size:11px;color:#475569;">${zlabel}</div></foreignObject>`;

      let clipped3D = `<g clip-path="url(#${uid}_clip3d)">`;
      const lines = content.split("\n").map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        const sm = line.match(/^\\surface\{([^}]+)\}/);
        if (sm && showGrid) {
          const expr = sm[1];
          const N = 18, minR = -3, maxR = 3;
          for (let i = 0; i <= N; i++) {
            let d1 = "", d2 = "";
            const u = minR + (i / N) * (maxR - minR);
            for (let j = 0; j <= N; j++) {
              const v = minR + (j / N) * (maxR - minR);
              const z1 = safeMathEval(expr, { x: u, y: v });
              const p1 = proj3D(u, v, isNaN(z1) ? 0 : z1);
              d1 += `${j === 0 ? "M" : "L"} ${p1.px.toFixed(1)} ${p1.py.toFixed(1)} `;

              const z2 = safeMathEval(expr, { x: v, y: u });
              const p2 = proj3D(v, u, isNaN(z2) ? 0 : z2);
              d2 += `${j === 0 ? "M" : "L"} ${p2.px.toFixed(1)} ${p2.py.toFixed(1)} `;
            }
            clipped3D += `<path d="${d1}" fill="none" stroke="#3b82f6" stroke-opacity="0.65" stroke-width="1.1" />`;
            clipped3D += `<path d="${d2}" fill="none" stroke="#0ea5e9" stroke-opacity="0.65" stroke-width="1.1" />`;
          }
        }
        const c3m = line.match(/^\\curve3d\{([^,]+),([^,]+),([^}]+)\}\s*(?:\[([^\]]*)\])?/);
        if (c3m) {
          const opts = parseKeyValOptions(c3m[4] || "");
          const tr = (opts.t || "0..12.56").split("..");
          const t0 = parseFloat(tr[0] || "0"), t1 = parseFloat(tr[1] || "12.56");
          let d = "";
          for (let s = 0; s <= 180; s++) {
            const t = t0 + (s / 180) * (t1 - t0);
            const x = safeMathEval(c3m[1], { t }), y = safeMathEval(c3m[2], { t }), z = safeMathEval(c3m[3], { t });
            const p = proj3D(x || 0, y || 0, z || 0);
            d += `${s === 0 ? "M" : "L"} ${p.px.toFixed(1)} ${p.py.toFixed(1)} `;
          }
          clipped3D += `<path d="${d}" fill="none" stroke="${escapeHtml(opts.color || "#dc2626")}" stroke-width="2.2" />`;
        }
      }
      clipped3D += `</g>`;

      return `<div style="margin:24px 0;display:flex;justify-content:center;"><svg class="clawri-exportable-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="max-width:100%;height:auto;">${defs}${svg}${clipped3D}</svg></div>`;
    }
  }

  return {
    renderDiagramSVG,
    renderSetDiagramSVG,
    renderGraphSVG,
    renderTreeSVG,
    renderPlotSVG
  };
})();

