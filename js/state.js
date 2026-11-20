/* ============================================================================
   MODULE 4: Clawri.State (Multi-Project Persistence & Trash)
   ============================================================================ */
window.Clawri = window.Clawri || {};


Clawri.State = (function() {
  function createDefaultProject(id, title, source) {
    const now = new Date().toISOString();
    return {
      id: id || ("proj_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6)),
      updatedAt: now,
      trashed: false,
      meta: {
        title: title || "Template",
        subtitle: "A Complete Showcase of Clawri v2.1",
        author: "Author Name",
        date: new Date().toISOString().slice(0, 10).replace(/-/g, '/'),
        tag: "MATH & POETRY",
        backlink: "/blog.html",
        favicon: "media/icon.png",
        footnoteMode: "margin",
        licenseType: "CC BY-NC-ND 4.0",
        pdfSize: "A4",
        desc: "Article created with Clawri",
        footer: "2026 — THE END OF TIME",
        lang: "en"
      },
      source: source !== undefined ? source : Clawri.Config.DEFAULT_SAMPLE_SOURCE,
      vfs: {
        folders: ["assets"],
        files: {
          "references.bib": {
            type: "text",
            mime: "text/plain",
            content: "@book{lang02,\n  author = {Serge Lang},\n  title = {Algebra},\n  year = {2002},\n  publisher = {Springer}\n}\n"
          }
        }
      }
    };
  }

  const DEFAULT_GLOBAL_STATE = {
    activeProjectId: "proj_default",
    projects: [createDefaultProject("proj_default", "Template", Clawri.Config.DEFAULT_SAMPLE_SOURCE)],
    activeTheme: "clean",
    cssByTheme: {
      clean: Clawri.Config.THEME_CLEAN_CSS,
      retro: Clawri.Config.THEME_RETRO_CSS,
      pdf_paper: Clawri.Config.THEME_PDF_PAPER_CSS,
      pdf_dispense: Clawri.Config.THEME_PDF_DISPENSE_CSS,
      pdf_exam: Clawri.Config.THEME_PDF_EXAM_CSS,
      pdf_worksheet: Clawri.Config.THEME_PDF_WORKSHEET_CSS,
      custom: Clawri.Config.THEME_CLEAN_CSS
    },
    customJS: "// Additional custom JavaScript",
    fonts: {
      body: "Georgia, 'Times New Roman', serif",
      heading: "inherit",
      code: "'Fira Code', 'JetBrains Mono', monospace",
      size: "19px",
      googleExtra: ""
    },
    labels: JSON.parse(JSON.stringify(Clawri.Config.LABEL_PRESETS.en)),
    latexMacros: Clawri.Config.DEFAULT_LATEX_MACROS,
    customBoxes: [
      { name: "note", border: "#3b82f6", bg: "#eff6ff", text: "#1e3a8a", icon: "ℹ", iconType: "text" },
      { name: "info", border: "#0ea5e9", bg: "#f0f9ff", text: "#0c4a6e", icon: "✦", iconType: "text" },
      { name: "warning", border: "#f59e0b", bg: "#fffbeb", text: "#78350f", icon: "⚠", iconType: "text" },
      { name: "tip", border: "#10b981", bg: "#ecfdf5", text: "#064e3b", icon: "💡", iconType: "text" },
      { name: "important", border: "#ef4444", bg: "#fef2f2", text: "#7f1d1d", icon: "❗", iconType: "text" },
      { name: "curiosita", border: "#4b5563", bg: "#f9fafb", text: "#111827", icon: "💡", iconType: "text" },
      { name: "videobox", border: "#4b5563", bg: "#f9fafb", text: "#111827", icon: "🎥", iconType: "text" }
    ],
    customCommands: [
      { name: "\\badge", args: 1, template: '<span style="display:inline-block;padding:1px 8px;border-radius:4px;background:rgba(122,162,247,0.16);font-size:0.82em;font-weight:600;">{{1}}</span>' }
    ],
    rss: {
      siteUrl: "https://example.com",
      feedTitle: "Clawri Blog Feed",
      feedDesc: "Articles, mathematics, and poetry published with Clawri."
    }
  };

  function load() {
    try {
      const saved = localStorage.getItem("clawri_state_v3");
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged = {
          ...DEFAULT_GLOBAL_STATE,
          ...parsed,
          cssByTheme: { ...DEFAULT_GLOBAL_STATE.cssByTheme, ...(parsed.cssByTheme || {}) },
          fonts: { ...DEFAULT_GLOBAL_STATE.fonts, ...(parsed.fonts || {}) },
          labels: { ...DEFAULT_GLOBAL_STATE.labels, ...(parsed.labels || {}) },
          rss: { ...DEFAULT_GLOBAL_STATE.rss, ...(parsed.rss || {}) }
        };
        if (!Array.isArray(merged.projects) || merged.projects.length === 0) {
          merged.projects = [createDefaultProject("proj_default")];
          merged.activeProjectId = "proj_default";
        }
        return merged;
      }
    } catch (e) {
      console.warn("Error loading state:", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_GLOBAL_STATE));
  }

  const data = load();

  function get() {
    return data;
  }

  function save() {
    try {
      const proj = getActiveProject();
      if (proj) proj.updatedAt = new Date().toISOString();
      localStorage.setItem("clawri_state_v3", JSON.stringify(data));
    } catch (e) {
      console.warn("Save warning:", e);
    }
  }

  function getActiveProject() {
    let p = data.projects.find(x => x.id === data.activeProjectId && !x.trashed);
    if (!p) {
      p = data.projects.find(x => !x.trashed);
      if (!p) {
        p = createDefaultProject();
        data.projects.push(p);
      }
      data.activeProjectId = p.id;
    }
    if (!p.vfs) p.vfs = { folders: ["assets"], files: {} };
    if (!p.vfs.folders) p.vfs.folders = ["assets"];
    if (!p.vfs.files) p.vfs.files = {};
    return p;
  }

  function createNewProject() {
    const title = prompt("New Project Title:", "Untitled Article");
    if (title === null) return;
    const p = createDefaultProject(null, title.trim() || "Untitled Article", `\\title[ESSAY]{${title.trim() || "Untitled Article"}}\n\\author{Author Name}\n\\date{${new Date().toISOString().slice(0, 10).replace(/-/g, '/')}}\n\nStart writing here...\n`);
    data.projects.unshift(p);
    data.activeProjectId = p.id;
    save();
    Clawri.UI.closeHomeModal();
    if (Clawri.Editor.cm) Clawri.Editor.cm.setValue(p.source);
    Clawri.UI.updateProjectHeaderUI();
    Clawri.VFS.renderFileTree();
    Clawri.Preview.refresh(true);
    Clawri.UI.setStatus(`Created "${p.meta.title}"`);
  }

  function openProjectById(id) {
    const proj = data.projects.find(p => p.id === id && !p.trashed);
    if (!proj) return;
    data.activeProjectId = proj.id;
    save();
    Clawri.UI.closeHomeModal();
    if (Clawri.Editor.cm) Clawri.Editor.cm.setValue(proj.source);
    Clawri.UI.updateProjectHeaderUI();
    Clawri.VFS.renderFileTree();
    Clawri.Preview.refresh(true);
    Clawri.UI.setStatus(`Opened "${proj.meta.title}"`);
  }

  function moveProjectToTrash(id) {
    const proj = data.projects.find(p => p.id === id);
    if (!proj) return;
    proj.trashed = true;
    if (data.activeProjectId === id) {
      const next = data.projects.find(p => !p.trashed);
      if (next) {
        data.activeProjectId = next.id;
        if (Clawri.Editor.cm) Clawri.Editor.cm.setValue(next.source);
        Clawri.UI.updateProjectHeaderUI();
        Clawri.Preview.refresh(true);
      }
    }
    save();
    Clawri.UI.renderHomeList();
    Clawri.UI.setStatus(`Moved "${proj.meta.title}" to Trash`);
  }

  function restoreProjectFromTrash(id) {
    const proj = data.projects.find(p => p.id === id);
    if (!proj) return;
    proj.trashed = false;
    save();
    Clawri.UI.renderHomeList();
    Clawri.UI.setStatus(`Restored "${proj.meta.title}"`);
  }

  function deleteProjectPermanently(id) {
    data.projects = data.projects.filter(p => p.id !== id);
    save();
    Clawri.UI.renderHomeList();
  }

  function emptyTrash() {
    const count = data.projects.filter(p => p.trashed).length;
    if (count === 0) { Clawri.UI.setStatus("Trash is already empty"); return; }
    if (confirm(`Permanently delete ${count} project(s) in Trash?`)) {
      data.projects = data.projects.filter(p => !p.trashed);
      save();
      Clawri.UI.renderHomeList();
      Clawri.UI.setStatus("Trash emptied");
    }
  }

  function loadSampleArticle() {
    const proj = getActiveProject();
    proj.source = Clawri.Config.DEFAULT_SAMPLE_SOURCE;
    if (Clawri.Editor.cm) Clawri.Editor.cm.setValue(proj.source);
    save();
    Clawri.Preview.refresh(true);
  }

  function factoryReset() {
    if (confirm("Reset all projects, styles, and custom commands to factory defaults?")) {
      localStorage.removeItem("clawri_state_v3");
      Object.assign(data, JSON.parse(JSON.stringify(DEFAULT_GLOBAL_STATE)));
      save();
      const proj = getActiveProject();
      if (Clawri.Editor.cm) Clawri.Editor.cm.setValue(proj.source);
      Clawri.UI.openSettingsModal();
      Clawri.Preview.refresh(true);
    }
  }

  return {
    DEFAULT_GLOBAL_STATE,
    data,
    get,
    save,
    createDefaultProject,
    getActiveProject,
    createNewProject,
    openProjectById,
    moveProjectToTrash,
    restoreProjectFromTrash,
    deleteProjectPermanently,
    emptyTrash,
    loadSampleArticle,
    factoryReset
  };
})();
