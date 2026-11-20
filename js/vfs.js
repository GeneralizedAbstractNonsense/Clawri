
/* ============================================================================
   MODULE 8: Clawri.VFS (Hierarchical File Tree, Drag & Drop & Virtual Terminal)
   ============================================================================ */
Clawri.VFS = (function() {
  const { escapeHtml } = Clawri.Utils;
  let selectedPath = "main.clawri";
  let draggedSourcePath = null;
  const collapsedFolders = new Set();
  let editingModalPath = null;

  let termCwd = "/";
  let termHistory = [];
  let termHistIdx = -1;

  function toggleFileTree() {
    const pane = document.getElementById("file-tree-pane");
    const isOpen = pane.classList.toggle("open");
    if (isOpen) {
      renderFileTree();
      pane.focus();
      Clawri.UI.setStatus("File Explorer opened — [Enter] Open/Insert · [a] New File · [A] New Folder · [r] Rename · [d] Del");
    } else {
      Clawri.Editor.focus();
    }
  }

  function buildHierarchicalEntries() {
    const proj = Clawri.State.getActiveProject();
    const entries = [
      { path: "main.clawri", name: "main.clawri", kind: "main", depth: 0 }
    ];

    const folders = [...new Set(proj.vfs.folders || [])].sort();
    const filePaths = Object.keys(proj.vfs.files || {}).sort();

    // Build folder map
    const folderSet = new Set(folders);
    // Ensure parent folders exist for nested paths
    for (const fp of filePaths) {
      const parts = fp.split("/");
      for (let k = 1; k < parts.length; k++) {
        folderSet.add(parts.slice(0, k).join("/"));
      }
    }
    const allFolders = [...folderSet].sort();

    function addChildrenOf(parentPrefix, depth) {
      // 1. Direct child folders
      const childFolders = allFolders.filter(f => {
        if (!parentPrefix) return !f.includes("/");
        return f.startsWith(parentPrefix + "/") && !f.slice(parentPrefix.length + 1).includes("/");
      });

      for (const folder of childFolders) {
        const name = folder.split("/").pop();
        const isCollapsed = collapsedFolders.has(folder);
        entries.push({ path: folder, name, kind: "folder", depth, collapsed: isCollapsed });
        if (!isCollapsed) {
          addChildrenOf(folder, depth + 1);
        }
      }

      // 2. Direct child files
      const childFiles = filePaths.filter(fp => {
        if (!parentPrefix) return !fp.includes("/");
        return fp.startsWith(parentPrefix + "/") && !fp.slice(parentPrefix.length + 1).includes("/");
      });

      for (const fp of childFiles) {
        const name = fp.split("/").pop();
        const fileObj = proj.vfs.files[fp];
        entries.push({ path: fp, name, kind: fileObj.type || "file", depth });
      }
    }

    addChildrenOf("", 0);
    return entries;
  }

  function renderFileTree() {
    const listEl = document.getElementById("file-tree-list");
    if (!listEl) return;
    const entries = buildHierarchicalEntries();
    if (!entries.some(e => e.path === selectedPath)) selectedPath = "main.clawri";

    listEl.innerHTML = entries.map(ent => {
      const isSel = ent.path === selectedPath;
      const indentPx = 10 + ent.depth * 14;
      let icon = "📄";
      if (ent.kind === "main") icon = "⚡";
      else if (ent.kind === "folder") icon = ent.collapsed ? "▸ 📁" : "▾ 📂";
      else if (ent.kind === "image") icon = "🖼";
      else if (ent.path.endsWith(".bib")) icon = "📚";
      else if (ent.path.endsWith(".tex") || ent.path.endsWith(".clawri")) icon = "📝";

      const isDraggable = ent.kind !== "main";
      const safePathAttr = escapeHtml(ent.path).replace(/'/g, "\\'");

      const controlsHtml = ent.kind === "main" ? "" : `
        <div class="tree-item-controls" onclick="event.stopPropagation()">
          ${ent.kind === "folder" ? `<button class="tree-mini-act" title="New file inside" onclick="Clawri.VFS.createFilePrompt('${safePathAttr}')">+</button>` : ""}
          <button class="tree-mini-act" title="Rename" onclick="Clawri.VFS.renameItem('${safePathAttr}')">✎</button>
          <button class="tree-mini-act del" title="Delete" onclick="Clawri.VFS.deleteItem('${safePathAttr}')">✕</button>
        </div>
      `;

      return `<div class="tree-item ${isSel ? 'selected' : ''}"
        style="padding-left:${indentPx}px;"
        data-path="${escapeHtml(ent.path)}"
        data-kind="${ent.kind}"
        draggable="${isDraggable}"
        ondragstart="Clawri.VFS.onDragStart(event, '${safePathAttr}')"
        ondragover="Clawri.VFS.onDragOver(event, '${safePathAttr}', '${ent.kind}')"
        ondragleave="Clawri.VFS.onDragLeave(event)"
        ondrop="Clawri.VFS.onDrop(event, '${safePathAttr}', '${ent.kind}')"
        onclick="Clawri.VFS.handleItemClick('${safePathAttr}', '${ent.kind}')"
        ondblclick="Clawri.VFS.activateItem('${safePathAttr}')">
        <div class="tree-item-left">
          <span>${icon}</span>
          <span>${escapeHtml(ent.name)}</span>
        </div>
        ${controlsHtml}
      </div>`;
    }).join("");
  }

  function handleItemClick(path, kind) {
    selectedPath = path;
    if (kind === "folder") {
      if (collapsedFolders.has(path)) collapsedFolders.delete(path);
      else collapsedFolders.add(path);
    }
    renderFileTree();
    document.getElementById("file-tree-pane").focus();
  }

  function activateItem(path) {
    const proj = Clawri.State.getActiveProject();
    if (path === "main.clawri") {
      Clawri.Editor.focus();
      return;
    }
    if ((proj.vfs.folders || []).includes(path)) {
      if (collapsedFolders.has(path)) collapsedFolders.delete(path);
      else collapsedFolders.add(path);
      renderFileTree();
      return;
    }
    const f = proj.vfs.files[path];
    if (!f) return;

    if (f.type === "image") {
      Clawri.Editor.cm.replaceSelection(`\n\\image[caption=Caption, width=80%, align=center]{${path}}\n`);
      Clawri.Editor.focus();
      Clawri.UI.setStatus(`Inserted \\image{${path}}`);
    } else {
      // Open multiline modal editor for .bib, .tex, .txt, etc.
      editingModalPath = path;
      document.getElementById("vfs-editor-title").textContent = `EDIT FILE — ${path}`;
      document.getElementById("vfs-editor-path-label").textContent = path;
      document.getElementById("vfs-editor-textarea").value = f.content || "";
      document.getElementById("vfs-editor-modal").classList.add("open");
      setTimeout(() => document.getElementById("vfs-editor-textarea").focus(), 40);
    }
  }

  function saveModalFile() {
    if (!editingModalPath) return;
    const proj = Clawri.State.getActiveProject();
    if (proj.vfs.files[editingModalPath]) {
      proj.vfs.files[editingModalPath].content = document.getElementById("vfs-editor-textarea").value;
      Clawri.State.save();
      Clawri.Preview.refresh(true);
      Clawri.UI.setStatus(`Saved ${editingModalPath}`);
    }
    editingModalPath = null;
    Clawri.UI.closeModals();
  }

  function movePath(srcPath, destFolder) {
    if (!srcPath || srcPath === "main.clawri") return;
    const proj = Clawri.State.getActiveProject();
    const baseName = srcPath.split("/").pop();
    const cleanDest = (destFolder || "").replace(/^\/+|\/+$/g, "");
    const newPath = cleanDest ? `${cleanDest}/${baseName}` : baseName;
    if (srcPath === newPath) return;

    if (proj.vfs.files[srcPath]) {
      proj.vfs.files[newPath] = proj.vfs.files[srcPath];
      delete proj.vfs.files[srcPath];
      proj.source = proj.source.split(srcPath).join(newPath);
      Clawri.Editor.cm.setValue(proj.source);
    } else if ((proj.vfs.folders || []).includes(srcPath)) {
      if (newPath.startsWith(srcPath + "/")) return;
      proj.vfs.folders = proj.vfs.folders.map(f => f === srcPath ? newPath : (f.startsWith(srcPath + "/") ? newPath + f.slice(srcPath.length) : f));
      const updatedFiles = {};
      for (const [k, v] of Object.entries(proj.vfs.files)) {
        if (k.startsWith(srcPath + "/")) updatedFiles[newPath + k.slice(srcPath.length)] = v;
        else updatedFiles[k] = v;
      }
      proj.vfs.files = updatedFiles;
    }

    selectedPath = newPath;
    Clawri.State.save();
    renderFileTree();
    Clawri.Preview.refresh(true);
    Clawri.UI.setStatus(`Moved "${srcPath}" -> "${newPath}"`);
  }

  function onDragStart(e, path) {
    draggedSourcePath = path;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/clawri-vfs-path", path);
  }

  function onDragOver(e, targetPath, kind) {
    e.preventDefault();
    e.stopPropagation();
    if (kind === "folder") e.currentTarget.classList.add("drag-target");
  }

  function onDragLeave(e) {
    e.currentTarget.classList.remove("drag-target");
  }

  function onDrop(e, targetPath, kind) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("drag-target");

    const destFolder = kind === "folder" ? targetPath : (targetPath.includes("/") ? targetPath.split("/").slice(0, -1).join("/") : "");
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      ingestExternalFiles(e.dataTransfer.files, destFolder, false);
      return;
    }
    const vfsSrc = e.dataTransfer.getData("text/clawri-vfs-path") || draggedSourcePath;
    if (vfsSrc) {
      movePath(vfsSrc, destFolder);
      draggedSourcePath = null;
    }
  }

  function createFilePrompt(folderOverride = null) {
    const proj = Clawri.State.getActiveProject();
    let defaultPrefix = "";
    if (folderOverride) {
      defaultPrefix = folderOverride + "/";
    } else if ((proj.vfs.folders || []).includes(selectedPath)) {
      defaultPrefix = selectedPath + "/";
    } else if (selectedPath.includes("/")) {
      defaultPrefix = selectedPath.split("/").slice(0, -1).join("/") + "/";
    }

    const name = prompt("New file path (e.g. notes.tex or references.bib):", defaultPrefix + "notes.tex");
    if (!name || !name.trim()) return;
    const clean = name.trim().replace(/^\/+/, "");
    if (clean.includes("/")) {
      const folderPart = clean.split("/").slice(0, -1).join("/");
      if (!proj.vfs.folders.includes(folderPart)) proj.vfs.folders.push(folderPart);
    }
    proj.vfs.files[clean] = { type: "text", mime: "text/plain", content: "% New file\n" };
    selectedPath = clean;
    Clawri.State.save();
    renderFileTree();
    activateItem(clean);
  }

  function createFolderPrompt() {
    const proj = Clawri.State.getActiveProject();
    const name = prompt("New folder path (e.g. images or chapters):", "images");
    if (!name || !name.trim()) return;
    const clean = name.trim().replace(/^\/+|\/+$/g, "");
    if (!proj.vfs.folders.includes(clean)) proj.vfs.folders.push(clean);
    selectedPath = clean;
    Clawri.State.save();
    renderFileTree();
    Clawri.UI.setStatus(`Created folder "${clean}"`);
  }

  function renameItem(path) {
    if (!path || path === "main.clawri") { Clawri.UI.setStatus("Cannot rename main.clawri"); return; }
    const proj = Clawri.State.getActiveProject();
    const next = prompt(`Rename "${path}" to:`, path);
    if (!next || next.trim() === path) return;
    const clean = next.trim().replace(/^\/+|\/+$/g, "");

    if (proj.vfs.files[path]) {
      proj.vfs.files[clean] = proj.vfs.files[path];
      delete proj.vfs.files[path];
      proj.source = proj.source.split(path).join(clean);
      Clawri.Editor.cm.setValue(proj.source);
    } else if ((proj.vfs.folders || []).includes(path)) {
      proj.vfs.folders = proj.vfs.folders.map(f => f === path ? clean : (f.startsWith(path + "/") ? clean + f.slice(path.length) : f));
      const updated = {};
      for (const [k, v] of Object.entries(proj.vfs.files)) {
        if (k.startsWith(path + "/")) updated[clean + k.slice(path.length)] = v;
        else updated[k] = v;
      }
      proj.vfs.files = updated;
    }
    selectedPath = clean;
    Clawri.State.save();
    renderFileTree();
    Clawri.Preview.refresh(true);
    Clawri.UI.setStatus(`Renamed to "${clean}"`);
  }

  function deleteItem(path) {
    if (!path || path === "main.clawri") { Clawri.UI.setStatus("Cannot delete main.clawri"); return; }
    if (!confirm(`Delete "${path}" from project?`)) return;
    const proj = Clawri.State.getActiveProject();
    delete proj.vfs.files[path];
    proj.vfs.folders = (proj.vfs.folders || []).filter(f => f !== path && !f.startsWith(path + "/"));
    Object.keys(proj.vfs.files).forEach(k => {
      if (k.startsWith(path + "/")) delete proj.vfs.files[k];
    });
    selectedPath = "main.clawri";
    Clawri.State.save();
    renderFileTree();
    Clawri.Preview.refresh(true);
    Clawri.UI.setStatus(`Deleted "${path}"`);
  }

  function ingestExternalFiles(fileList, targetFolder = "assets", insertIntoEditor = true) {
    const proj = Clawri.State.getActiveProject();
    const folder = (targetFolder || "").replace(/^\/+|\/+$/g, "");
    if (folder && !proj.vfs.folders.includes(folder)) proj.vfs.folders.push(folder);

    Array.from(fileList).forEach(file => {
      const destPath = folder ? `${folder}/${file.name}` : file.name;
      const isImage = file.type.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg|ico)$/i.test(file.name);
      const reader = new FileReader();

      if (isImage) {
        reader.onload = (ev) => {
          proj.vfs.files[destPath] = { type: "image", mime: file.type || "image/png", content: ev.target.result };
          Clawri.State.save();
          renderFileTree();
          if (insertIntoEditor) {
            Clawri.Editor.cm.replaceSelection(`\n\\image[caption=${file.name.replace(/\.[^.]+$/, '')}, width=80%, align=center]{${destPath}}\n`);
            Clawri.Editor.focus();
          }
          Clawri.Preview.refresh(true);
          Clawri.UI.setStatus(`Added image "${destPath}"`);
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = (ev) => {
          const textContent = ev.target.result;
          if (file.name.endsWith(".clawri") || file.name.endsWith(".tex")) {
            if (insertIntoEditor) Clawri.Editor.cm.replaceSelection("\n" + textContent + "\n");
            else proj.vfs.files[destPath] = { type: "text", mime: "text/plain", content: textContent };
          } else {
            proj.vfs.files[destPath] = { type: "text", mime: file.type || "text/plain", content: textContent };
          }
          Clawri.State.save();
          renderFileTree();
          Clawri.Preview.refresh(true);
          Clawri.UI.setStatus(`Imported "${destPath}"`);
        };
        reader.readAsText(file);
      }
    });
  }

  function triggerAssetUpload() {
    const input = document.getElementById("hidden-file-input");
    input.accept = "*/*";
    input.multiple = true;
    input.onchange = (e) => {
      if (e.target.files.length > 0) ingestExternalFiles(e.target.files, "assets", false);
      input.value = "";
      input.multiple = false;
    };
    input.click();
  }

  function triggerFaviconUpload() {
    const input = document.getElementById("hidden-file-input");
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const proj = Clawri.State.getActiveProject();
        const dest = `assets/${file.name}`;
        proj.vfs.files[dest] = { type: "image", mime: file.type || "image/png", content: ev.target.result };
        document.getElementById("meta-favicon").value = dest;
        Clawri.State.save();
        renderFileTree();
        Clawri.UI.setStatus(`Uploaded favicon to ${dest}`);
      };
      reader.readAsDataURL(file);
      input.value = "";
    };
    input.click();
  }

  function setupDragAndDrop() {
    const editorMount = document.getElementById("editor-mount");
    const treeList = document.getElementById("file-tree-list");

    editorMount.addEventListener("dragover", (e) => { e.preventDefault(); editorMount.classList.add("drag-drop-active"); });
    editorMount.addEventListener("dragleave", () => editorMount.classList.remove("drag-drop-active"));
    editorMount.addEventListener("drop", (e) => {
      e.preventDefault();
      editorMount.classList.remove("drag-drop-active");
      const vfsPath = e.dataTransfer.getData("text/clawri-vfs-path");
      if (vfsPath) {
        const proj = Clawri.State.getActiveProject();
        if (proj.vfs.files[vfsPath] && proj.vfs.files[vfsPath].type === "image") {
          Clawri.Editor.cm.replaceSelection(`\n\\image[caption=Caption, width=80%, align=center]{${vfsPath}}\n`);
        }
        return;
      }
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        ingestExternalFiles(e.dataTransfer.files, "assets", true);
      }
    });

    treeList.addEventListener("dragover", (e) => { e.preventDefault(); treeList.classList.add("drag-over-root"); });
    treeList.addEventListener("dragleave", () => treeList.classList.remove("drag-over-root"));
    treeList.addEventListener("drop", (e) => {
      e.preventDefault();
      treeList.classList.remove("drag-over-root");
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        ingestExternalFiles(e.dataTransfer.files, "assets", false);
        return;
      }
      const vfsSrc = e.dataTransfer.getData("text/clawri-vfs-path") || draggedSourcePath;
      if (vfsSrc) {
        movePath(vfsSrc, "");
        draggedSourcePath = null;
      }
    });
  }

  // Virtual Terminal (:term)
  function openTerminal() {
    const overlay = document.getElementById("terminal-overlay");
    overlay.classList.add("open");
    const out = document.getElementById("terminal-output");
    if (!out.textContent.trim()) {
      termPrint("Clawri Virtual Shell v2.1 — Type 'help' for commands or 'exit' to close.\n");
    }
    updateTerminalPrompt();
    setTimeout(() => document.getElementById("terminal-input").focus(), 30);
  }

  function closeTerminal() {
    document.getElementById("terminal-overlay").classList.remove("open");
    Clawri.Editor.focus();
  }

  function updateTerminalPrompt() {
    document.getElementById("terminal-prompt").textContent = `clawri:${termCwd}$`;
  }

  function termPrint(txt) {
    const out = document.getElementById("terminal-output");
    out.textContent += txt + "\n";
    out.scrollTop = out.scrollHeight;
  }

  function resolveTermPath(target) {
    if (!target || target === ".") return termCwd;
    let raw = target.startsWith("/") ? target : (termCwd === "/" ? "/" + target : termCwd + "/" + target);
    const parts = raw.split("/").filter(Boolean);
    const stack = [];
    for (const p of parts) {
      if (p === "..") stack.pop();
      else if (p !== ".") stack.push(p);
    }
    return "/" + stack.join("/");
  }

  function executeTerminalCommand(rawLine) {
    const line = rawLine.trim();
    termPrint(`clawri:${termCwd}$ ${line}`);
    if (!line) return;
    termHistory.push(line);
    termHistIdx = termHistory.length;

    const args = line.match(/(?:[^\s"]+|"[^"]*")+/g).map(a => a.replace(/^"|"$/g, ""));
    const cmd = args[0];
    const proj = Clawri.State.getActiveProject();

    if (cmd === "help") {
      termPrint("Commands: pwd, ls [dir], cd <dir>, mkdir <dir>, touch <file>, mv <src> <dst>, cp <src> <dst>, rm <path>, cat <file>, open <file>, clear, exit");
    } else if (cmd === "exit" || cmd === "quit") {
      closeTerminal();
    } else if (cmd === "clear") {
      document.getElementById("terminal-output").textContent = "";
    } else if (cmd === "pwd") {
      termPrint(termCwd);
    } else if (cmd === "ls") {
      const targetDir = resolveTermPath(args[1] || ".");
      const prefix = targetDir === "/" ? "" : targetDir.slice(1) + "/";
      const items = new Set();
      if (targetDir === "/") items.add("main.clawri");
      (proj.vfs.folders || []).forEach(f => {
        if (f.startsWith(prefix)) {
          const rest = f.slice(prefix.length);
          if (rest) items.add(rest.split("/")[0] + "/");
        }
      });
      Object.keys(proj.vfs.files || {}).forEach(f => {
        if (f.startsWith(prefix)) {
          const rest = f.slice(prefix.length);
          if (rest) items.add(rest.includes("/") ? rest.split("/")[0] + "/" : rest);
        }
      });
      termPrint([...items].sort().join("   ") || "(empty)");
    } else if (cmd === "cd") {
      const dest = resolveTermPath(args[1] || "/");
      const clean = dest.slice(1);
      if (dest === "/" || (proj.vfs.folders || []).includes(clean)) {
        termCwd = dest;
        updateTerminalPrompt();
      } else {
        termPrint(`cd: ${args[1]}: No such directory`);
      }
    } else if (cmd === "mkdir") {
      if (!args[1]) { termPrint("usage: mkdir <dir>"); return; }
      const dest = resolveTermPath(args[1]).slice(1);
      if (!proj.vfs.folders.includes(dest)) proj.vfs.folders.push(dest);
      Clawri.State.save(); renderFileTree();
    } else if (cmd === "touch") {
      if (!args[1]) { termPrint("usage: touch <file>"); return; }
      const dest = resolveTermPath(args[1]).slice(1);
      if (dest !== "main.clawri" && !proj.vfs.files[dest]) {
        proj.vfs.files[dest] = { type: "text", mime: "text/plain", content: "" };
      }
      Clawri.State.save(); renderFileTree();
    } else if (cmd === "mv") {
      if (!args[1] || !args[2]) { termPrint("usage: mv <src> <dst>"); return; }
      const src = resolveTermPath(args[1]).slice(1);
      const dstRaw = resolveTermPath(args[2]).slice(1);
      if (proj.vfs.files[src]) {
        const finalDst = (proj.vfs.folders || []).includes(dstRaw) ? `${dstRaw}/${src.split("/").pop()}` : dstRaw;
        proj.vfs.files[finalDst] = proj.vfs.files[src];
        delete proj.vfs.files[src];
        Clawri.State.save(); renderFileTree();
      } else {
        termPrint(`mv: cannot stat '${args[1]}'`);
      }
    } else if (cmd === "rm") {
      if (!args[1]) { termPrint("usage: rm <path>"); return; }
      const target = resolveTermPath(args[1]).slice(1);
      delete proj.vfs.files[target];
      proj.vfs.folders = (proj.vfs.folders || []).filter(f => f !== target && !f.startsWith(target + "/"));
      Clawri.State.save(); renderFileTree();
    } else if (cmd === "cat") {
      if (!args[1]) { termPrint("usage: cat <file>"); return; }
      const target = resolveTermPath(args[1]).slice(1);
      if (target === "main.clawri") termPrint(proj.source);
      else if (proj.vfs.files[target]) termPrint(proj.vfs.files[target].type === "image" ? `[Binary Image: ${target}]` : proj.vfs.files[target].content);
      else termPrint(`cat: ${args[1]}: No such file`);
    } else if (cmd === "open") {
      const target = resolveTermPath(args[1] || "main.clawri").slice(1);
      closeTerminal();
      activateItem(target || "main.clawri");
    } else {
      termPrint(`clawri-sh: command not found: ${cmd}`);
    }
  }

  function handleTreeKeydown(e) {
    const entries = buildHierarchicalEntries();
    let idx = entries.findIndex(x => x.path === selectedPath);
    if (e.key === "j" || e.key === "ArrowDown") {
      e.preventDefault();
      selectedPath = entries[Math.min(entries.length - 1, idx + 1)].path;
      renderFileTree();
    } else if (e.key === "k" || e.key === "ArrowUp") {
      e.preventDefault();
      selectedPath = entries[Math.max(0, idx - 1)].path;
      renderFileTree();
    } else if (e.key === "Enter") {
      e.preventDefault();
      activateItem(selectedPath);
    } else if (e.key === "a") {
      e.preventDefault();
      createFilePrompt();
    } else if (e.key === "A") {
      e.preventDefault();
      createFolderPrompt();
    } else if (e.key === "r") {
      e.preventDefault();
      renameItem(selectedPath);
    } else if (e.key === "d" || e.key === "Delete") {
      e.preventDefault();
      deleteItem(selectedPath);
    }
  }

  return {
    toggleFileTree,
    renderFileTree,
    handleItemClick,
    activateItem,
    saveModalFile,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    createFilePrompt,
    createFolderPrompt,
    renameItem,
    deleteItem,
    triggerAssetUpload,
    triggerFaviconUpload,
    setupDragAndDrop,
    openTerminal,
    closeTerminal,
    executeTerminalCommand,
    handleTreeKeydown,
    getTermHistory: () => termHistory,
    getTermHistIdx: () => termHistIdx,
    setTermHistIdx: (v) => { termHistIdx = v; }
  };
})();
