/* ============================================================================
   MODULE 5: Clawri.Graphics (Diagrams, Sets, Graphs, Trees, Clipped 2D/3D Plots)
   ============================================================================ */
window.Clawri = window.Clawri || {};

Clawri.Graphics = (function () {
  const { escapeHtml, splitTopLevel, parseKeyValOptions, readBalanced } = Clawri.Utils;

  /* Valutatore matematico compatibile con sintassi MATLAB (es. 2x, 3sin(t), pi, e) */
  function safeMathEval(expr, vars = {}) {
    try {
      let js = String(expr)
        .replace(/\^/g, "**")
        // Moltiplicazione implicita: 2x -> 2*x, 2(x+1) -> 2*(x+1), )x -> )*x
        .replace(/(\d)\s*([a-zA-Z(])/g, "$1*$2")
        .replace(/(\))\s*([a-zA-Z0-9(])/g, "$1*$2")
        .replace(/\bsec\(([^)]+)\)/g, "(1/Math.cos($1))")
        .replace(/\bcsc\(([^)]+)\)/g, "(1/Math.sin($1))")
        .replace(/\bcot\(([^)]+)\)/g, "(1/Math.tan($1))")
        .replace(/\blog10\(/g, "Math.log10(")
        .replace(/\blog2\(/g, "Math.log2(")
        .replace(/\bln\(/g, "Math.log(")
        .replace(/\b(sin|cos|tan|sinh|cosh|tanh|asin|acos|atan|atan2|sqrt|abs|exp|log|floor|ceil|round|sign|min|max)\b/g, "Math.$1")
        .replace(/\bpi\b/gi, "Math.PI")
        .replace(/(?<![0-9.])\be\b/g, "Math.E");

      const keys = Object.keys(vars);
      const vals = Object.values(vars);
      const fn = new Function(...keys, `"use strict"; return (${js});`);
      const v = fn(...vals);
      return typeof v === "number" && isFinite(v) ? v : NaN;
    } catch {
      return NaN;
    }
  }

  function formatTickNum(v) {
    if (Math.abs(v) < 1e-10) return "0";
    if (Math.abs(v) >= 10000 || (Math.abs(v) > 0 && Math.abs(v) < 0.001)) {
      return v.toExponential(1);
    }
    return String(Number(v.toFixed(3)));
  }

  function niceStep(range, targetTicks = 7) {
    if (range <= 0 || !isFinite(range)) return 1;
    const rough = range / targetTicks;
    const pow10 = Math.pow(10, Math.floor(Math.log10(rough)));
    const frac = rough / pow10;
    let nice = 1;
    if (frac <= 1.2) nice = 1;
    else if (frac <= 2.5) nice = 2;
    else if (frac <= 5.5) nice = 5;
    else nice = 10;
    return nice * pow10;
  }

  function parseRangePair(raw, fallbackMin, fallbackMax) {
    if (!raw) return [fallbackMin, fallbackMax];
    const clean = String(raw).replace(/^\[|\]$/g, "").trim();
    const parts = clean.includes("..") ? clean.split("..") : clean.split(/[,:\s]+/);
    const a = parseFloat(parts[0]);
    const b = parseFloat(parts[1]);
    return [isNaN(a) ? fallbackMin : a, isNaN(b) ? fallbackMax : b];
  }

  function isOptEnabled(val, defaultVal = true) {
    if (val === undefined) return defaultVal;
    const s = String(val).toLowerCase();
    if (s === "false" || s === "off" || s === "0" || s === "no") return false;
    return true;
  }

  function getLineDashArray(style) {
    const s = String(style || "solid").toLowerCase();
    if (s === "dashed" || s === "--") return 'stroke-dasharray="7,4"';
    if (s === "dotted" || s === ":") return 'stroke-dasharray="2,4"';
    if (s === "dashdot" || s === "-.") return 'stroke-dasharray="7,3,2,3"';
    return "";
  }

  function renderMarkerSVG(cx, cy, marker, color, size = 4) {
    const m = String(marker || "o").toLowerCase();
    const col = escapeHtml(color);
    if (m === "s" || m === "square") {
      return `<rect x="${(cx - size).toFixed(1)}" y="${(cy - size).toFixed(1)}" width="${size * 2}" height="${size * 2}" fill="#ffffff" stroke="${col}" stroke-width="1.8" />`;
    }
    if (m === "^" || m === "triangle") {
      return `<polygon points="${cx.toFixed(1)},${(cy - size * 1.25).toFixed(1)} ${(cx - size * 1.1).toFixed(1)},${(cy + size).toFixed(1)} ${(cx + size * 1.1).toFixed(1)},${(cy + size).toFixed(1)}" fill="#ffffff" stroke="${col}" stroke-width="1.8" />`;
    }
    if (m === "d" || m === "diamond") {
      return `<polygon points="${cx.toFixed(1)},${(cy - size * 1.25).toFixed(1)} ${(cx + size * 1.1).toFixed(1)},${cy.toFixed(1)} ${cx.toFixed(1)},${(cy + size * 1.25).toFixed(1)} ${(cx - size * 1.1).toFixed(1)},${cy.toFixed(1)}" fill="#ffffff" stroke="${col}" stroke-width="1.8" />`;
    }
    if (m === "+" || m === "plus") {
      return `<g stroke="${col}" stroke-width="1.8"><line x1="${cx - size}" y1="${cy}" x2="${cx + size}" y2="${cy}"/><line x1="${cx}" y1="${cy - size}" x2="${cx}" y2="${cy + size}"/></g>`;
    }
    if (m === "x" || m === "*") {
      return `<g stroke="${col}" stroke-width="1.8"><line x1="${cx - size}" y1="${cy - size}" x2="${cx + size}" y2="${cy + size}"/><line x1="${cx - size}" y1="${cy + size}" x2="${cx + size}" y2="${cy - size}"/></g>`;
    }
    if (m === "filled" || m === ".") {
      return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${size}" fill="${col}" />`;
    }
    // Default MATLAB 'o'
    return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${size}" fill="#ffffff" stroke="${col}" stroke-width="1.8" />`;
  }

  /* Colormap MATLAB autentiche: parula, viridis, jet, hot, cool, bw */
  function sampleColormap(t, mapName = "parula") {
    const c = Math.max(0, Math.min(1, isNaN(t) ? 0.5 : t));
    const palettes = {
      parula: [
        [0.0, [53, 42, 135]],
        [0.25, [20, 133, 212]],
        [0.5, [55, 184, 157]],
        [0.75, [216, 186, 86]],
        [1.0, [249, 251, 14]]
      ],
      viridis: [
        [0.0, [68, 1, 84]],
        [0.25, [59, 82, 139]],
        [0.5, [33, 145, 140]],
        [0.75, [94, 201, 98]],
        [1.0, [253, 231, 37]]
      ],
      jet: [
        [0.0, [0, 0, 143]],
        [0.2, [0, 112, 255]],
        [0.5, [128, 255, 128]],
        [0.8, [255, 112, 0]],
        [1.0, [143, 0, 0]]
      ],
      hot: [
        [0.0, [20, 0, 0]],
        [0.38, [230, 0, 0]],
        [0.75, [255, 210, 0]],
        [1.0, [255, 255, 255]]
      ],
      cool: [
        [0.0, [0, 255, 255]],
        [1.0, [255, 0, 255]]
      ],
      bw: [
        [0.0, [240, 244, 248]],
        [1.0, [51, 65, 85]]
      ]
    };

    const stops = palettes[String(mapName || "parula").toLowerCase()] || palettes.parula;
    for (let i = 0; i < stops.length - 1; i++) {
      const [t0, rgb0] = stops[i];
      const [t1, rgb1] = stops[i + 1];
      if (c >= t0 && c <= t1) {
        const f = (c - t0) / (t1 - t0 || 1);
        const r = Math.round(rgb0[0] + f * (rgb1[0] - rgb0[0]));
        const g = Math.round(rgb0[1] + f * (rgb1[1] - rgb0[1]));
        const b = Math.round(rgb0[2] + f * (rgb1[2] - rgb0[2]));
        return `rgb(${r},${g},${b})`;
      }
    }
    const last = stops[stops.length - 1][1];
    return `rgb(${last[0]},${last[1]},${last[2]})`;
  }

  /* ==========================================================================
     1. COMMUTATIVE DIAGRAMS (\begin{draw}[diagram])
     ========================================================================== */
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
        svgInner += `<foreignObject x="${lx - 55}" y="${ly - 14}" width="110" height="28" style="overflow:visible;"><div xmlns="http://www.w3.org/1999/xhtml" style="text-align:center;font-size:13px;line-height:1.2;">${ar.opts.label}</div></foreignObject>`;
      }
    }

    for (const n of nodeList) {
      const p = toPx(n.x, n.y);
      svgInner += `<foreignObject x="${p.px - 60}" y="${p.py - 18}" width="120" height="36" style="overflow:visible;"><div xmlns="http://www.w3.org/1999/xhtml" style="display:flex;align-items:center;justify-content:center;height:100%;font-size:15px;font-weight:600;">${n.label}</div></foreignObject>`;
    }

    return `<div class="clawri-diagram-wrap" style="margin:24px 0;display:flex;justify-content:center;"><svg class="clawri-exportable-svg" viewBox="0 0 ${width} ${height}" width="${Math.min(width, 640)}" height="${height}" style="max-width:100%;height:auto;color:inherit;overflow:visible;">${svgInner}</svg></div>`;
  }

  /* ==========================================================================
     2. SET & VENN DIAGRAMS (\begin{draw}[set], \begin{set}, \begin{venn})
     ========================================================================== */
  function renderSetDiagramSVG(content) {
    const sets = {};
    const ops = []; // intersection, union, difference
    const elements = [];
    const containers = [];
    let hasUniverse = false;
    let universeLabel = "$U$";

    const lines = content.split("\n").map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (/^\\draw\s+Universe/i.test(line)) {
        hasUniverse = true;
        const optIdx = line.indexOf("[");
        if (optIdx !== -1) {
          const bal = readBalanced(line, optIdx, "[", "]");
          if (bal) {
            const opts = parseKeyValOptions(bal.content);
            if (opts.label) universeLabel = opts.label;
          }
        }
        continue;
      }

      const setM = line.match(/^\\draw\s+set\s+([a-zA-Z0-9_]+)\s*(?:at\s*\(([^,]+),([^)]+)\))?/i);
      if (setM) {
        const id = setM[1];
        let opts = {};
        const optIdx = line.indexOf("[", setM[0].length);
        if (optIdx !== -1) {
          const bal = readBalanced(line, optIdx, "[", "]");
          if (bal) opts = parseKeyValOptions(bal.content);
        }
        const idx = Object.keys(sets).length;
        const rx = parseFloat(opts.rx || opts.r || "1.35");
        const ry = parseFloat(opts.ry || opts.r || "1.35");
        sets[id] = {
          id,
          x: setM[2] !== undefined ? parseFloat(setM[2]) : (idx - 0.5) * 1.6,
          y: setM[3] !== undefined ? parseFloat(setM[3]) : 0,
          rx,
          ry,
          color: opts.color || ["#3b82f6", "#10b981", "#ec4899", "#8b5cf6", "#f59e0b"][idx % 5],
          label: opts.label || `$${id}$`
        };
        continue;
      }

      const opM = line.match(/^\\make\s+(intersection|union|difference)\s+([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)/i);
      if (opM) {
        let opts = {};
        const optIdx = line.indexOf("[", opM[0].length);
        if (optIdx !== -1) {
          const bal = readBalanced(line, optIdx, "[", "]");
          if (bal) opts = parseKeyValOptions(bal.content);
        }
        ops.push({ kind: opM[1].toLowerCase(), a: opM[2], b: opM[3], opts });
        continue;
      }

      const elM = line.match(/^\\draw\s+in\s+set\s+([a-zA-Z0-9_]+)\s+elements(\s+with\s+dots)?/i);
      if (elM) {
        const braceIdx = line.indexOf("{", elM[0].length);
        if (braceIdx !== -1) {
          const bal = readBalanced(line, braceIdx, "{", "}");
          if (bal) {
            const items = splitTopLevel(bal.content, ",").map(s => s.trim()).filter(Boolean);
            elements.push({ setId: elM[1], withDots: Boolean(elM[2]), items });
          }
        }
        continue;
      }

      const contM = line.match(/^\\draw\s+set\s+containing\b/i);
      if (contM) {
        const braceIdx = line.indexOf("{", contM[0].length);
        if (braceIdx !== -1) {
          const bal = readBalanced(line, braceIdx, "{", "}");
          if (bal) {
            const rest = line.slice(bal.nextPos);
            const atM = rest.match(/at\s*\(([^,]+),([^)]+)\)/i);
            let opts = {};
            const optIdx = rest.indexOf("[");
            if (optIdx !== -1) {
              const obal = readBalanced(rest, optIdx, "[", "]");
              if (obal) opts = parseKeyValOptions(obal.content);
            }
            const items = splitTopLevel(bal.content, ",").map(s => s.trim()).filter(Boolean);
            containers.push({
              items,
              x: atM ? parseFloat(atM[1]) : 0,
              y: atM ? parseFloat(atM[2]) : -2.15,
              color: opts.color || "#6366f1",
              label: opts.label || ""
            });
          }
        }
      }
    }

    const width = 500;
    const height = containers.length > 0 ? 345 : 275;
    const cx = width / 2;
    const cy = containers.length > 0 ? 120 : 138;
    const scale = 64;
    const uid = "set_" + Math.random().toString(36).slice(2, 7);

    let defs = "<defs>";
    let body = "";

    if (hasUniverse) {
      body += `<rect x="14" y="12" width="${width - 28}" height="${height - 24}" rx="10" fill="rgba(148,163,184,0.04)" stroke="currentColor" stroke-width="1.6" />`;
      body += `<foreignObject x="${width - 82}" y="16" width="60" height="26" style="overflow:visible;"><div xmlns="http://www.w3.org/1999/xhtml" style="font-size:14px;font-weight:700;text-align:right;">${universeLabel}</div></foreignObject>`;
    }

    Object.values(sets).forEach(s => {
      const px = cx + s.x * scale;
      const py = cy - s.y * scale;
      const prx = s.rx * scale;
      const pry = s.ry * scale;
      defs += `<clipPath id="${uid}_clip_${s.id}"><ellipse cx="${px}" cy="${py}" rx="${prx}" ry="${pry}" /></clipPath>`;
      defs += `<mask id="${uid}_diff_${s.id}"><rect x="0" y="0" width="${width}" height="${height}" fill="white"/><ellipse cx="${px}" cy="${py}" rx="${prx}" ry="${pry}" fill="black"/></mask>`;

      body += `<ellipse cx="${px}" cy="${py}" rx="${prx}" ry="${pry}" fill="${escapeHtml(s.color)}" fill-opacity="0.14" stroke="${escapeHtml(s.color)}" stroke-width="2.2" />`;
      const lx = px + (s.x < 0 ? -prx * 0.65 : (s.x > 0 ? prx * 0.65 : 0));
      const ly = py - pry - 24;
      body += `<foreignObject x="${lx - 55}" y="${Math.max(4, ly)}" width="110" height="24" style="overflow:visible;"><div xmlns="http://www.w3.org/1999/xhtml" style="text-align:center;font-size:14px;font-weight:700;color:${escapeHtml(s.color)};">${s.label}</div></foreignObject>`;
    });

    ops.forEach(op => {
      const sa = sets[op.a], sb = sets[op.b];
      if (!sa || !sb) return;
      const pxa = cx + sa.x * scale, pya = cy - sa.y * scale, prxa = sa.rx * scale, prya = sa.ry * scale;
      const pxb = cx + sb.x * scale, pyb = cy - sb.y * scale, prxb = sb.rx * scale, pryb = sb.ry * scale;
      const fillCol = op.opts.color || "#f59e0b";

      if (op.kind === "intersection") {
        body += `<g clip-path="url(#${uid}_clip_${sa.id})"><ellipse cx="${pxb}" cy="${pyb}" rx="${prxb}" ry="${pryb}" fill="${escapeHtml(fillCol)}" fill-opacity="0.45" /></g>`;
      } else if (op.kind === "union") {
        body += `<ellipse cx="${pxa}" cy="${pya}" rx="${prxa}" ry="${prya}" fill="${escapeHtml(fillCol)}" fill-opacity="0.32" />`;
        body += `<ellipse cx="${pxb}" cy="${pyb}" rx="${prxb}" ry="${pryb}" fill="${escapeHtml(fillCol)}" fill-opacity="0.32" />`;
      } else if (op.kind === "difference") {
        body += `<ellipse cx="${pxa}" cy="${pya}" rx="${prxa}" ry="${prya}" fill="${escapeHtml(fillCol)}" fill-opacity="0.38" mask="url(#${uid}_diff_${sb.id})" />`;
      }

      if (op.opts.label) {
        const mx = op.kind === "difference" ? pxa - prxa * 0.35 : (pxa + pxb) / 2;
        const my = (pya + pyb) / 2;
        body += `<foreignObject x="${mx - 55}" y="${my - 14}" width="110" height="28" style="overflow:visible;"><div xmlns="http://www.w3.org/1999/xhtml" style="text-align:center;font-size:13px;font-weight:700;">${op.opts.label}</div></foreignObject>`;
      }
    });

    elements.forEach(el => {
      const s = sets[el.setId];
      if (!s) return;
      const px = cx + s.x * scale, py = cy - s.y * scale;
      const offsetDir = s.x < 0 ? -0.36 * s.rx * scale : (s.x > 0 ? 0.25 * s.rx * scale : -0.18 * s.rx * scale);
      el.items.forEach((item, idx) => {
        const ey = py - ((el.items.length - 1) * 12) + idx * 24;
        const ex = px + offsetDir;
        const cleanItem = item.startsWith("$") ? item : `$${item}$`;
        if (el.withDots) {
          body += `<circle cx="${ex - 12}" cy="${ey}" r="3.3" fill="currentColor" />`;
        }
        body += `<foreignObject x="${ex - 5}" y="${ey - 12}" width="85" height="24" style="overflow:visible;"><div xmlns="http://www.w3.org/1999/xhtml" style="font-size:13px;white-space:nowrap;">${cleanItem}</div></foreignObject>`;
      });
    });

    containers.forEach(cont => {
      const px = cx + cont.x * scale;
      const py = cy - cont.y * scale;
      const rx = Math.max(72, cont.items.length * 36);
      const ry = 28;
      body += `<ellipse cx="${px}" cy="${py}" rx="${rx}" ry="${ry}" fill="${escapeHtml(cont.color)}" fill-opacity="0.14" stroke="${escapeHtml(cont.color)}" stroke-width="2" />`;
      if (cont.label) {
        body += `<foreignObject x="${px - rx - 65}" y="${py - 12}" width="60" height="24" style="overflow:visible;"><div xmlns="http://www.w3.org/1999/xhtml" style="text-align:right;font-size:13px;font-weight:700;color:${escapeHtml(cont.color)};">${cont.label}</div></foreignObject>`;
      }
      cont.items.forEach((it, idx) => {
        const step = (rx * 1.55) / Math.max(1, cont.items.length);
        const ix = px - rx * 0.65 + idx * step + 12;
        const cleanIt = it.startsWith("$") ? it : `$${it}$`;
        body += `<circle cx="${ix}" cy="${py}" r="3.2" fill="currentColor" />`;
        body += `<foreignObject x="${ix + 6}" y="${py - 12}" width="55" height="24" style="overflow:visible;"><div xmlns="http://www.w3.org/1999/xhtml" style="font-size:13px;white-space:nowrap;">${cleanIt}</div></foreignObject>`;
      });
    });

    defs += "</defs>";
    return `<div class="clawri-set-wrap" style="margin:24px 0;display:flex;justify-content:center;"><svg class="clawri-exportable-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="max-width:100%;height:auto;color:inherit;overflow:visible;">${defs}${body}</svg></div>`;
  }

  /* ==========================================================================
     3. GRAPHS & TREES (\begin{graph}, \begin{tree})
     ========================================================================== */
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
        svg += `<text x="${(sx + ex) / 2}" y="${(sy + ey) / 2 - 6}" fill="#0072BD" font-size="12" font-weight="bold" text-anchor="middle">${escapeHtml(lbl)}</text>`;
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
      svg += `<foreignObject x="${px - 30}" y="${py - 12}" width="60" height="24" style="overflow:visible;"><div xmlns="http://www.w3.org/1999/xhtml" style="text-align:center;font-size:12px;font-weight:700;color:#111827;">${n.label}</div></foreignObject>`;
    }
    drawNode(root);

    return `<div style="margin:24px 0;display:flex;justify-content:center;"><svg class="clawri-exportable-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="max-width:100%;height:auto;color:inherit;overflow:visible;">${svg}</svg></div>`;
  }

  /* ==========================================================================
     4. MOTORE GRAFICI 2D & 3D IDENTICO A MATLAB (\begin{plot}[2d|3d][...])
     ========================================================================== */
  const MATLAB_COLORS = ["#0072BD", "#D95319", "#EDB120", "#7E2F8E", "#77AC30", "#4DBEEE", "#A2142F"];

  function parseCommandLine(line) {
    const cmdM = line.match(/^\\([a-zA-Z0-9_]+)\s*/);
    if (!cmdM) return null;
    const name = cmdM[1];
    let pos = cmdM[0].length;
    let req = null;
    let opt = "";
    if (line[pos] === "{") {
      const b = readBalanced(line, pos, "{", "}");
      if (b) { req = b.content; pos = b.nextPos; }
    }
    while (line[pos] === " ") pos++;
    if (line[pos] === "[") {
      const ob = readBalanced(line, pos, "[", "]");
      if (ob) { opt = ob.content; pos = ob.nextPos; }
    }
    return { name, req, opt };
  }

  function renderPlot2DMATLAB(cfg, content, uid) {
    const [xmin, xmax] = cfg.xlim ? parseRangePair(cfg.xlim, -5, 5) : [parseFloat(cfg.xmin ?? "-5"), parseFloat(cfg.xmax ?? "5")];
    const [ymin, ymax] = cfg.ylim ? parseRangePair(cfg.ylim, -3, 3) : [parseFloat(cfg.ymin ?? "-3"), parseFloat(cfg.ymax ?? "3")];

    const showGrid = !cfg.nogrid && isOptEnabled(cfg.grid, true);
    const showMinorGrid = isOptEnabled(cfg.minorgrid, false);
    const showNumbers = !cfg.nonumbers && isOptEnabled(cfg.numbers, true);
    const axesStyle = (cfg.axes || "box").toLowerCase(); // "box" (MATLAB default), "center", "none"
    const xlabel = cfg.xlabel || "";
    const ylabel = cfg.ylabel || "";
    const title = cfg.title || "";
    const legendPos = (cfg.legend || "northeast").toLowerCase();
    const equalAspect = String(cfg.aspect || "").toLowerCase() === "equal";

    const padLeft = (showNumbers || ylabel) ? 58 : 26;
    const padRight = legendPos === "outside" ? 135 : 24;
    const padTop = title ? 38 : 22;
    const padBottom = (showNumbers || xlabel) ? 46 : 24;

    let plotW = 470;
    let plotH = 290;
    if (equalAspect && (xmax - xmin) > 0 && (ymax - ymin) > 0) {
      plotH = Math.max(180, Math.min(420, plotW * ((ymax - ymin) / (xmax - xmin))));
    }

    const width = padLeft + plotW + padRight;
    const height = padTop + plotH + padBottom;
    const xRight = padLeft + plotW;
    const yBottom = padTop + plotH;

    const toPx = (x, y) => ({
      px: padLeft + ((x - xmin) / (xmax - xmin || 1)) * plotW,
      py: yBottom - ((y - ymin) / (ymax - ymin || 1)) * plotH
    });

    const xStep = cfg.xstep ? parseFloat(cfg.xstep) : niceStep(xmax - xmin, 7);
    const yStep = cfg.ystep ? parseFloat(cfg.ystep) : niceStep(ymax - ymin, 6);

    const xTicks = cfg.xticks
      ? cfg.xticks.replace(/^\[|\]$/g, "").split(/[\s,]+/).map(Number).filter(n => !isNaN(n))
      : (() => {
          const arr = [];
          const start = Math.ceil((xmin - 1e-9) / xStep) * xStep;
          for (let gx = start; gx <= xmax + 1e-9; gx += xStep) arr.push(Number(gx.toFixed(8)));
          return arr;
        })();

    const yTicks = cfg.yticks
      ? cfg.yticks.replace(/^\[|\]$/g, "").split(/[\s,]+/).map(Number).filter(n => !isNaN(n))
      : (() => {
          const arr = [];
          const start = Math.ceil((ymin - 1e-9) / yStep) * yStep;
          for (let gy = start; gy <= ymax + 1e-9; gy += yStep) arr.push(Number(gy.toFixed(8)));
          return arr;
        })();

    let svg = `<defs>
      <clipPath id="${uid}_clip"><rect x="${padLeft}" y="${padTop}" width="${plotW}" height="${plotH}" /></clipPath>
      <marker id="${uid}_vec" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="context-stroke" /></marker>
    </defs>`;

    // Sfondo area grafico MATLAB
    svg += `<rect x="${padLeft}" y="${padTop}" width="${plotW}" height="${plotH}" fill="#ffffff" />`;

    // Griglia minore opzionale
    if (showMinorGrid) {
      for (let i = 0; i < xTicks.length - 1; i++) {
        const midX = toPx((xTicks[i] + xTicks[i + 1]) / 2, 0).px;
        svg += `<line x1="${midX}" y1="${padTop}" x2="${midX}" y2="${yBottom}" stroke="#f1f5f9" stroke-width="0.9" stroke-dasharray="2,2" />`;
      }
      for (let i = 0; i < yTicks.length - 1; i++) {
        const midY = toPx(0, (yTicks[i] + yTicks[i + 1]) / 2).py;
        svg += `<line x1="${padLeft}" y1="${midY}" x2="${xRight}" y2="${midY}" stroke="#f1f5f9" stroke-width="0.9" stroke-dasharray="2,2" />`;
      }
    }

    // Griglia principale MATLAB
    if (showGrid) {
      for (const gx of xTicks) {
        const px = toPx(gx, 0).px;
        svg += `<line x1="${px.toFixed(1)}" y1="${padTop}" x2="${px.toFixed(1)}" y2="${yBottom}" stroke="#e2e8f0" stroke-width="1" />`;
      }
      for (const gy of yTicks) {
        const py = toPx(0, gy).py;
        svg += `<line x1="${padLeft}" y1="${py.toFixed(1)}" x2="${xRight}" y2="${py.toFixed(1)}" stroke="#e2e8f0" stroke-width="1" />`;
      }
    }

    // Assi cartesiani al centro (se axes=center o origin)
    const orig = toPx(0, 0);
    if (axesStyle === "center" || axesStyle === "origin") {
      if (orig.py >= padTop && orig.py <= yBottom) {
        svg += `<line x1="${padLeft}" y1="${orig.py}" x2="${xRight}" y2="${orig.py}" stroke="#1e293b" stroke-width="1.3" />`;
      }
      if (orig.px >= padLeft && orig.px <= xRight) {
        svg += `<line x1="${orig.px}" y1="${padTop}" x2="${orig.px}" y2="${yBottom}" stroke="#1e293b" stroke-width="1.3" />`;
      }
    }

    // Riquadro esterno MATLAB (box on) + tacche (ticks) + numeri
    if (axesStyle !== "none") {
      if (axesStyle === "box") {
        svg += `<rect x="${padLeft}" y="${padTop}" width="${plotW}" height="${plotH}" fill="none" stroke="#1e293b" stroke-width="1.2" />`;
      }
      for (const gx of xTicks) {
        const px = toPx(gx, 0).px;
        if (axesStyle === "box") {
          svg += `<line x1="${px.toFixed(1)}" y1="${yBottom}" x2="${px.toFixed(1)}" y2="${yBottom - 5}" stroke="#1e293b" stroke-width="1.1" />`;
          svg += `<line x1="${px.toFixed(1)}" y1="${padTop}" x2="${px.toFixed(1)}" y2="${padTop + 5}" stroke="#1e293b" stroke-width="1.1" />`;
        } else if (orig.py >= padTop && orig.py <= yBottom) {
          svg += `<line x1="${px.toFixed(1)}" y1="${orig.py - 3.5}" x2="${px.toFixed(1)}" y2="${orig.py + 3.5}" stroke="#1e293b" stroke-width="1.1" />`;
        }
        if (showNumbers) {
          if ((axesStyle === "center" || axesStyle === "origin") && Math.abs(gx) < 1e-10) continue;
          const numY = (axesStyle === "center" || axesStyle === "origin") && orig.py >= padTop && orig.py <= yBottom - 16
            ? orig.py + 15
            : yBottom + 16;
          svg += `<text x="${px.toFixed(1)}" y="${numY}" fill="#1e293b" font-family="Helvetica, Arial, sans-serif" font-size="11" text-anchor="middle">${formatTickNum(gx)}</text>`;
        }
      }

      for (const gy of yTicks) {
        const py = toPx(0, gy).py;
        if (axesStyle === "box") {
          svg += `<line x1="${padLeft}" y1="${py.toFixed(1)}" x2="${padLeft + 5}" y2="${py.toFixed(1)}" stroke="#1e293b" stroke-width="1.1" />`;
          svg += `<line x1="${xRight}" y1="${py.toFixed(1)}" x2="${xRight - 5}" y2="${py.toFixed(1)}" stroke="#1e293b" stroke-width="1.1" />`;
        } else if (orig.px >= padLeft && orig.px <= xRight) {
          svg += `<line x1="${orig.px - 3.5}" y1="${py.toFixed(1)}" x2="${orig.px + 3.5}" y2="${py.toFixed(1)}" stroke="#1e293b" stroke-width="1.1" />`;
        }
        if (showNumbers) {
          if ((axesStyle === "center" || axesStyle === "origin") && Math.abs(gy) < 1e-10) continue;
          const numX = (axesStyle === "center" || axesStyle === "origin") && orig.px >= padLeft + 24 && orig.px <= xRight
            ? orig.px - 7
            : padLeft - 7;
          svg += `<text x="${numX}" y="${(py + 3.5).toFixed(1)}" fill="#1e293b" font-family="Helvetica, Arial, sans-serif" font-size="11" text-anchor="end">${formatTickNum(gy)}</text>`;
        }
      }
    }

    // Titolo ed etichette assi (xlabel, ylabel, title)
    if (title) {
      svg += `<foreignObject x="${padLeft}" y="4" width="${plotW}" height="24" style="overflow:visible;"><div xmlns="http://www.w3.org/1999/xhtml" style="text-align:center;font-family:'Fira Sans',Helvetica,sans-serif;font-size:13.5px;font-weight:700;color:#0f172a;">${title}</div></foreignObject>`;
    }
    if (xlabel) {
      svg += `<foreignObject x="${padLeft}" y="${height - 23}" width="${plotW}" height="22" style="overflow:visible;"><div xmlns="http://www.w3.org/1999/xhtml" style="text-align:center;font-family:'Fira Sans',Helvetica,sans-serif;font-size:12.5px;font-weight:600;color:#0f172a;">${xlabel}</div></foreignObject>`;
    }
    if (ylabel) {
      const midY = padTop + plotH / 2;
      svg += `<g transform="translate(15, ${midY}) rotate(-90)"><foreignObject x="-90" y="-12" width="180" height="24" style="overflow:visible;"><div xmlns="http://www.w3.org/1999/xhtml" style="text-align:center;font-family:'Fira Sans',Helvetica,sans-serif;font-size:12.5px;font-weight:600;color:#0f172a;">${ylabel}</div></foreignObject></g>`;
    }

    // Contenuto grafico ritagliato esattamente sul riquadro (<clipPath>)
    let clippedLayer = "";
    const legendEntries = [];
    let colorIdx = 0;

    const lines = content.split("\n").map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      const parsed = parseCommandLine(line);
      if (!parsed || !parsed.req) continue;
      const opts = parseKeyValOptions(parsed.opt);

      // \area{expr}[from=a, to=b, color=..., opacity=0.2, label=...]
      if (parsed.name === "area") {
        const col = opts.color || MATLAB_COLORS[colorIdx % MATLAB_COLORS.length];
        const op = parseFloat(opts.opacity || "0.2");
        const a0 = opts.from !== undefined ? parseFloat(opts.from) : xmin;
        const a1 = opts.to !== undefined ? parseFloat(opts.to) : xmax;
        const steps = 200;
        const pStart = toPx(a0, 0);
        const pEnd = toPx(a1, 0);
        let d = `M ${pStart.px.toFixed(1)} ${pStart.py.toFixed(1)} `;
        for (let s = 0; s <= steps; s++) {
          const x = a0 + (s / steps) * (a1 - a0);
          const y = safeMathEval(parsed.req, { x });
          if (!isNaN(y)) {
            const pt = toPx(x, y);
            d += `L ${pt.px.toFixed(1)} ${pt.py.toFixed(1)} `;
          }
        }
        d += `L ${pEnd.px.toFixed(1)} ${pEnd.py.toFixed(1)} Z`;
        clippedLayer += `<path d="${d}" fill="${escapeHtml(col)}" fill-opacity="${op}" stroke="none" />`;
        if (opts.label) legendEntries.push({ color: col, label: opts.label, style: "area" });
        continue;
      }

      // \func{expr}[color=..., linewidth=2, style=solid|dashed|dotted, domain=a..b, samples=420, label=...]
      if (parsed.name === "func") {
        const col = opts.color || MATLAB_COLORS[colorIdx++ % MATLAB_COLORS.length];
        const lw = parseFloat(opts.linewidth || "2");
        const dash = getLineDashArray(opts.style);
        const [d0, d1] = opts.domain ? parseRangePair(opts.domain, xmin, xmax) : [xmin, xmax];
        const samples = Math.min(1000, Math.max(120, parseInt(opts.samples || "420", 10)));
        const ySpan = ymax - ymin;

        let d = "";
        let prevY = NaN;
        let penDown = false;

        for (let s = 0; s <= samples; s++) {
          const x = d0 + (s / samples) * (d1 - d0);
          const y = safeMathEval(parsed.req, { x });
          if (isNaN(y) || !isFinite(y)) {
            penDown = false;
            prevY = NaN;
            continue;
          }
          // Rilevamento asintoti verticali (es. tan(x), 1/x): spezza il tracciato se salta di oltre 2.5x l'altezza
          if (penDown && !isNaN(prevY) && Math.abs(y - prevY) > ySpan * 2.5 && (y - ymax) * (prevY - ymin) > 0) {
            penDown = false;
          }
          const pt = toPx(x, y);
          d += `${penDown ? "L" : "M"} ${pt.px.toFixed(2)} ${pt.py.toFixed(2)} `;
          penDown = true;
          prevY = y;
        }
        clippedLayer += `<path d="${d}" fill="none" stroke="${escapeHtml(col)}" stroke-width="${lw}" stroke-linejoin="round" stroke-linecap="round" ${dash} />`;
        if (opts.label) legendEntries.push({ color: col, label: opts.label, style: opts.style || "solid" });
        continue;
      }

      // \plot{x1, x2, ...; y1, y2, ...}[color=..., marker=o, linewidth=2, style=solid, label=...]
      if (parsed.name === "plot") {
        const col = opts.color || MATLAB_COLORS[colorIdx++ % MATLAB_COLORS.length];
        const lw = parseFloat(opts.linewidth || "1.8");
        const dash = getLineDashArray(opts.style);
        const rows = splitTopLevel(parsed.req, ";");
        let pts = [];
        if (rows.length >= 2) {
          const xs = splitTopLevel(rows[0], ",").map(s => safeMathEval(s));
          const ys = splitTopLevel(rows[1], ",").map(s => safeMathEval(s));
          const len = Math.min(xs.length, ys.length);
          for (let k = 0; k < len; k++) {
            if (!isNaN(xs[k]) && !isNaN(ys[k])) pts.push({ x: xs[k], y: ys[k] });
          }
        } else {
          const pairs = [...parsed.req.matchAll(/\(([^,]+),([^)]+)\)/g)];
          pts = pairs.map(m => ({ x: safeMathEval(m[1]), y: safeMathEval(m[2]) })).filter(p => !isNaN(p.x) && !isNaN(p.y));
        }

        if (pts.length > 0) {
          if (String(opts.style || "solid").toLowerCase() !== "none") {
            const d = pts.map((p, idx) => {
              const px = toPx(p.x, p.y);
              return `${idx === 0 ? "M" : "L"} ${px.px.toFixed(1)} ${px.py.toFixed(1)}`;
            }).join(" ");
            clippedLayer += `<path d="${d}" fill="none" stroke="${escapeHtml(col)}" stroke-width="${lw}" ${dash} />`;
          }
          if (opts.marker && String(opts.marker).toLowerCase() !== "none") {
            pts.forEach(p => {
              const px = toPx(p.x, p.y);
              clippedLayer += renderMarkerSVG(px.px, px.py, opts.marker, col, parseFloat(opts.size || "4"));
            });
          }
          if (opts.label) legendEntries.push({ color: col, label: opts.label, style: opts.style || "solid", marker: opts.marker });
        }
        continue;
      }

      // \curve{x(t), y(t)}[t=0..2*pi, color=..., linewidth=2, style=..., label=...]
      if (parsed.name === "curve") {
        const col = opts.color || MATLAB_COLORS[colorIdx++ % MATLAB_COLORS.length];
        const lw = parseFloat(opts.linewidth || "2");
        const dash = getLineDashArray(opts.style);
        const [t0, t1] = parseRangePair(opts.t, 0, 2 * Math.PI);
        const comps = splitTopLevel(parsed.req, ",");
        if (comps.length >= 2) {
          let d = "";
          let penDown = false;
          for (let s = 0; s <= 320; s++) {
            const t = t0 + (s / 320) * (t1 - t0);
            const x = safeMathEval(comps[0], { t });
            const y = safeMathEval(comps[1], { t });
            if (isNaN(x) || isNaN(y)) { penDown = false; continue; }
            const pt = toPx(x, y);
            d += `${penDown ? "L" : "M"} ${pt.px.toFixed(1)} ${pt.py.toFixed(1)} `;
            penDown = true;
          }
          clippedLayer += `<path d="${d}" fill="none" stroke="${escapeHtml(col)}" stroke-width="${lw}" ${dash} />`;
          if (opts.label) legendEntries.push({ color: col, label: opts.label, style: opts.style || "solid" });
        }
        continue;
      }

      // \vector{(x1,y1) -> (x2,y2)}[color=..., linewidth=2, label=...]
      if (parsed.name === "vector") {
        const vm = parsed.req.match(/\(([^,]+),([^)]+)\)\s*->\s*\(([^,]+),([^)]+)\)/);
        if (vm) {
          const col = opts.color || MATLAB_COLORS[colorIdx++ % MATLAB_COLORS.length];
          const lw = parseFloat(opts.linewidth || "2.1");
          const p1 = toPx(safeMathEval(vm[1]), safeMathEval(vm[2]));
          const p2 = toPx(safeMathEval(vm[3]), safeMathEval(vm[4]));
          clippedLayer += `<line x1="${p1.px.toFixed(1)}" y1="${p1.py.toFixed(1)}" x2="${p2.px.toFixed(1)}" y2="${p2.py.toFixed(1)}" stroke="${escapeHtml(col)}" stroke-width="${lw}" marker-end="url(#${uid}_vec)" />`;
          if (opts.label) {
            clippedLayer += `<foreignObject x="${p2.px + 5}" y="${p2.py - 16}" width="90" height="24" style="overflow:visible;"><div xmlns="http://www.w3.org/1999/xhtml" style="font-size:12px;font-weight:700;color:${escapeHtml(col)};">${opts.label}</div></foreignObject>`;
          }
        }
        continue;
      }

      // \scatter{(x1,y1), (x2,y2), ...} & \point{(x,y)}
      if (parsed.name === "scatter" || parsed.name === "point") {
        const col = opts.color || MATLAB_COLORS[colorIdx++ % MATLAB_COLORS.length];
        const sz = parseFloat(opts.size || "4.2");
        const mk = opts.marker || (parsed.name === "point" ? "filled" : "o");
        const pairs = [...parsed.req.matchAll(/\(([^,]+),([^)]+)\)/g)];
        pairs.forEach(m => {
          const px = toPx(safeMathEval(m[1]), safeMathEval(m[2]));
          clippedLayer += renderMarkerSVG(px.px, px.py, mk, col, sz);
          if (opts.label && pairs.length === 1) {
            clippedLayer += `<foreignObject x="${px.px + 7}" y="${px.py - 16}" width="95" height="24" style="overflow:visible;"><div xmlns="http://www.w3.org/1999/xhtml" style="font-size:12px;font-weight:600;color:${escapeHtml(col)};">${opts.label}</div></foreignObject>`;
          }
        });
        if (opts.label && pairs.length > 1) legendEntries.push({ color: col, label: opts.label, style: "none", marker: mk });
        continue;
      }

      // \hline{y0} & \vline{x0}
      if (parsed.name === "hline") {
        const y0 = safeMathEval(parsed.req);
        const col = opts.color || "#64748b";
        const py = toPx(0, y0).py;
        clippedLayer += `<line x1="${padLeft}" y1="${py}" x2="${xRight}" y2="${py}" stroke="${escapeHtml(col)}" stroke-width="1.4" ${getLineDashArray(opts.style || "dashed")} />`;
        continue;
      }
      if (parsed.name === "vline") {
        const x0 = safeMathEval(parsed.req);
        const col = opts.color || "#64748b";
        const px = toPx(x0, 0).px;
        clippedLayer += `<line x1="${px}" y1="${padTop}" x2="${px}" y2="${yBottom}" stroke="${escapeHtml(col)}" stroke-width="1.4" ${getLineDashArray(opts.style || "dashed")} />`;
        continue;
      }

      // \text{(x,y)}{label}
      if (parsed.name === "text") {
        const pm = parsed.req.match(/\(([^,]+),([^)]+)\)/);
        if (pm) {
          const px = toPx(safeMathEval(pm[1]), safeMathEval(pm[2]));
          const labelMatch = line.slice(line.indexOf("}") + 1).match(/\{([^}]+)\}/);
          if (labelMatch) {
            clippedLayer += `<foreignObject x="${px.px}" y="${px.py - 12}" width="120" height="24" style="overflow:visible;"><div xmlns="http://www.w3.org/1999/xhtml" style="font-size:12px;color:${escapeHtml(opts.color || '#0f172a')};">${labelMatch[1]}</div></foreignObject>`;
          }
        }
      }
    }

    svg += `<g clip-path="url(#${uid}_clip)">${clippedLayer}</g>`;

    // Legenda in stile MATLAB
    if (legendEntries.length > 0 && legendPos !== "off" && legendPos !== "none") {
      const legW = 122;
      const legH = legendEntries.length * 20 + 10;
      let legX = xRight - legW - 10;
      let legY = padTop + 10;
      if (legendPos === "northwest") { legX = padLeft + 10; legY = padTop + 10; }
      else if (legendPos === "southeast") { legX = xRight - legW - 10; legY = yBottom - legH - 10; }
      else if (legendPos === "southwest") { legX = padLeft + 10; legY = yBottom - legH - 10; }
      else if (legendPos === "outside") { legX = xRight + 10; legY = padTop; }

      svg += `<rect x="${legX}" y="${legY}" width="${legW}" height="${legH}" fill="rgba(255,255,255,0.94)" stroke="#94a3b8" stroke-width="1" />`;
      legendEntries.forEach((ent, idx) => {
        const ly = legY + 14 + idx * 20;
        svg += `<line x1="${legX + 8}" y1="${ly}" x2="${legX + 28}" y2="${ly}" stroke="${escapeHtml(ent.color)}" stroke-width="2.2" ${getLineDashArray(ent.style)} />`;
        svg += `<foreignObject x="${legX + 34}" y="${ly - 10}" width="${legW - 38}" height="20" style="overflow:visible;"><div xmlns="http://www.w3.org/1999/xhtml" style="font-size:11px;color:#0f172a;white-space:nowrap;">${ent.label}</div></foreignObject>`;
      });
    }

    return `<div class="clawri-plot-wrap" style="margin:24px 0;display:flex;justify-content:center;"><svg class="clawri-exportable-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="max-width:100%;height:auto;overflow:visible;">${svg}</svg></div>`;
  }

  function renderPlot3DMATLAB(cfg, content, uid) {
    const [xmin, xmax] = cfg.xlim ? parseRangePair(cfg.xlim, -3, 3) : [parseFloat(cfg.xmin ?? "-3"), parseFloat(cfg.xmax ?? "3")];
    const [ymin, ymax] = cfg.ylim ? parseRangePair(cfg.ylim, -3, 3) : [parseFloat(cfg.ymin ?? "-3"), parseFloat(cfg.ymax ?? "3")];
    const [zmin, zmax] = cfg.zlim ? parseRangePair(cfg.zlim, -1.5, 1.5) : [parseFloat(cfg.zmin ?? "-1.5"), parseFloat(cfg.zmax ?? "1.5")];

    // Angoli camera MATLAB view(az, el) in gradi
    const [azDeg, elDeg] = cfg.view ? parseRangePair(cfg.view, -37.5, 30) : [-37.5, 30];
    const az = (azDeg * Math.PI) / 180;
    const el = (elDeg * Math.PI) / 180;

    const showGrid = !cfg.nogrid && isOptEnabled(cfg.grid, true);
    const showBox = isOptEnabled(cfg.box, true);
    const showNumbers = !cfg.nonumbers && isOptEnabled(cfg.numbers, true);
    const showColorbar = isOptEnabled(cfg.colorbar, false);
    const cmap = cfg.colormap || "parula";
    const xlabel = cfg.xlabel || "x";
    const ylabel = cfg.ylabel || "y";
    const zlabel = cfg.zlabel || "z";
    const title = cfg.title || "";

    const width = showColorbar ? 590 : 540;
    const height = 370;
    const cx = showColorbar ? 255 : 275;
    const cy = title ? 202 : 192;
    const scale = 115;

    // Normalizza coordinate in [-1, 1]^3 e applica proiezione ortografica MATLAB view(az, el)
    const proj3D = (x, y, z) => {
      const nx = ((x - xmin) / (xmax - xmin || 1)) * 2 - 1;
      const ny = ((y - ymin) / (ymax - ymin || 1)) * 2 - 1;
      const nz = ((z - zmin) / (zmax - zmin || 1)) * 2 - 1;

      const x1 = nx * Math.cos(az) - ny * Math.sin(az);
      const y1 = nx * Math.sin(az) + ny * Math.cos(az);

      const sx = x1;
      const sy = y1 * Math.sin(el) - nz * Math.cos(el);
      const depth = y1 * Math.cos(el) + nz * Math.sin(el);

      return {
        px: cx + sx * scale,
        py: cy + sy * scale,
        depth
      };
    };

    let svg = `<defs>
      <marker id="${uid}_v3" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="context-stroke" /></marker>
    </defs>`;

    if (title) {
      svg += `<foreignObject x="20" y="6" width="${width - 40}" height="24" style="overflow:visible;"><div xmlns="http://www.w3.org/1999/xhtml" style="text-align:center;font-family:'Fira Sans',Helvetica,sans-serif;font-size:13.5px;font-weight:700;color:#0f172a;">${title}</div></foreignObject>`;
    }

    // Disegna le 3 pareti posteriori del cubo 3D MATLAB + griglia
    const corners = [
      [xmin, ymin, zmin], [xmax, ymin, zmin], [xmax, ymax, zmin], [xmin, ymax, zmin],
      [xmin, ymin, zmax], [xmax, ymin, zmax], [xmax, ymax, zmax], [xmin, ymax, zmax]
    ];
    const pC = corners.map(c => proj3D(c[0], c[1], c[2]));

    // Pareti posteriori (bottom, back-left, back-right)
    const backFaces = [
      [pC[0], pC[1], pC[2], pC[3]], // floor z=zmin
      [pC[3], pC[2], pC[6], pC[7]], // back y=ymax
      [pC[1], pC[2], pC[6], pC[5]]  // right x=xmax
    ];

    if (showBox) {
      backFaces.forEach(face => {
        const pts = face.map(p => `${p.px.toFixed(1)},${p.py.toFixed(1)}`).join(" ");
        svg += `<polygon points="${pts}" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" />`;
      });
    }

    const xStep = cfg.xstep ? parseFloat(cfg.xstep) : niceStep(xmax - xmin, 5);
    const yStep = cfg.ystep ? parseFloat(cfg.ystep) : niceStep(ymax - ymin, 5);
    const zStep = cfg.zstep ? parseFloat(cfg.zstep) : niceStep(zmax - zmin, 5);

    const makeTicks = (a, b, st) => {
      const arr = [];
      const start = Math.ceil((a - 1e-9) / st) * st;
      for (let v = start; v <= b + 1e-9; v += st) arr.push(Number(v.toFixed(6)));
      return arr;
    };
    const xTicks = makeTicks(xmin, xmax, xStep);
    const yTicks = makeTicks(ymin, ymax, yStep);
    const zTicks = makeTicks(zmin, zmax, zStep);

    if (showGrid) {
      for (const gx of xTicks) {
        const a = proj3D(gx, ymin, zmin), b = proj3D(gx, ymax, zmin), c = proj3D(gx, ymax, zmax);
        svg += `<line x1="${a.px}" y1="${a.py}" x2="${b.px}" y2="${b.py}" stroke="#e2e8f0" stroke-width="0.9" />`;
        svg += `<line x1="${b.px}" y1="${b.py}" x2="${c.px}" y2="${c.py}" stroke="#e2e8f0" stroke-width="0.9" />`;
      }
      for (const gy of yTicks) {
        const a = proj3D(xmin, gy, zmin), b = proj3D(xmax, gy, zmin), c = proj3D(xmax, gy, zmax);
        svg += `<line x1="${a.px}" y1="${a.py}" x2="${b.px}" y2="${b.py}" stroke="#e2e8f0" stroke-width="0.9" />`;
        svg += `<line x1="${b.px}" y1="${b.py}" x2="${c.px}" y2="${c.py}" stroke="#e2e8f0" stroke-width="0.9" />`;
      }
      for (const gz of zTicks) {
        const a = proj3D(xmin, ymax, gz), b = proj3D(xmax, ymax, gz), c = proj3D(xmax, ymin, gz);
        svg += `<line x1="${a.px}" y1="${a.py}" x2="${b.px}" y2="${b.py}" stroke="#e2e8f0" stroke-width="0.9" />`;
        svg += `<line x1="${b.px}" y1="${b.py}" x2="${c.px}" y2="${c.py}" stroke="#e2e8f0" stroke-width="0.9" />`;
      }
    }

    // Assi principali X, Y, Z + numeri + etichette
    svg += `<line x1="${pC[0].px}" y1="${pC[0].py}" x2="${pC[1].px}" y2="${pC[1].py}" stroke="#1e293b" stroke-width="1.3" />`;
    svg += `<line x1="${pC[0].px}" y1="${pC[0].py}" x2="${pC[3].px}" y2="${pC[3].py}" stroke="#1e293b" stroke-width="1.3" />`;
    svg += `<line x1="${pC[0].px}" y1="${pC[0].py}" x2="${pC[4].px}" y2="${pC[4].py}" stroke="#1e293b" stroke-width="1.3" />`;

    if (showNumbers) {
      for (const gx of xTicks) {
        const p = proj3D(gx, ymin, zmin);
        svg += `<text x="${p.px}" y="${p.py + 14}" font-size="10" fill="#334155" text-anchor="middle">${formatTickNum(gx)}</text>`;
      }
      for (const gy of yTicks) {
        const p = proj3D(xmin, gy, zmin);
        svg += `<text x="${p.px - 8}" y="${p.py + 11}" font-size="10" fill="#334155" text-anchor="end">${formatTickNum(gy)}</text>`;
      }
      for (const gz of zTicks) {
        const p = proj3D(xmin, ymin, gz);
        svg += `<text x="${p.px - 8}" y="${p.py + 3}" font-size="10" fill="#334155" text-anchor="end">${formatTickNum(gz)}</text>`;
      }
    }

    const lxPos = proj3D((xmin + xmax) / 2, ymin, zmin);
    const lyPos = proj3D(xmin, (ymin + ymax) / 2, zmin);
    const lzPos = proj3D(xmin, ymin, (zmin + zmax) / 2);
    svg += `<foreignObject x="${lxPos.px - 35}" y="${lxPos.py + 18}" width="70" height="22" style="overflow:visible;"><div xmlns="http://www.w3.org/1999/xhtml" style="text-align:center;font-size:12px;font-weight:700;color:#0f172a;">${xlabel}</div></foreignObject>`;
    svg += `<foreignObject x="${lyPos.px - 75}" y="${lyPos.py + 10}" width="60" height="22" style="overflow:visible;"><div xmlns="http://www.w3.org/1999/xhtml" style="text-align:right;font-size:12px;font-weight:700;color:#0f172a;">${ylabel}</div></foreignObject>`;
    svg += `<foreignObject x="${lzPos.px - 75}" y="${lzPos.py - 10}" width="55" height="22" style="overflow:visible;"><div xmlns="http://www.w3.org/1999/xhtml" style="text-align:right;font-size:12px;font-weight:700;color:#0f172a;">${zlabel}</div></foreignObject>`;

    // Raccogli tutti gli elementi 3D per ordinamento Painter's algorithm (depth sort)
    const primitives3D = [];
    let colorIdx = 0;

    const lines = content.split("\n").map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      const parsed = parseCommandLine(line);
      if (!parsed || !parsed.req) continue;
      const opts = parseKeyValOptions(parsed.opt);

      // \surface{f(x,y)}[samples=24, colormap=parula, style=surf|mesh|wireframe, opacity=0.88]
      if (parsed.name === "surface") {
        const expr = parsed.req;
        const N = Math.min(40, Math.max(8, parseInt(opts.samples || "24", 10)));
        const surfMap = opts.colormap || cmap;
        const surfStyle = (opts.style || "surf").toLowerCase();
        const op = parseFloat(opts.opacity || "0.88");

        const gridPts = [];
        let zDataMin = Infinity, zDataMax = -Infinity;
        for (let i = 0; i <= N; i++) {
          const row = [];
          const x = xmin + (i / N) * (xmax - xmin);
          for (let j = 0; j <= N; j++) {
            const y = ymin + (j / N) * (ymax - ymin);
            const z = safeMathEval(expr, { x, y });
            if (!isNaN(z)) {
              if (z < zDataMin) zDataMin = z;
              if (z > zDataMax) zDataMax = z;
            }
            row.push({ x, y, z, p: isNaN(z) ? null : proj3D(x, y, z) });
          }
          gridPts.push(row);
        }

        const zSpan = (zDataMax - zDataMin) || 1;
        for (let i = 0; i < N; i++) {
          for (let j = 0; j < N; j++) {
            const a = gridPts[i][j], b = gridPts[i + 1][j], c = gridPts[i + 1][j + 1], d = gridPts[i][j + 1];
            if (!a.p || !b.p || !c.p || !d.p) continue;
            const avgDepth = (a.p.depth + b.p.depth + c.p.depth + d.p.depth) / 4;
            const avgZ = (a.z + b.z + c.z + d.z) / 4;
            const normZ = (avgZ - zDataMin) / zSpan;
            const fillCol = surfStyle === "mesh" ? "#ffffff" : sampleColormap(normZ, surfMap);
            const strokeCol = surfStyle === "mesh" ? sampleColormap(normZ, surfMap) : "#1e293b";
            const strokeOp = surfStyle === "mesh" ? "0.95" : "0.35";
            const ptsStr = `${a.p.px.toFixed(1)},${a.p.py.toFixed(1)} ${b.p.px.toFixed(1)},${b.p.py.toFixed(1)} ${c.p.px.toFixed(1)},${c.p.py.toFixed(1)} ${d.p.px.toFixed(1)},${d.p.py.toFixed(1)}`;
            primitives3D.push({
              depth: avgDepth,
              svg: `<polygon points="${ptsStr}" fill="${fillCol}" fill-opacity="${surfStyle === 'wireframe' ? 0 : op}" stroke="${strokeCol}" stroke-opacity="${strokeOp}" stroke-width="0.7" />`
            });
          }
        }
        continue;
      }

      // \param3d{x(u,v), y(u,v), z(u,v)}[u=0..2*pi, v=0..pi, samples=22, colormap=parula]
      if (parsed.name === "param3d") {
        const comps = splitTopLevel(parsed.req, ",");
        if (comps.length >= 3) {
          const [u0, u1] = parseRangePair(opts.u, 0, 2 * Math.PI);
          const [v0, v1] = parseRangePair(opts.v, 0, Math.PI);
          const N = Math.min(36, Math.max(8, parseInt(opts.samples || "22", 10)));
          const surfMap = opts.colormap || cmap;
          const op = parseFloat(opts.opacity || "0.88");

          const gridPts = [];
          let zMinVal = Infinity, zMaxVal = -Infinity;
          for (let i = 0; i <= N; i++) {
            const row = [];
            const u = u0 + (i / N) * (u1 - u0);
            for (let j = 0; j <= N; j++) {
              const v = v0 + (j / N) * (v1 - v0);
              const x = safeMathEval(comps[0], { u, v });
              const y = safeMathEval(comps[1], { u, v });
              const z = safeMathEval(comps[2], { u, v });
              if (!isNaN(z)) {
                if (z < zMinVal) zMinVal = z;
                if (z > zMaxVal) zMaxVal = z;
              }
              row.push({ z, p: (isNaN(x) || isNaN(y) || isNaN(z)) ? null : proj3D(x, y, z) });
            }
            gridPts.push(row);
          }

          const zSpan = (zMaxVal - zMinVal) || 1;
          for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
              const a = gridPts[i][j], b = gridPts[i + 1][j], c = gridPts[i + 1][j + 1], d = gridPts[i][j + 1];
              if (!a.p || !b.p || !c.p || !d.p) continue;
              const avgDepth = (a.p.depth + b.p.depth + c.p.depth + d.p.depth) / 4;
              const normZ = ((a.z + b.z + c.z + d.z) / 4 - zMinVal) / zSpan;
              const fillCol = sampleColormap(normZ, surfMap);
              const ptsStr = `${a.p.px.toFixed(1)},${a.p.py.toFixed(1)} ${b.p.px.toFixed(1)},${b.p.py.toFixed(1)} ${c.p.px.toFixed(1)},${c.p.py.toFixed(1)} ${d.p.px.toFixed(1)},${d.p.py.toFixed(1)}`;
              primitives3D.push({
                depth: avgDepth,
                svg: `<polygon points="${ptsStr}" fill="${fillCol}" fill-opacity="${op}" stroke="#1e293b" stroke-opacity="0.3" stroke-width="0.65" />`
              });
            }
          }
        }
        continue;
      }

      // \curve3d{x(t), y(t), z(t)}[t=0..12.56, color=#D95319, linewidth=2.4, style=solid|dashed]
      if (parsed.name === "curve3d") {
        const comps = splitTopLevel(parsed.req, ",");
        if (comps.length >= 3) {
          const col = opts.color || MATLAB_COLORS[(colorIdx++ + 1) % MATLAB_COLORS.length];
          const lw = parseFloat(opts.linewidth || "2.4");
          const dash = getLineDashArray(opts.style);
          const [t0, t1] = parseRangePair(opts.t, 0, 4 * Math.PI);
          const steps = Math.min(600, Math.max(100, parseInt(opts.samples || "240", 10)));

          let prevP = null;
          for (let s = 0; s <= steps; s++) {
            const t = t0 + (s / steps) * (t1 - t0);
            const x = safeMathEval(comps[0], { t });
            const y = safeMathEval(comps[1], { t });
            const z = safeMathEval(comps[2], { t });
            if (isNaN(x) || isNaN(y) || isNaN(z)) { prevP = null; continue; }
            const p = proj3D(x, y, z);
            if (prevP) {
              primitives3D.push({
                depth: (prevP.depth + p.depth) / 2,
                svg: `<line x1="${prevP.px.toFixed(1)}" y1="${prevP.py.toFixed(1)}" x2="${p.px.toFixed(1)}" y2="${p.py.toFixed(1)}" stroke="${escapeHtml(col)}" stroke-width="${lw}" stroke-linecap="round" ${dash} />`
              });
            }
            prevP = p;
          }
        }
        continue;
      }

      // \point3d{(x,y,z)} & \scatter3{(x1,y1,z1), ...}
      if (parsed.name === "point3d" || parsed.name === "scatter3") {
        const col = opts.color || MATLAB_COLORS[colorIdx++ % MATLAB_COLORS.length];
        const sz = parseFloat(opts.size || "4.2");
        const mk = opts.marker || (parsed.name === "point3d" ? "filled" : "o");
        const triples = [...parsed.req.matchAll(/\(([^,]+),([^,]+),([^)]+)\)/g)];
        triples.forEach(m => {
          const x = safeMathEval(m[1]), y = safeMathEval(m[2]), z = safeMathEval(m[3]);
          if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
            const p = proj3D(x, y, z);
            let elSvg = renderMarkerSVG(p.px, p.py, mk, col, sz);
            if (opts.label && triples.length === 1) {
              elSvg += `<foreignObject x="${p.px + 6}" y="${p.py - 16}" width="90" height="24" style="overflow:visible;"><div xmlns="http://www.w3.org/1999/xhtml" style="font-size:12px;font-weight:700;color:${escapeHtml(col)};">${opts.label}</div></foreignObject>`;
            }
            primitives3D.push({ depth: p.depth, svg: elSvg });
          }
        });
        continue;
      }

      // \vector3d{(x1,y1,z1) -> (x2,y2,z2)}[color=..., linewidth=2, label=...]
      if (parsed.name === "vector3d") {
        const vm = parsed.req.match(/\(([^,]+),([^,]+),([^)]+)\)\s*->\s*\(([^,]+),([^,]+),([^)]+)\)/);
        if (vm) {
          const col = opts.color || "#77AC30";
          const lw = parseFloat(opts.linewidth || "2.2");
          const p1 = proj3D(safeMathEval(vm[1]), safeMathEval(vm[2]), safeMathEval(vm[3]));
          const p2 = proj3D(safeMathEval(vm[4]), safeMathEval(vm[5]), safeMathEval(vm[6]));
          let elSvg = `<line x1="${p1.px.toFixed(1)}" y1="${p1.py.toFixed(1)}" x2="${p2.px.toFixed(1)}" y2="${p2.py.toFixed(1)}" stroke="${escapeHtml(col)}" stroke-width="${lw}" marker-end="url(#${uid}_v3)" />`;
          if (opts.label) {
            elSvg += `<foreignObject x="${p2.px + 5}" y="${p2.py - 16}" width="85" height="24" style="overflow:visible;"><div xmlns="http://www.w3.org/1999/xhtml" style="font-size:12px;font-weight:700;color:${escapeHtml(col)};">${opts.label}</div></foreignObject>`;
          }
          primitives3D.push({ depth: (p1.depth + p2.depth) / 2, svg: elSvg });
        }
      }
    }

    // Painter's algorithm: disegna prima ciò che è più lontano (depth maggiore)
    primitives3D.sort((a, b) => b.depth - a.depth);
    svg += primitives3D.map(item => item.svg).join("");

    // Colorbar MATLAB opzionale a destra
    if (showColorbar) {
      const cbX = width - 64;
      const cbY = 58;
      const cbW = 14;
      const cbH = 220;
      const steps = 28;
      for (let i = 0; i < steps; i++) {
        const t = 1 - i / steps;
        const y = cbY + (i / steps) * cbH;
        svg += `<rect x="${cbX}" y="${y.toFixed(1)}" width="${cbW}" height="${(cbH / steps + 0.8).toFixed(1)}" fill="${sampleColormap(t, cmap)}" />`;
      }
      svg += `<rect x="${cbX}" y="${cbY}" width="${cbW}" height="${cbH}" fill="none" stroke="#1e293b" stroke-width="1" />`;
      svg += `<text x="${cbX + cbW + 5}" y="${cbY + 8}" font-size="10" fill="#334155">${formatTickNum(zmax)}</text>`;
      svg += `<text x="${cbX + cbW + 5}" y="${cbY + cbH / 2 + 3}" font-size="10" fill="#334155">${formatTickNum((zmin + zmax) / 2)}</text>`;
      svg += `<text x="${cbX + cbW + 5}" y="${cbY + cbH}" font-size="10" fill="#334155">${formatTickNum(zmin)}</text>`;
    }

    return `<div class="clawri-plot-wrap" style="margin:24px 0;display:flex;justify-content:center;"><svg class="clawri-exportable-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="max-width:100%;height:auto;overflow:visible;">${svg}</svg></div>`;
  }

  function renderPlotSVG(dimOpt, rangeOpt, content) {
    const dimClean = (dimOpt || "2d").trim().toLowerCase();
    const is3D = dimClean.includes("3d");
    // Permette anche \begin{plot}[2d, grid=off, xlabel=$t$] oppure \begin{plot}[2d][grid=off, xlabel=$t$]
    const combinedOpts = [
      dimClean.includes("=") ? dimOpt : "",
      rangeOpt || ""
    ].filter(Boolean).join(", ");

    const cfg = parseKeyValOptions(combinedOpts);
    const uid = "plt_" + Math.random().toString(36).slice(2, 7);

    return is3D
      ? renderPlot3DMATLAB(cfg, content, uid)
      : renderPlot2DMATLAB(cfg, content, uid);
  }

  return {
    safeMathEval,
    renderDiagramSVG,
    renderSetDiagramSVG,
    renderGraphSVG,
    renderTreeSVG,
    renderPlotSVG
  };
})();

