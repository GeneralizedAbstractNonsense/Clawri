
/* ============================================================================
   MODULE 7: Clawri.Preview (NO AUTO-SCROLL ON TYPE/CLICK + Double-Click Sync)
   ============================================================================ */
Clawri.Preview = (function() {
  let initialized = false;
  let timer = null;

  function scheduleRefresh() {
    clearTimeout(timer);
    timer = setTimeout(() => refresh(false), 260);
  }

  function refresh(forceFullReload = false) {
    const iframe = document.getElementById("preview-frame");
    const fullHtml = Clawri.Compiler.buildFullDocumentHTML({ isExport: false });

    if (!initialized || forceFullReload) {
      iframe.srcdoc = fullHtml;
      initialized = true;
      iframe.onload = () => {
        attachDoubleClickJump(iframe);
        // NOTE: Intentionally NO auto-scrolling on load/type/click!
      };
      return;
    }

    try {
      const doc = iframe.contentDocument;
      const win = iframe.contentWindow;
      if (!doc || !doc.getElementById("article-body")) {
        iframe.srcdoc = fullHtml;
        return;
      }

      // Preserve exact user scroll position before updating DOM!
      const savedScrollX = win ? win.scrollX : 0;
      const savedScrollY = win ? win.scrollY : 0;

      const parser = new DOMParser();
      const parsed = parser.parseFromString(fullHtml, "text/html");

      doc.getElementById("theme-css").textContent = parsed.getElementById("theme-css").textContent;
      doc.getElementById("font-override-css").textContent = parsed.getElementById("font-override-css").textContent;
      doc.querySelector(".top-nav").innerHTML = parsed.querySelector(".top-nav").innerHTML;
      const newHeader = parsed.querySelector(".article-header");
      const curHeader = doc.querySelector(".article-header");
      curHeader.setAttribute("data-tag", newHeader.getAttribute("data-tag") || "");
      curHeader.innerHTML = newHeader.innerHTML;
      doc.getElementById("article-body").innerHTML = parsed.getElementById("article-body").innerHTML;
      doc.querySelector(".article-footer").innerHTML = parsed.querySelector(".article-footer").innerHTML;

      const proj = Clawri.State.getActiveProject();
      const compiled = Clawri.Compiler.compileDocument(proj.source);
      if (win && win.footnotesData) {
        Object.keys(win.footnotesData).forEach(k => delete win.footnotesData[k]);
        compiled.footnotes.forEach(f => { win.footnotesData[f.num] = f.html; });
      }

      // Restore scroll position immediately
      if (win) win.scrollTo(savedScrollX, savedScrollY);

      if (win && win.MathJax && win.MathJax.typesetPromise) {
        win.MathJax.typesetClear([doc.getElementById("article-body")]);
        win.MathJax.typesetPromise([doc.getElementById("article-body")]).then(() => {
          if (win.positionDesktopSidenotes) win.positionDesktopSidenotes();
          // Restore scroll position after MathJax reflows heights
          win.scrollTo(savedScrollX, savedScrollY);
        }).catch(() => {});
      } else if (win && win.positionDesktopSidenotes) {
        win.positionDesktopSidenotes();
        if (win) win.scrollTo(savedScrollX, savedScrollY);
      }
    } catch (_) {
      iframe.srcdoc = fullHtml;
    }
  }

  function attachDoubleClickJump(iframe) {
    try {
      const doc = iframe.contentDocument;
      if (!doc || doc._clawriDblSyncAttached) return;
      doc._clawriDblSyncAttached = true;
      doc.addEventListener("dblclick", (e) => {
        const clickedText = (e.target.innerText || e.target.textContent || "").trim();
        if (!clickedText) return;
        const snippet = clickedText.replace(/\s+/g, " ").slice(0, 28);
        const lines = Clawri.Editor.cm.getValue().split("\n");
        let foundLine = -1;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(snippet)) { foundLine = i; break; }
        }
        if (foundLine === -1 && snippet.length > 10) {
          const shortSnip = snippet.slice(0, 14);
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(shortSnip)) { foundLine = i; break; }
          }
        }
        if (foundLine !== -1) {
          Clawri.Editor.cm.focus();
          Clawri.Editor.cm.setCursor({ line: foundLine, ch: 0 });
          Clawri.Editor.cm.scrollIntoView({ line: foundLine, ch: 0 }, 120);
          const handle = Clawri.Editor.cm.addLineClass(foundLine, "background", "cm-jump-flash");
          setTimeout(() => Clawri.Editor.cm.removeLineClass(foundLine, "background", "cm-jump-flash"), 900);
          Clawri.UI.setStatus(`Jumped to line ${foundLine + 1}`);
        }
      });
    } catch (_) {}
  }

  return {
    scheduleRefresh,
    refresh
  };
})();
