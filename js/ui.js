
/* ============================================================================
   MODULE 10: Clawri.UI (Modals, Custom Inline Command Editor, Home & Help)
   ============================================================================ */
Clawri.UI = (function() {
  const { escapeHtml } = Clawri.Utils;
  let homeActiveTab = "active";
  let homeSelectedIdx = 0;

  function setStatus(msg) {
    document.getElementById("status-msg").textContent = msg;
  }

  function updateProjectHeaderUI() {
    const proj = Clawri.State.getActiveProject();
    const tObj = [...Clawri.Config.BUILTIN_THEMES, ...Clawri.Config.getRepoThemes()].find(t => t.key === Clawri.State.data.activeTheme);
    document.getElementById("status-project-name").textContent = proj.meta.title || "main";
    document.getElementById("status-theme").textContent = tObj ? tObj.name : Clawri.State.data.activeTheme;
    document.getElementById("editor-pane-title").textContent = `${Clawri.Utils.slugify(proj.meta.title)}.clawri — [${proj.meta.tag || "ClawriTeX"}]`;
  }

  function closeModals() {
    document.querySelectorAll(".modal-backdrop").forEach(m => m.classList.remove("open"));
    Clawri.Editor.updateModeBadge("NORMAL");
    Clawri.Editor.focus();
  }

  // Home Dashboard (:home)
  function openHomeModal() {
    document.getElementById("home-overlay").classList.add("open");
    homeSelectedIdx = 0;
    renderHomeList();
  }

  function closeHomeModal() {
    document.getElementById("home-overlay").classList.remove("open");
    Clawri.Editor.focus();
  }

  function switchHomeTab(tab) {
    homeActiveTab = tab;
    homeSelectedIdx = 0;
    document.getElementById("home-tab-active").classList.toggle("active", tab === "active");
    document.getElementById("home-tab-trash").classList.toggle("active", tab === "trash");
    document.getElementById("home-empty-trash-btn").style.display = tab === "trash" ? "inline-flex" : "none";
    renderHomeList();
  }

  function renderHomeList() {
    const projects = Clawri.State.data.projects;
    const activeProjects = projects.filter(p => !p.trashed);
    const trashedProjects = projects.filter(p => p.trashed);
    document.getElementById("home-count-active").textContent = activeProjects.length;
    document.getElementById("home-count-trash").textContent = trashedProjects.length;

    const list = homeActiveTab === "active" ? activeProjects : trashedProjects;
    const container = document.getElementById("home-project-list");

    if (list.length === 0) {
      container.innerHTML = `<div style="padding:28px;text-align:center;color:var(--fg-muted);">${homeActiveTab === "active" ? "No active projects. Press [n] to create one." : "Trash is empty."}</div>`;
      return;
    }

    if (homeSelectedIdx >= list.length) homeSelectedIdx = list.length - 1;
    if (homeSelectedIdx < 0) homeSelectedIdx = 0;

    container.innerHTML = list.map((p, idx) => {
      const isCur = p.id === Clawri.State.data.activeProjectId && !p.trashed;
      const isSel = idx === homeSelectedIdx;
      const dateStr = (p.updatedAt || "").slice(0, 16).replace("T", " ");
      const actionsHtml = homeActiveTab === "active"
        ? `<button class="lazy-btn accent" onclick="event.stopPropagation(); Clawri.State.openProjectById('${p.id}')">Open</button>
           <button class="lazy-btn" onclick="event.stopPropagation(); Clawri.Exporters.exportBlogZipForProject('${p.id}')">.zip</button>
           <button class="lazy-btn danger" onclick="event.stopPropagation(); Clawri.State.moveProjectToTrash('${p.id}')">Trash</button>`
        : `<button class="lazy-btn accent" onclick="event.stopPropagation(); Clawri.State.restoreProjectFromTrash('${p.id}')">Restore</button>
           <button class="lazy-btn danger" onclick="event.stopPropagation(); Clawri.State.deleteProjectPermanently('${p.id}')">Delete</button>`;

      return `<div class="home-project-row ${isSel ? 'selected' : ''}" onclick="Clawri.UI.setHomeSelected(${idx}); ${homeActiveTab === 'active' ? `Clawri.State.openProjectById('${p.id}')` : ''}">
        <div class="home-project-info">
          <div class="home-project-title">${isCur ? "● " : ""}${escapeHtml(p.meta.title || "Untitled")}</div>
          <div class="home-project-meta">Tag: ${escapeHtml(p.meta.tag || "NONE")} · Author: ${escapeHtml(p.meta.author || "—")} · Updated: ${dateStr}</div>
        </div>
        <div class="home-project-actions">${actionsHtml}</div>
      </div>`;
    }).join("");
  }

  function handleHomeKeydown(e) {
    const list = Clawri.State.data.projects.filter(p => homeActiveTab === "active" ? !p.trashed : p.trashed);
    if (e.key === "Tab") { e.preventDefault(); switchHomeTab(homeActiveTab === "active" ? "trash" : "active"); }
    else if (e.key === "1") { e.preventDefault(); switchHomeTab("active"); }
    else if (e.key === "2") { e.preventDefault(); switchHomeTab("trash"); }
    else if (e.key === "j" || e.key === "ArrowDown") { e.preventDefault(); if (list.length) { homeSelectedIdx = (homeSelectedIdx + 1) % list.length; renderHomeList(); } }
    else if (e.key === "k" || e.key === "ArrowUp") { e.preventDefault(); if (list.length) { homeSelectedIdx = (homeSelectedIdx - 1 + list.length) % list.length; renderHomeList(); } }
    else if (e.key === "Enter" && list[homeSelectedIdx] && homeActiveTab === "active") { e.preventDefault(); Clawri.State.openProjectById(list[homeSelectedIdx].id); }
    else if ((e.key === "Delete" || e.key === "Backspace") && list[homeSelectedIdx] && homeActiveTab === "active") { e.preventDefault(); Clawri.State.moveProjectToTrash(list[homeSelectedIdx].id); }
    else if (e.key === "r" && list[homeSelectedIdx] && homeActiveTab === "trash") { e.preventDefault(); Clawri.State.restoreProjectFromTrash(list[homeSelectedIdx].id); }
    else if (e.key === "n" && homeActiveTab === "active") { e.preventDefault(); Clawri.State.createNewProject(); }
    else if (e.key === "i") { e.preventDefault(); Clawri.Exporters.importProjectFile(); }
    else if (e.key === "E" && e.shiftKey && homeActiveTab === "trash") { e.preventDefault(); Clawri.State.emptyTrash(); }
  }

  // Properties Modal (:properties)
  function openPropertiesModal() {
    const m = Clawri.State.getActiveProject().meta;
    document.getElementById("meta-title").value = m.title || "";
    document.getElementById("meta-subtitle").value = m.subtitle || "";
    document.getElementById("meta-author").value = m.author || "";
    document.getElementById("meta-date").value = m.date || "";
    document.getElementById("meta-tag").value = m.tag || "";
    document.getElementById("meta-backlink").value = m.backlink || "/blog.html";
    document.getElementById("meta-favicon").value = m.favicon || "media/icon.png";
    document.getElementById("meta-footnote-mode").value = m.footnoteMode || "margin";
    document.getElementById("meta-license-type").value = m.licenseType || "CC BY-NC-ND 4.0";
    document.getElementById("meta-pdf-size").value = m.pdfSize || "A4";
    document.getElementById("meta-desc").value = m.desc || "";
    document.getElementById("meta-footer").value = m.footer || "";
    document.getElementById("meta-lang").value = m.lang || "en";
    document.getElementById("properties-modal").classList.add("open");
    Clawri.Editor.updateModeBadge("PROPERTIES");
  }

  function saveProperties() {
    const m = Clawri.State.getActiveProject().meta;
    m.title = document.getElementById("meta-title").value.trim() || "Untitled";
    m.subtitle = document.getElementById("meta-subtitle").value.trim();
    m.author = document.getElementById("meta-author").value.trim();
    m.date = document.getElementById("meta-date").value.trim();
    m.tag = document.getElementById("meta-tag").value.trim();
    m.backlink = document.getElementById("meta-backlink").value.trim();
    m.favicon = document.getElementById("meta-favicon").value.trim() || "media/icon.png";
    m.footnoteMode = document.getElementById("meta-footnote-mode").value;
    m.licenseType = document.getElementById("meta-license-type").value;
    m.pdfSize = document.getElementById("meta-pdf-size").value;
    m.desc = document.getElementById("meta-desc").value.trim();
    m.footer = document.getElementById("meta-footer").value.trim();
    m.lang = document.getElementById("meta-lang").value;
    Clawri.State.save();
    updateProjectHeaderUI();
    closeModals();
    Clawri.Preview.refresh(true);
    setStatus("Document properties updated");
  }

  // Settings Modal (:settings)
  function openSettingsModal() {
    const state = Clawri.State.data;
    renderThemeCardsGrid();
    document.getElementById("settings-css-editor").value = state.cssByTheme[state.activeTheme] || "";
    document.getElementById("font-body-select").value = state.fonts.body;
    document.getElementById("font-heading-select").value = state.fonts.heading;
    document.getElementById("font-code-select").value = state.fonts.code;
    document.getElementById("font-size-select").value = state.fonts.size;
    document.getElementById("font-google-extra").value = state.fonts.googleExtra || "";
    document.getElementById("settings-latex-macros").value = state.latexMacros || Clawri.Config.DEFAULT_LATEX_MACROS;
    document.getElementById("settings-js-editor").value = state.customJS || "";
    document.getElementById("rss-site-url").value = state.rss.siteUrl || "https://example.com";
    document.getElementById("rss-feed-title").value = state.rss.feedTitle || "Clawri Blog Feed";
    document.getElementById("rss-feed-desc").value = state.rss.feedDesc || "";
    renderLabelsForm();
    renderCustomBoxesForm();
    renderCustomCommandsForm();
    document.getElementById("settings-modal").classList.add("open");
    Clawri.Editor.updateModeBadge("SETTINGS");
  }

  function switchSettingsTab(tabName) {
    document.querySelectorAll(".modal-tab[data-tab]").forEach(btn => btn.classList.toggle("active", btn.dataset.tab === tabName));
    document.querySelectorAll(".settings-panel").forEach(p => p.style.display = "none");
    document.getElementById("tab-" + tabName).style.display = "flex";
  }

  function renderThemeCardsGrid() {
    const allThemes = [...Clawri.Config.BUILTIN_THEMES, ...Clawri.Config.getRepoThemes()];
    const grid = document.getElementById("theme-cards-grid");
    grid.innerHTML = allThemes.map(t => {
      const isSelected = Clawri.State.data.activeTheme === t.key;
      const thumbHtml = t.thumb.startsWith("<svg") ? t.thumb : `<img src="${escapeHtml(t.thumb)}" alt="${escapeHtml(t.name)}" />`;
      return `<div class="theme-card ${isSelected ? 'selected' : ''}" onclick="Clawri.UI.selectTheme('${t.key}')">
        <div class="theme-preview-thumb">${thumbHtml}</div>
        <div>
          <span class="theme-card-badge">${escapeHtml(t.kind)}</span>
          <h4>${escapeHtml(t.name)}</h4>
          <p>${escapeHtml(t.desc)}</p>
        </div>
      </div>`;
    }).join("");
  }

  function selectTheme(key) {
    const state = Clawri.State.data;
    state.cssByTheme[state.activeTheme] = document.getElementById("settings-css-editor").value;
    state.activeTheme = key;
    document.getElementById("settings-css-editor").value = state.cssByTheme[key] || "";
    renderThemeCardsGrid();
    updateProjectHeaderUI();
    Clawri.State.save();
    Clawri.Preview.refresh(true);
  }

  function resetThemeCSS() {
    const state = Clawri.State.data;
    const found = [...Clawri.Config.BUILTIN_THEMES, ...Clawri.Config.getRepoThemes()].find(t => t.key === state.activeTheme);
    if (found) {
      state.cssByTheme[state.activeTheme] = found.css;
      document.getElementById("settings-css-editor").value = found.css;
      Clawri.State.save();
      Clawri.Preview.refresh(true);
      setStatus(`Restored default CSS for ${found.name}`);
    }
  }

  function renderLabelsForm() {
    const labelFields = [
      ["backIndex", "Top Back Link"], ["footerIndex", "Footer Index Link"],
      ["dateLabel", "Date Prefix"], ["authorLabel", "Author Prefix"],
      ["abstractLabel", "Abstract Box Title"], ["footnotesTitle", "Footnotes Section Title"],
      ["notePrefix", "Mobile Overlay Note Prefix"], ["closeBtn", "Mobile Close Button"],
      ["licenseTitle", "License Box Title"], ["pdfDownloadLabel", "PDF Download Button Label"],
      ["theoremLabel", "Theorem Label"], ["lemmaLabel", "Lemma Label"],
      ["propositionLabel", "Proposition Label"], ["corollaryLabel", "Corollary Label"],
      ["definitionLabel", "Definition Label"], ["remarkLabel", "Remark Label"],
      ["proofLabel", "Proof Label"], ["exerciseLabel", "Exercise Label"],
      ["solutionLabel", "Solution Label"], ["indexTitle", "Analytical Index Title"],
      ["bibliographyTitle", "Bibliography Title"]
    ];
    document.getElementById("labels-grid").innerHTML = labelFields.map(([k, title]) => `
      <div class="form-group">
        <label>${title}</label>
        <input type="text" class="lazy-input" id="lbl-${k}" value="${escapeHtml(Clawri.State.data.labels[k] || '')}" />
      </div>
    `).join("");
  }

  function applyLabelLanguagePreset(lang) {
    if (!Clawri.Config.LABEL_PRESETS[lang]) return;
    Clawri.State.data.labels = JSON.parse(JSON.stringify(Clawri.Config.LABEL_PRESETS[lang]));
    renderLabelsForm();
    setStatus(`Applied ${lang.toUpperCase()} template labels`);
  }

  function resetDefaultLatexMacros() {
    Clawri.State.data.latexMacros = Clawri.Config.DEFAULT_LATEX_MACROS;
    document.getElementById("settings-latex-macros").value = Clawri.Config.DEFAULT_LATEX_MACROS;
    setStatus("Restored built-in LaTeX macros");
  }

  function renderCustomBoxesForm() {
    document.getElementById("custom-box-list").innerHTML = (Clawri.State.data.customBoxes || []).map((b, idx) => `
      <div class="custom-box-row">
        <input type="text" class="lazy-input" value="${escapeHtml(b.name)}" placeholder="style" onchange="Clawri.State.data.customBoxes[${idx}].name = this.value.trim().toLowerCase()" />
        <input type="color" class="lazy-input" style="height:32px;padding:2px;" value="${escapeHtml(b.border)}" onchange="Clawri.State.data.customBoxes[${idx}].border = this.value" />
        <input type="color" class="lazy-input" style="height:32px;padding:2px;" value="${escapeHtml(b.bg)}" onchange="Clawri.State.data.customBoxes[${idx}].bg = this.value" />
        <select class="lazy-select" onchange="Clawri.State.data.customBoxes[${idx}].iconType = this.value">
          <option value="text" ${b.iconType !== 'image' ? 'selected' : ''}>Emoji / Text</option>
          <option value="image" ${b.iconType === 'image' ? 'selected' : ''}>Image Path/URL</option>
        </select>
        <input type="text" class="lazy-input" value="${escapeHtml(b.icon)}" placeholder="Icon or assets/icon.png" onchange="Clawri.State.data.customBoxes[${idx}].icon = this.value" />
        <button class="lazy-btn danger" onclick="Clawri.State.data.customBoxes.splice(${idx}, 1); Clawri.UI.renderCustomBoxesForm()">X</button>
      </div>
    `).join("");
  }

  function addCustomBoxRow() {
    Clawri.State.data.customBoxes.push({ name: "custombox", border: "#7aa2f7", bg: "#eff6ff", text: "#1e293b", icon: "★", iconType: "text" });
    renderCustomBoxesForm();
  }

  function renderCustomCommandsForm() {
    document.getElementById("custom-cmd-list").innerHTML = (Clawri.State.data.customCommands || []).map((c, idx) => `
      <div class="custom-cmd-row">
        <input type="text" class="lazy-input" value="${escapeHtml(c.name)}" placeholder="\\cmd" onchange="Clawri.State.data.customCommands[${idx}].name = this.value.trim()" />
        <input type="number" class="lazy-input" min="0" max="5" value="${c.args}" onchange="Clawri.State.data.customCommands[${idx}].args = Number(this.value)" />
        <input type="text" class="lazy-input" value="${escapeHtml(c.template)}" placeholder="<span style='...'>{{1}}</span>" onchange="Clawri.State.data.customCommands[${idx}].template = this.value" />
        <button class="lazy-btn danger" onclick="Clawri.State.data.customCommands.splice(${idx}, 1); Clawri.UI.renderCustomCommandsForm()">X</button>
      </div>
    `).join("");
  }

  function addCustomCommandRow() {
    Clawri.State.data.customCommands.push({
      name: "\\newcmd",
      args: 1,
      template: '<span style="background:rgba(122,162,247,0.14);padding:1px 7px;border-radius:4px;">{{1}}</span>'
    });
    renderCustomCommandsForm();
  }

  function applyAndCloseSettings() {
    const state = Clawri.State.data;
    state.cssByTheme[state.activeTheme] = document.getElementById("settings-css-editor").value;
    state.fonts.body = document.getElementById("font-body-select").value;
    state.fonts.heading = document.getElementById("font-heading-select").value;
    state.fonts.code = document.getElementById("font-code-select").value;
    state.fonts.size = document.getElementById("font-size-select").value;
    state.fonts.googleExtra = document.getElementById("font-google-extra").value.trim();
    state.latexMacros = document.getElementById("settings-latex-macros").value;
    state.customJS = document.getElementById("settings-js-editor").value;
    state.rss.siteUrl = document.getElementById("rss-site-url").value.trim();
    state.rss.feedTitle = document.getElementById("rss-feed-title").value.trim();
    state.rss.feedDesc = document.getElementById("rss-feed-desc").value.trim();
    Object.keys(state.labels).forEach(k => {
      const inp = document.getElementById("lbl-" + k);
      if (inp) state.labels[k] = inp.value;
    });
    Clawri.State.save();
    updateProjectHeaderUI();
    closeModals();
    Clawri.Preview.refresh(true);
    setStatus("Global settings applied");
  }

  function toggleZenFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setStatus("Zen Fullscreen enabled");
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  function setMobileLayout(mode) {
    const ws = document.getElementById("split-workspace");
    ws.classList.remove("mobile-editor-only", "mobile-preview-only");
    document.querySelectorAll("#mobile-bar button").forEach(b => b.classList.remove("active"));
    if (mode === "editor") { ws.classList.add("mobile-editor-only"); document.getElementById("mob-btn-editor").classList.add("active"); }
    else if (mode === "preview") { ws.classList.add("mobile-preview-only"); document.getElementById("mob-btn-preview").classList.add("active"); }
    else { document.getElementById("mob-btn-split").classList.add("active"); }
  }

  function openHelpModal() {
    document.getElementById("help-modal-body").innerHTML = `
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 14px;">
        <div style="background:var(--bg-dark); padding:12px; border:1px solid var(--border-inactive);">
          <strong style="color:var(--blue);">1. LazyVim Shortcuts</strong>
          <ul style="margin:6px 0 0 18px; color:var(--fg-main);">
            <li><code>:</code> — Command bar (<code>:home</code>, <code>:files</code>, <code>:term</code>, <code>:settings</code>)</li>
            <li><code>Space</code> — Leader key (<code>h</code>=home, <code>e</code>=files, <code>t</code>=term, <code>s</code>=settings, <code>z</code>=.zip)</li>
            <li><code>Cmd/Ctrl+D</code> — Download self-contained Blog <code>.zip</code></li>
            <li><code>Cmd/Ctrl+E</code> — Back to Normal Mode / Close Modal</li>
            <li><code>Double-click Preview</code> — Jump to matching line in Editor</li>
          </ul>
        </div>
        <div style="background:var(--bg-dark); padding:12px; border:1px solid var(--border-inactive);">
          <strong style="color:var(--green);">2. Lists & Borderless Inline Commands</strong>
          <ul style="margin:6px 0 0 18px; color:var(--fg-main);">
            <li><code>\\begin{itemize}[numbers]</code> — Numbered (1, 2, 3)</li>
            <li><code>\\begin{itemize}[roman]</code> — Lowercase Roman (i, ii, iii)</li>
            <li><code>\\begin{itemize}[Roman]</code> — Uppercase Roman (I, II, III)</li>
            <li><code>\\pill{Text}</code>, <code>\\tag{Label}</code>, <code>\\kbd{Cmd+D}</code>, <code>\\codeinline{x}</code></li>
            <li><code>\\highlight[#fef08a]{...}</code>, <code>\\underline[#2563eb]{...}</code>, <code>\\smallcaps{...}</code></li>
          </ul>
        </div>
        <div style="background:var(--bg-dark); padding:12px; border:1px solid var(--border-inactive); grid-column:1 / -1;">
          <strong style="color:var(--cyan);">3. Clipped 2D & 3D Plots with Custom Axes, Grid & Ticks</strong>
          <pre style="margin-top:6px; color:var(--fg-main); white-space:pre-wrap;">\\begin{plot}[2d][xmin=-4, xmax=4, ymin=-3, ymax=3, xlabel=$t$, ylabel=$y(t)$, grid=true, numbers=true, title=My Graph]
  \\area{sin(x)}[from=0, to=3.14, color=#3b82f6, opacity=0.2]
  \\func{tan(x)}[color=#dc2626, label=$\\tan(t)$]
  \\vector{(0,0) -> (2, 1.5)}[color=#16a34a, label=$\\vec{v}$]
  \\point{(2, 0)}[color=#9333ea, label=$P(2,0)$]
\\end{plot}</pre>
          <p style="margin-top:6px;color:var(--fg-muted);">Options: <code>xlabel</code>, <code>ylabel</code>, <code>zlabel</code>, <code>title</code>, <code>grid=true|false</code>, <code>numbers=true|false</code>, <code>xstep</code>, <code>ystep</code>, <code>axes=center|box|none</code>, <code>aspect=equal</code>.</p>
        </div>
      </div>
    `;
    document.getElementById("help-modal").classList.add("open");
  }

  return {
    setStatus,
    updateProjectHeaderUI,
    closeModals,
    openHomeModal,
    closeHomeModal,
    switchHomeTab,
    renderHomeList,
    setHomeSelected: (i) => { homeSelectedIdx = i; },
    handleHomeKeydown,
    openPropertiesModal,
    saveProperties,
    openSettingsModal,
    switchSettingsTab,
    renderThemeCardsGrid,
    selectTheme,
    resetThemeCSS,
    applyLabelLanguagePreset,
    resetDefaultLatexMacros,
    renderCustomBoxesForm,
    addCustomBoxRow,
    renderCustomCommandsForm,
    addCustomCommandRow,
    applyAndCloseSettings,
    toggleZenFullscreen,
    setMobileLayout,
    openHelpModal
  };
})();
