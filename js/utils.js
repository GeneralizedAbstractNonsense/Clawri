
/* ============================================================================
   MODULE 1: Clawri.Utils (Shared Pure Helpers)
   ============================================================================ */
window.Clawri = window.Clawri || {};

Clawri.Utils = (function() {
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function slugify(str) {
    return (str || "article")
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "article";
  }

  function splitTopLevel(str, sep) {
    const parts = [];
    let depthParen = 0, depthBrack = 0, depthBrace = 0;
    let start = 0;
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      if (ch === "\\" && i + 1 < str.length) { i++; continue; }
      if (ch === "(") depthParen++;
      else if (ch === ")") depthParen = Math.max(0, depthParen - 1);
      else if (ch === "[") depthBrack++;
      else if (ch === "]") depthBrack = Math.max(0, depthBrack - 1);
      else if (ch === "{") depthBrace++;
      else if (ch === "}") depthBrace = Math.max(0, depthBrace - 1);
      else if (ch === sep && depthParen === 0 && depthBrack === 0 && depthBrace === 0) {
        parts.push(str.slice(start, i));
        start = i + 1;
      }
    }
    parts.push(str.slice(start));
    return parts;
  }

  function parseKeyValOptions(optStr) {
    const opts = {};
    if (!optStr) return opts;
    const parts = splitTopLevel(optStr, ",");
    for (const p of parts) {
      const eq = p.indexOf("=");
      if (eq !== -1) {
        opts[p.slice(0, eq).trim().toLowerCase()] = p.slice(eq + 1).trim();
      } else if (p.trim()) {
        opts[p.trim().toLowerCase()] = true;
      }
    }
    return opts;
  }

  function readBalanced(str, pos, openChar, closeChar) {
    if (str[pos] !== openChar) return null;
    let depth = 0;
    let i = pos;
    while (i < str.length) {
      if (str[i] === "\\" && i + 1 < str.length) { i += 2; continue; }
      if (str[i] === openChar) depth++;
      else if (str[i] === closeChar) {
        depth--;
        if (depth === 0) {
          return { content: str.slice(pos + 1, i), nextPos: i + 1 };
        }
      }
      i++;
    }
    return null;
  }

  function findMatchingEndEnv(str, startPos, envName) {
    const beginTok = `\\begin{${envName}}`;
    const endTok = `\\end{${envName}}`;
    let depth = 1;
    let pos = startPos;
    while (pos < str.length) {
      const nextBegin = str.indexOf(beginTok, pos);
      const nextEnd = str.indexOf(endTok, pos);
      if (nextEnd === -1) return -1;
      if (nextBegin !== -1 && nextBegin < nextEnd) {
        depth++;
        pos = nextBegin + beginTok.length;
      } else {
        depth--;
        if (depth === 0) return nextEnd;
        pos = nextEnd + endTok.length;
      }
    }
    return -1;
  }

  function safeMathEval(expr, vars = {}) {
    try {
      let js = expr
        .replace(/\^/g, "**")
        .replace(/\b(sin|cos|tan|asin|acos|atan|sqrt|abs|exp|log|floor|ceil|round|min|max)\b/g, "Math.$1")
        .replace(/\bln\b/g, "Math.log")
        .replace(/\bpi\b/gi, "Math.PI")
        .replace(/\be\b/g, "Math.E");
      const keys = Object.keys(vars);
      const vals = Object.values(vars);
      const fn = new Function(...keys, `"use strict"; return (${js});`);
      const v = fn(...vals);
      return typeof v === "number" && isFinite(v) ? v : NaN;
    } catch {
      return NaN;
    }
  }

  return {
    escapeHtml,
    slugify,
    splitTopLevel,
    parseKeyValOptions,
    readBalanced,
    findMatchingEndEnv,
    safeMathEval
  };
})();

