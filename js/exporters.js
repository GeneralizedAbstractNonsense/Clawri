
/* ============================================================================
   MODULE 11: Clawri.Exporters (Blog .zip, HTML, PDF, .tex+PNG, .clawri, RSS)
   ============================================================================ */
Clawri.Exporters = (function() {
  const { escapeHtml, slugify } = Clawri.Utils;

  function downloadFile(filename, content, mimeType) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function dataURLtoUint8Array(dataUrl) {
    const parts = dataUrl.split(",");
    const base64 = parts[1] || "";
    const raw = atob(base64);
    const arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return arr;
  }

  function svgToPngBlob(svgEl) {
    return new Promise((resolve) => {
      try {
        const clone = svgEl.cloneNode(true);
        const vb = svgEl.viewBox.baseVal;
        const w = (vb && vb.width) ? vb.width : (svgEl.clientWidth || 500);
        const h = (vb && vb.height) ? vb.height : (svgEl.clientHeight || 300);
        clone.setAttribute("width", w * 2);
        clone.setAttribute("height", h * 2);
        const svgStr = new XMLSerializer().serializeToString(clone);
        const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = w * 2;
          canvas.height = h * 2;
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(url);
          canvas.toBlob(blob => resolve(blob), "image/png");
        };
        img.onerror = () => resolve(null);
        img.src = url;
      } catch {
        resolve(null);
      }
    });
  }

  function generateRSSXml() {
    const state = Clawri.State.data;
    const siteUrl = (state.rss.siteUrl || "https://example.com").replace(/\/+$/, "");
    const feedTitle = state.rss.feedTitle || "Clawri Blog Feed";
    const feedDesc = state.rss.feedDesc || "Articles published with Clawri";
    const activeProjects = state.projects.filter(p => !p.trashed);

    const itemsXml = activeProjects.map(p => {
      const slug = slugify(p.meta.title);
      const link = `${siteUrl}/${slug}/index.html`;
      const pubDate = new Date(p.updatedAt || Date.now()).toUTCString();
      return `    <item>
      <title>${escapeHtml(p.meta.title || "Untitled")}</title>
      <link>${escapeHtml(link)}</link>
      <guid>${escapeHtml(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeHtml(p.meta.desc || p.meta.subtitle || p.meta.title)}</description>
    </item>`;
    }).join("\n");

    return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>${escapeHtml(feedTitle)}</title>
    <link>${escapeHtml(siteUrl)}</link>
    <description>${escapeHtml(feedDesc)}</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${itemsXml}
  </channel>
</rss>`;
  }

  async function exportBlogZipForProject(projectId) {
    const prevId = Clawri.State.data.activeProjectId;
    Clawri.State.data.activeProjectId = projectId;
    await exportBlogZip();
    Clawri.State.data.activeProjectId = prevId;
  }

  async function exportBlogZip() {
    if (typeof JSZip === "undefined") { Clawri.UI.setStatus("JSZip library unavailable"); return; }
    const proj = Clawri.State.getActiveProject();
    const slug = slugify(proj.meta.title);
    const zip = new JSZip();
    const rootFolder = zip.folder(slug);
    const assetsFolder = rootFolder.folder("assets");
    const rewriteMap = {};

    for (const [path, fileObj] of Object.entries(proj.vfs.files || {})) {
      if (fileObj.type === "image" && fileObj.content.startsWith("data:")) {
        const cleanName = path.split("/").pop();
        assetsFolder.file(cleanName, dataURLtoUint8Array(fileObj.content));
        rewriteMap[path] = `assets/${cleanName}`;
      } else {
        rootFolder.file(path, fileObj.content || "");
      }
    }

    const html = Clawri.Compiler.buildFullDocumentHTML({ isExport: true, assetRewriteMap: rewriteMap });
    rootFolder.file("index.html", html);
    rootFolder.file("article.clawri", proj.source);
    rootFolder.file("rss.xml", generateRSSXml());

    const blob = await zip.generateAsync({ type: "blob" });
    downloadFile(`${slug}.zip`, blob, "application/zip");
    Clawri.UI.setStatus(`Downloaded ready-to-deploy ${slug}.zip`);
  }

  function exportHTML() {
    const proj = Clawri.State.getActiveProject();
    const html = Clawri.Compiler.buildFullDocumentHTML({ isExport: true });
    downloadFile(`${slugify(proj.meta.title)}.html`, html, "text/html;charset=utf-8");
    Clawri.UI.setStatus("Exported standalone HTML");
  }

  function exportPDF() {
    const iframe = document.getElementById("preview-frame");
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  }

  async function exportTeX() {
    const proj = Clawri.State.getActiveProject();
    const state = Clawri.State.data;
    const slug = slugify(proj.meta.title);
    const iframe = document.getElementById("preview-frame");
    const svgs = iframe && iframe.contentDocument ? Array.from(iframe.contentDocument.querySelectorAll("svg.clawri-exportable-svg")) : [];

    let figIdx = 0;
    let texBody = proj.source
      .replace(/\\title(?:\[[^\]]*\])?\{[^}]*\}/g, "")
      .replace(/\\subtitle\{[^}]*\}/g, "")
      .replace(/\\author(?:\[[^\]]*\])?\{[^}]*\}/g, "")
      .replace(/\\date(?:\[[^\]]*\])?\{[^}]*\}/g, "")
      .replace(/\\begin\{(draw|graph|tree|plot)\}[\s\S]*?\\end\{\1\}/g, () => {
        figIdx++;
        return `\\begin{figure}[htbp]\n  \\centering\n  \\includegraphics[width=0.82\\linewidth]{figures/figure_${figIdx}.png}\n\\end{figure}`;
      })
      .replace(/\\begin\{itemize\}\[(Roman|ROMAN|I)\]/g, "\\begin{enumerate}[I.]")
      .replace(/\\begin\{itemize\}\[(roman|i)\]/g, "\\begin{enumerate}[i.]")
      .replace(/\\begin\{itemize\}\[(numbers|1)\]/g, "\\begin{enumerate}[1.]")
      .replace(/\\begin\{itemize\}\[[^\]]*\]/g, "\\begin{itemize}");

    const texDoc = `\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{amsmath,amssymb,amsthm,graphicx,booktabs,xcolor,enumerate}

${state.latexMacros || ""}

\\title{${proj.meta.title || "Untitled"}}
\\author{${proj.meta.author || ""}}
\\date{${proj.meta.date || "\\today"}}

\\begin{document}
\\maketitle

${texBody.trim()}

\\end{document}
`;

    if (svgs.length > 0 && typeof JSZip !== "undefined") {
      const zip = new JSZip();
      zip.file(`${slug}.tex`, texDoc);
      const figFolder = zip.folder("figures");
      for (let i = 0; i < svgs.length; i++) {
        const pngBlob = await svgToPngBlob(svgs[i]);
        if (pngBlob) figFolder.file(`figure_${i + 1}.png`, pngBlob);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      downloadFile(`${slug}-latex.zip`, blob, "application/zip");
      Clawri.UI.setStatus(`Exported ${slug}-latex.zip with ${svgs.length} figure(s)`);
    } else {
      downloadFile(`${slug}.tex`, texDoc, "application/x-tex;charset=utf-8");
      Clawri.UI.setStatus(`Exported ${slug}.tex`);
    }
  }

  function exportClawriBundle() {
    const proj = Clawri.State.getActiveProject();
    const state = Clawri.State.data;
    const bundle = {
      clawriVersion: "2.1",
      exportedAt: new Date().toISOString(),
      project: proj,
      globalTheme: {
        activeTheme: state.activeTheme,
        css: state.cssByTheme[state.activeTheme],
        customJS: state.customJS,
        fonts: state.fonts,
        labels: state.labels,
        latexMacros: state.latexMacros,
        customBoxes: state.customBoxes,
        customCommands: state.customCommands
      }
    };
    downloadFile(`${slugify(proj.meta.title)}.clawri`, JSON.stringify(bundle, null, 2), "application/json");
    Clawri.UI.setStatus("Exported .clawri bundle");
  }

  function exportRSS() {
    downloadFile("rss.xml", generateRSSXml(), "application/rss+xml;charset=utf-8");
    Clawri.UI.setStatus("Downloaded rss.xml");
  }

  function previewRSSModal() {
    document.getElementById("help-modal-body").innerHTML = `<pre style="background:var(--bg-dark);padding:12px;border:1px solid var(--border-inactive);white-space:pre-wrap;color:var(--cyan);">${escapeHtml(generateRSSXml())}</pre>`;
    document.getElementById("help-modal").classList.add("open");
  }

  function exportConfigJSON() {
    const state = Clawri.State.data;
    downloadFile("clawri-theme-config.json", JSON.stringify({
      activeTheme: state.activeTheme,
      cssByTheme: state.cssByTheme,
      customJS: state.customJS,
      fonts: state.fonts,
      labels: state.labels,
      latexMacros: state.latexMacros,
      customBoxes: state.customBoxes,
      customCommands: state.customCommands,
      rss: state.rss
    }, null, 2), "application/json");
    Clawri.UI.setStatus("Exported clawri-theme-config.json");
  }

  function importProjectFile() {
    const input = document.getElementById("hidden-file-input");
    input.accept = ".clawri,.tex,.txt,.json";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const raw = ev.target.result;
          if (file.name.endsWith(".clawri") || raw.trim().startsWith("{")) {
            const parsed = JSON.parse(raw);
            if (parsed.project) {
              const newProj = parsed.project;
              newProj.id = "proj_" + Date.now();
              newProj.trashed = false;
              Clawri.State.data.projects.unshift(newProj);
              Clawri.State.data.activeProjectId = newProj.id;
              Clawri.State.save();
              Clawri.UI.closeHomeModal();
              Clawri.Editor.cm.setValue(newProj.source);
              Clawri.UI.updateProjectHeaderUI();
              Clawri.VFS.renderFileTree();
              Clawri.Preview.refresh(true);
              Clawri.UI.setStatus(`Imported "${newProj.meta.title}"`);
            }
          } else {
            const title = file.name.replace(/\.[^.]+$/, "");
            const newProj = Clawri.State.createDefaultProject(null, title, raw);
            Clawri.State.data.projects.unshift(newProj);
            Clawri.State.data.activeProjectId = newProj.id;
            Clawri.State.save();
            Clawri.UI.closeHomeModal();
            Clawri.Editor.cm.setValue(raw);
            Clawri.UI.updateProjectHeaderUI();
            Clawri.Preview.refresh(true);
            Clawri.UI.setStatus(`Imported "${file.name}"`);
          }
        } catch {
          Clawri.UI.setStatus("Failed to import project file");
        }
      };
      reader.readAsText(file);
      input.value = "";
    };
    input.click();
  }

  function triggerFileUpload(type) {
    const input = document.getElementById("hidden-file-input");
    input.accept = type === "css" ? ".css" : (type === "js" ? ".js" : ".json");
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target.result;
        const state = Clawri.State.data;
        if (type === "css") {
          state.activeTheme = "custom";
          state.cssByTheme.custom = content;
          document.getElementById("settings-css-editor").value = content;
          Clawri.UI.renderThemeCardsGrid();
        } else if (type === "js") {
          state.customJS = content;
          document.getElementById("settings-js-editor").value = content;
        } else if (type === "commands") {
          try {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed.customCommands)) state.customCommands = parsed.customCommands;
            if (Array.isArray(parsed.customBoxes)) state.customBoxes = parsed.customBoxes;
            Clawri.UI.renderCustomCommandsForm();
            Clawri.UI.renderCustomBoxesForm();
            Clawri.State.save();
            Clawri.Preview.refresh(true);
            Clawri.UI.setStatus("Imported commands.json");
          } catch { Clawri.UI.setStatus("Invalid commands.json"); }
        } else if (type === "json") {
          try {
            Object.assign(state, JSON.parse(content));
            Clawri.State.save();
            Clawri.UI.openSettingsModal();
            Clawri.Preview.refresh(true);
          } catch { Clawri.UI.setStatus("Invalid JSON config"); }
        }
      };
      reader.readAsText(file);
      input.value = "";
    };
    input.click();
  }

  return {
    downloadFile,
    exportBlogZip,
    exportBlogZipForProject,
    exportHTML,
    exportPDF,
    exportTeX,
    exportClawriBundle,
    exportRSS,
    previewRSSModal,
    exportConfigJSON,
    importProjectFile,
    triggerFileUpload
  };
})();
