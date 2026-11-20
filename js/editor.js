
/* ============================================================================
   MODULE 9: Clawri.Editor (CodeMirror 5 Vim, Autocomplete & Command Bar)
   ============================================================================ */
window.Clawri = window.Clawri || {};


Clawri.Editor = (function() {
  const { escapeHtml } = Clawri.Utils;
  let cm = null;
  let currentMode = "NORMAL";
  let cmpMatches = [];
  let cmpIndex = 0;
  let cmpStartPos = null;
  let leaderPending = false;
  let leaderTimer = null;

  const COMMAND_LINE_ACTIONS = [
    { cmd: "home", desc: "Open LazyVim Projects Dashboard" },
    { cmd: "files", desc: "Toggle Project File Explorer sidebar" },
    { cmd: "term", desc: "Open Integrated Virtual Terminal" },
    { cmd: "settings", desc: "Open Hard Settings (Templates, Fonts, Commands, RSS)" },
    { cmd: "properties", desc: "Open Soft Settings (Title, Author, Favicon, License)" },
    { cmd: "help", desc: "Open Clawri Reference & Commands" },
    { cmd: "full", desc: "Toggle Zen Fullscreen mode" },
    { cmd: "export zip", desc: "Download Self-Contained Blog .zip (Cmd+D)" },
    { cmd: "export html", desc: "Export standalone index.html" },
    { cmd: "export pdf", desc: "Print / Save PDF" },
    { cmd: "export tex", desc: "Export .tex + 300-DPI PNG figures" },
    { cmd: "export clawri", desc: "Export .clawri project bundle" },
    { cmd: "export rss", desc: "Download rss.xml feed" },
    { cmd: "new", desc: "Create a new project" },
    { cmd: "sample", desc: "Load full interactive showcase" },
    { cmd: "w", desc: "Save current project to local VFS" }
  ];

  let cmdSugMatches = [];
  let cmdSugIdx = 0;

  function defineMode() {
    CodeMirror.defineMode("clawritex", function() {
      return {
        startState() { return { inMath: false }; },
        token(stream, state) {
          if (stream.sol() && stream.peek() === "%") { stream.skipToEnd(); return "clawri-comment"; }
          if (stream.match("$$")) { state.inMath = !state.inMath; return "clawri-math"; }
          if (stream.match("$")) { state.inMath = !state.inMath; return "clawri-math"; }
          if (stream.match(/\\begin\{[^}]+\}|\\end\{[^}]+\}/)) return "clawri-env";
          if (stream.match(/\\[a-zA-Z]+/)) return "clawri-cmd";
          if (stream.match(/[\{\}\[\]]/)) return "clawri-brace";
          stream.next();
          return state.inMath ? "clawri-math" : null;
        }
      };
    });
  }

  function init() {
    defineMode();
    const mount = document.getElementById("editor-mount");
    const proj = Clawri.State.getActiveProject();

    cm = CodeMirror(mount, {
      value: proj.source,
      mode: "clawritex",
      keyMap: "vim",
      lineNumbers: true,
      lineWrapping: true,
      styleActiveLine: true,
      matchBrackets: true,
      autoCloseBrackets: true,
      tabSize: 2,
      indentUnit: 2,
      extraKeys: {
        "Tab": (instance) => {
          if (document.getElementById("cmp-popup").style.display === "block") {
            acceptAutocomplete();
            return;
          }
          instance.replaceSelection("  ");
        },
        "Down": (instance) => {
          if (document.getElementById("cmp-popup").style.display === "block") {
            cmpIndex = (cmpIndex + 1) % Math.min(cmpMatches.length, 10);
            renderAutocompletePopup();
            return;
          }
          return CodeMirror.Pass;
        },
        "Up": (instance) => {
          if (document.getElementById("cmp-popup").style.display === "block") {
            cmpIndex = (cmpIndex - 1 + Math.min(cmpMatches.length, 10)) % Math.min(cmpMatches.length, 10);
            renderAutocompletePopup();
            return;
          }
          return CodeMirror.Pass;
        },
        "Enter": (instance) => {
          if (document.getElementById("cmp-popup").style.display === "block") {
            acceptAutocomplete();
            return;
          }
          return CodeMirror.Pass;
        }
      }
    });

    Clawri.Editor.cm = cm;

    if (CodeMirror.Vim) {
      CodeMirror.Vim.defineEx("w", "w", () => { Clawri.State.save(); Clawri.UI.setStatus("Written to local project VFS"); });
      CodeMirror.Vim.defineEx("home", "home", () => Clawri.UI.openHomeModal());
      CodeMirror.Vim.defineEx("files", "files", () => Clawri.VFS.toggleFileTree());
      CodeMirror.Vim.defineEx("term", "term", () => Clawri.VFS.openTerminal());
      CodeMirror.Vim.defineEx("settings", "settings", () => Clawri.UI.openSettingsModal());
      CodeMirror.Vim.defineEx("properties", "properties", () => Clawri.UI.openPropertiesModal());
      CodeMirror.Vim.defineEx("help", "help", () => Clawri.UI.openHelpModal());
      CodeMirror.Vim.defineEx("full", "full", () => Clawri.UI.toggleZenFullscreen());
      CodeMirror.Vim.defineEx("export", "export", (_, params) => handleExportArg(params.args ? params.args[0] : "html"));
    }

    cm.on("vim-mode-change", (e) => {
      currentMode = (e.mode || "NORMAL").toUpperCase();
      updateModeBadge(currentMode);
      if (currentMode !== "INSERT") hideAutocomplete();
    });

    cm.on("change", () => {
      const p = Clawri.State.getActiveProject();
      p.source = cm.getValue();
      Clawri.State.save();
      Clawri.UI.updateProjectHeaderUI();
      Clawri.Preview.scheduleRefresh();
      updateAutocomplete();
    });

    // IMPORTANT: cursorActivity ONLY updates status bar coordinates — NO auto-scrolling!
    cm.on("cursorActivity", () => {
      const cur = cm.getCursor();
      const total = cm.lineCount();
      const pct = total <= 1 ? "Top" : (cur.line === 0 ? "Top" : (cur.line === total - 1 ? "Bot" : Math.round(((cur.line + 1) / total) * 100) + "%"));
      document.getElementById("cursor-pos").textContent = `${pct} ${cur.line + 1}:${cur.ch + 1}`;
      const lineTxt = cm.getLine(cur.line) || "";
      const ch = lineTxt[cur.ch] || lineTxt[cur.ch - 1] || "";
      document.getElementById("status-script").textContent = /[\u0370-\u03FF\u1F00-\u1FFF]/.test(ch) ? "GREEK" : "UTF-8";
    });

    cm.on("focus", () => {
      document.getElementById("editor-pane").classList.add("focused");
      document.getElementById("preview-pane").classList.remove("focused");
    });

    cm.on("keydown", (instance, e) => {
      if (currentMode === "NORMAL" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (leaderPending) {
          e.preventDefault();
          leaderPending = false;
          clearTimeout(leaderTimer);
          handleLeaderCombo(e.key);
          return;
        }
        if (e.key === " ") {
          e.preventDefault();
          leaderPending = true;
          Clawri.UI.setStatus("<Leader> pressed: [h]ome [e]files [t]erm [s]ettings [p]rops [f]ull [z]ip [x]tex");
          leaderTimer = setTimeout(() => { leaderPending = false; }, 1600);
          return;
        }
        if (e.key === ":") {
          e.preventDefault();
          openCommandBar(":");
        }
      }
    });
  }

  function handleLeaderCombo(key) {
    if (key === "h") Clawri.UI.openHomeModal();
    else if (key === "e") Clawri.VFS.toggleFileTree();
    else if (key === "t") Clawri.VFS.openTerminal();
    else if (key === "s") Clawri.UI.openSettingsModal();
    else if (key === "p") Clawri.UI.openPropertiesModal();
    else if (key === "f") Clawri.UI.toggleZenFullscreen();
    else if (key === "z") Clawri.Exporters.exportBlogZip();
    else if (key === "x") Clawri.Exporters.exportTeX();
    else if (key === "w") { Clawri.State.save(); Clawri.UI.setStatus("Project saved"); }
    else Clawri.UI.setStatus("Leader cancelled");
  }

  function getAllCompletions() {
    const custom = (Clawri.State.data.customCommands || [])
      .filter(c => c.name && c.name.startsWith("\\"))
      .map(c => {
        const braces = Array.from({ length: Number(c.args) || 0 }, (_, i) => i === 0 ? "{$1}" : "{}").join("");
        return { cmd: c.name + braces, insert: c.name + (braces || "$1"), desc: "Custom inline command" };
      });

    const builtInInline = Object.entries(Clawri.Commands.INLINE_COMMANDS).map(([name, def]) => ({
      cmd: "\\" + name,
      insert: def.snippet || `\\${name}{$1}`,
      desc: def.desc || "Inline command"
    }));

    const envsAndBlocks = [
      { cmd: "\\begin{itemize}[numbers]", insert: "\\begin{itemize}[numbers]\n\\item $1\n\\item \n\\end{itemize}", desc: "Numbered list (1, 2, 3)" },
      { cmd: "\\begin{itemize}[roman]", insert: "\\begin{itemize}[roman]\n\\item $1\n\\item \n\\end{itemize}", desc: "Lowercase Roman list (i, ii, iii)" },
      { cmd: "\\begin{itemize}[Roman]", insert: "\\begin{itemize}[Roman]\n\\item $1\n\\item \n\\end{itemize}", desc: "Uppercase Roman list (I, II, III)" },
      { cmd: "\\begin{itemize}[dots]", insert: "\\begin{itemize}[dots]\n\\item $1\n\\item \n\\end{itemize}", desc: "Bulleted list" },
      { cmd: "\\begin{plot}[2d]", insert: "\\begin{plot}[2d][xmin=-5, xmax=5, ymin=-3, ymax=3, xlabel=$x$, ylabel=$y$, grid=true, numbers=true]\n\\func{sin(x)}[color=#2563eb, label=$\\sin x$]\n\\end{plot}", desc: "2D clipped plot with custom axes" },
      { cmd: "\\begin{plot}[3d]", insert: "\\begin{plot}[3d][xlabel=x, ylabel=y, zlabel=z, grid=true]\n\\surface{sin(sqrt(x^2+y^2))}\n\\end{plot}", desc: "3D surface & curve plot" },
      { cmd: "\\begin{theorem}", insert: "\\begin{theorem}[$1]\n\n\\end{theorem}", desc: "Theorem environment" },
      { cmd: "\\begin{definition}", insert: "\\begin{definition}[$1]\n\n\\end{definition}", desc: "Definition environment" },
      { cmd: "\\begin{proof}", insert: "\\begin{proof}\n$1\n\\end{proof}", desc: "Proof environment" },
      { cmd: "\\begin{box}", insert: "\\begin{box}[info][$1Title]\nContent...\n\\end{box}", desc: "Callout box" },
      { cmd: "\\begin{draw}[diagram]", insert: "\\begin{draw}[diagram]\n\\node (A) at (0,0) {$A$}\n\\node (B) at (3,0) {$B$}\n\\arrow (A) -> (B) [label=$f$]\n\\end{draw}", desc: "Commutative diagram" },
      { cmd: "\\begin{draw}[set]", insert: "\\begin{draw}[set]\n\\draw Universe [label=$U$]\n\\draw set A at (-0.8,0) [r=1.3, color=#3b82f6, label=$A$]\n\\draw set B at (0.8,0) [r=1.3, color=#10b981, label=$B$]\n\\end{draw}", desc: "Venn set diagram" },
      { cmd: "\\section{}", insert: "\\section{$1}", desc: "Section heading" },
      { cmd: "\\subsection{}", insert: "\\subsection{$1}", desc: "Subsection heading" },
      { cmd: "\\bmat{}", insert: "\\bmat{[eye(2), [1,0;3,4]; [1,2], [5,6]]}", desc: "MATLAB block matrix" }
    ];

    const macroMatches = [...(Clawri.State.data.latexMacros || "").matchAll(/\\(?:re)?newcommand\{\\([a-zA-Z]+)\}/g)];
    const macroItems = macroMatches.map(m => ({ cmd: "\\" + m[1], insert: "\\" + m[1], desc: "LaTeX macro" }));

    const seen = new Set();
    return [...custom, ...builtInInline, ...envsAndBlocks, ...macroItems].filter(item => {
      if (seen.has(item.cmd)) return false;
      seen.add(item.cmd);
      return true;
    });
  }

  function updateAutocomplete() {
    if (!cm || currentMode !== "INSERT") { hideAutocomplete(); return; }
    const cursor = cm.getCursor();
    const line = cm.getLine(cursor.line);
    const before = line.slice(0, cursor.ch);
    const match = before.match(/(\\[a-zA-Z]*)$/);
    if (!match) { hideAutocomplete(); return; }

    const prefix = match[1].toLowerCase();
    cmpMatches = getAllCompletions().filter(item => item.cmd.toLowerCase().startsWith(prefix));
    if (cmpMatches.length === 0) { hideAutocomplete(); return; }

    cmpStartPos = { line: cursor.line, ch: cursor.ch - match[1].length };
    cmpIndex = 0;
    renderAutocompletePopup();
  }

  function renderAutocompletePopup() {
    const popup = document.getElementById("cmp-popup");
    const list = document.getElementById("cmp-list");
    list.innerHTML = cmpMatches.slice(0, 10).map((m, idx) => `
      <div class="cmp-item ${idx === cmpIndex ? 'active' : ''}" onmousedown="Clawri.Editor.acceptAutocomplete(${idx})">
        <span class="cmp-item-cmd">${escapeHtml(m.cmd)}</span>
        <span class="cmp-item-desc">${escapeHtml(m.desc)}</span>
      </div>
    `).join("");

    const coords = cm.cursorCoords(true, "window");
    popup.style.left = Math.min(coords.left, window.innerWidth - 360) + "px";
    popup.style.top = (coords.bottom + 4) + "px";
    popup.style.display = "block";
  }

  function hideAutocomplete() {
    document.getElementById("cmp-popup").style.display = "none";
    cmpMatches = [];
    cmpStartPos = null;
  }

  function acceptAutocomplete(idx = cmpIndex) {
    if (!cmpMatches[idx] || !cmpStartPos) return false;
    const item = cmpMatches[idx];
    const cursor = cm.getCursor();
    const raw = item.insert;
    const markerIdx = raw.indexOf("$1");
    const cleanText = raw.replace("$1", "");
    cm.replaceRange(cleanText, cmpStartPos, cursor);

    if (markerIdx !== -1) {
      const beforeMarker = raw.slice(0, markerIdx);
      const lines = beforeMarker.split("\n");
      const targetLine = cmpStartPos.line + lines.length - 1;
      const targetCh = lines.length === 1 ? cmpStartPos.ch + lines[0].length : lines[lines.length - 1].length;
      cm.setCursor({ line: targetLine, ch: targetCh });
    }
    hideAutocomplete();
    cm.focus();
    return true;
  }

  function updateModeBadge(modeStr) {
    const badge = document.getElementById("mode-badge");
    badge.textContent = modeStr;
    badge.className = "mode-badge";
    if (modeStr.includes("INSERT")) badge.classList.add("insert");
    else if (modeStr.includes("VISUAL")) badge.classList.add("visual");
    else if (modeStr.includes("SETTINGS") || modeStr.includes("PROPERTIES")) badge.classList.add("settings");
    else if (modeStr.includes("COMMAND")) badge.classList.add("command");
  }

  function focus() {
    if (cm) cm.focus();
  }

  function openCommandBar(initialText = "") {
    const overlay = document.getElementById("cmdline-overlay");
    const input = document.getElementById("cmdline-input");
    overlay.classList.add("open");
    input.value = initialText === ":" ? "" : initialText;
    updateModeBadge("COMMAND");
    updateCmdlineSuggestions(input.value);
    setTimeout(() => input.focus(), 10);
  }

  function closeCommandBar() {
    document.getElementById("cmdline-overlay").classList.remove("open");
    updateModeBadge(currentMode);
    focus();
  }

  function updateCmdlineSuggestions(query) {
    const q = query.trim().toLowerCase();
    cmdSugMatches = COMMAND_LINE_ACTIONS.filter(item => item.cmd.startsWith(q) || item.desc.toLowerCase().includes(q));
    cmdSugIdx = 0;
    const box = document.getElementById("cmdline-suggestions");
    if (cmdSugMatches.length === 0) { box.classList.remove("has-items"); return; }
    box.classList.add("has-items");
    box.innerHTML = cmdSugMatches.slice(0, 7).map((item, idx) => `
      <div class="cmdline-sug-item ${idx === cmdSugIdx ? 'active' : ''}" onmousedown="Clawri.Editor.executeCommand('${item.cmd}')">
        <span>:${escapeHtml(item.cmd)}</span>
        <span style="color:var(--fg-muted);font-size:11px;">${escapeHtml(item.desc)}</span>
      </div>
    `).join("");
  }

  function handleExportArg(arg) {
    const fmt = (arg || "html").toLowerCase();
    if (fmt === "zip") Clawri.Exporters.exportBlogZip();
    else if (fmt === "pdf") Clawri.Exporters.exportPDF();
    else if (fmt === "tex" || fmt === "latex") Clawri.Exporters.exportTeX();
    else if (fmt === "clawri" || fmt === "bundle") Clawri.Exporters.exportClawriBundle();
    else if (fmt === "rss" || fmt === "xml") Clawri.Exporters.exportRSS();
    else Clawri.Exporters.exportHTML();
  }

  function executeCommand(rawCmd) {
    const clean = rawCmd.trim().replace(/^:/, "");
    closeCommandBar();
    if (!clean) return;
    const parts = clean.split(/\s+/);
    const root = parts[0].toLowerCase();
    const arg = parts[1] ? parts[1].toLowerCase() : "";

    if (root === "home" || root === "projects") Clawri.UI.openHomeModal();
    else if (root === "files" || root === "tree") Clawri.VFS.toggleFileTree();
    else if (root === "term" || root === "terminal") Clawri.VFS.openTerminal();
    else if (root === "settings" || root === "set") Clawri.UI.openSettingsModal();
    else if (root === "properties" || root === "props") Clawri.UI.openPropertiesModal();
    else if (root === "help" || root === "h") Clawri.UI.openHelpModal();
    else if (root === "full" || root === "zen") Clawri.UI.toggleZenFullscreen();
    else if (root === "new") Clawri.State.createNewProject();
    else if (root === "sample") Clawri.State.loadSampleArticle();
    else if (root === "w" || root === "save") { Clawri.State.save(); Clawri.UI.setStatus("Project saved"); }
    else if (root === "export" || root === "e") handleExportArg(arg);
    else Clawri.UI.setStatus(`Unknown command :${clean} (Try :home, :files, :term, :settings, :export zip)`);
  }

  return {
    cm: null,
    init,
    focus,
    updateModeBadge,
    acceptAutocomplete,
    openCommandBar,
    closeCommandBar,
    updateCmdlineSuggestions,
    executeCommand,
    getCmdSugMatches: () => cmdSugMatches,
    getCmdSugIdx: () => cmdSugIdx,
    setCmdSugIdx: (v) => { cmdSugIdx = v; }
  };
})();
