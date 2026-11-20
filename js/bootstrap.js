
/* ============================================================================
   MODULE 12: Clawri.Bootstrap (Global Events, Clock & Initialization)
   ============================================================================ */
window.Clawri = window.Clawri || {};

Clawri.Bootstrap = (function() {
  function setupEvents() {
    const cmdInput = document.getElementById("cmdline-input");
    cmdInput.addEventListener("input", () => Clawri.Editor.updateCmdlineSuggestions(cmdInput.value));
    cmdInput.addEventListener("keydown", (e) => {
      const matches = Clawri.Editor.getCmdSugMatches();
      if (e.key === "ArrowDown" && matches.length > 0) {
        e.preventDefault();
        Clawri.Editor.setCmdSugIdx((Clawri.Editor.getCmdSugIdx() + 1) % Math.min(matches.length, 7));
      } else if (e.key === "Tab" && matches.length > 0) {
        e.preventDefault();
        cmdInput.value = matches[Clawri.Editor.getCmdSugIdx()].cmd;
      } else if (e.key === "Enter") {
        e.preventDefault();
        Clawri.Editor.executeCommand(cmdInput.value);
      } else if (e.key === "Escape") {
        e.preventDefault();
        Clawri.Editor.closeCommandBar();
      }
    });

    const termInput = document.getElementById("terminal-input");
    termInput.addEventListener("keydown", (e) => {
      const hist = Clawri.VFS.getTermHistory();
      let idx = Clawri.VFS.getTermHistIdx();
      if (e.key === "Enter") {
        e.preventDefault();
        const val = termInput.value;
        termInput.value = "";
        Clawri.VFS.executeTerminalCommand(val);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (idx > 0) { idx--; Clawri.VFS.setTermHistIdx(idx); termInput.value = hist[idx] || ""; }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (idx < hist.length - 1) { idx++; Clawri.VFS.setTermHistIdx(idx); termInput.value = hist[idx] || ""; }
        else { Clawri.VFS.setTermHistIdx(hist.length); termInput.value = ""; }
      }
    });

    window.addEventListener("keydown", (e) => {
      const isMod = e.metaKey || e.ctrlKey;

      if (isMod && e.key.toLowerCase() === "e") {
        e.preventDefault();
        if (document.getElementById("cmdline-overlay").classList.contains("open")) { Clawri.Editor.closeCommandBar(); return; }
        if (document.getElementById("terminal-overlay").classList.contains("open")) { Clawri.VFS.closeTerminal(); return; }
        if (document.getElementById("home-overlay").classList.contains("open")) { Clawri.UI.closeHomeModal(); return; }
        if (document.querySelector(".modal-backdrop.open")) { Clawri.UI.closeModals(); return; }
        if (Clawri.Editor.cm && CodeMirror.Vim) {
          CodeMirror.Vim.exitInsertMode(Clawri.Editor.cm);
          Clawri.Editor.focus();
        }
        return;
      }

      if (isMod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        Clawri.Exporters.exportBlogZip();
        return;
      }

      if (document.getElementById("home-overlay").classList.contains("open")) {
        Clawri.UI.handleHomeKeydown(e);
        return;
      }

      const ftPane = document.getElementById("file-tree-pane");
      if (ftPane.classList.contains("open") && ftPane.contains(document.activeElement)) {
        Clawri.VFS.handleTreeKeydown(e);
      }
    });
  }

  function startClock() {
    const update = () => {
      const now = new Date();
      document.getElementById("status-clock").textContent =
        String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
    };
    update();
    setInterval(update, 15000);
  }

  function boot() {
    Clawri.Editor.init();
    Clawri.VFS.setupDragAndDrop();
    Clawri.VFS.renderFileTree();
    Clawri.UI.updateProjectHeaderUI();
    Clawri.Preview.refresh(true);
    setupEvents();
    startClock();
    Clawri.Config.discoverRepoThemes(false);
    setTimeout(() => Clawri.Editor.focus(), 80);
  }

  return { boot };
})();

window.addEventListener("DOMContentLoaded", Clawri.Bootstrap.boot);
