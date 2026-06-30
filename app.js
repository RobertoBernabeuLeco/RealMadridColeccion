(function () {
  const STORAGE_KEY = "rm-camisetas-collection-v1";

  const KIT_TYPES = [
    { key: "home", label: "Local" },
    { key: "away", label: "Visitante" },
    { key: "third", label: "Tercera" },
  ];

  const BASE_COLLECTION = {
    "2024-25": {
      home: {
        owned: true,
        quantity: 1,
        details: "9 Mbappe, Champions League",
        missing: "",
        links: "",
      },
    },
    "2023-24": {
      home: {
        owned: true,
        quantity: 2,
        details: "5 Bellingham, Champions League. Otra local sin numero.",
        missing: "Completar la local sin numero con dorsal si quieres dejarla acabada.",
        links: "",
      },
    },
    "2022-23": {
      home: {
        owned: true,
        quantity: 1,
        details: "9 Benzema, version especial Balon de Oro",
        missing: "",
        links: "",
      },
    },
    "2021-22": {
      home: {
        owned: true,
        quantity: 1,
        details: "10 Modric, Champions League",
        missing: "",
        links: "",
      },
    },
    "2019-20": {
      home: {
        owned: true,
        quantity: 1,
        details: "Local sin numero",
        missing: "Poner parche de liga y dorsal.",
        links: "",
      },
    },
    "2017-18": {
      home: {
        owned: true,
        quantity: 1,
        details: "9 Benzema, Champions League",
        missing: "",
        links: "",
      },
    },
    "2015-16": {
      home: {
        owned: true,
        quantity: 1,
        details: "Local",
        missing: "Poner parche de liga y dorsal.",
        links: "",
      },
    },
    "2014-15": {
      home: {
        owned: true,
        quantity: 1,
        details: "Local",
        missing: "Poner dorsal.",
        links: "",
      },
      away: {
        owned: true,
        quantity: 1,
        details: "Visitante",
        missing: "Poner dorsal.",
        links: "",
      },
    },
    "2013-14": {
      home: {
        owned: true,
        quantity: 1,
        details: "11 Bale, Liga",
        missing: "",
        links: "",
      },
    },
    "2012-13": {
      home: {
        owned: true,
        quantity: 1,
        details: "Local",
        missing: "Falta dorsal.",
        links: "",
      },
      third: {
        owned: true,
        quantity: 1,
        details: "Tercera",
        missing: "Reparar publicidad y parche.",
        links: "",
      },
    },
    "2011-12": {
      home: {
        owned: true,
        quantity: 1,
        details: "10 Ozil, Liga",
        missing: "",
        links: "",
      },
    },
    "2010-11": {
      home: {
        owned: true,
        quantity: 1,
        details: "22 Di Maria, Champions League",
        missing: "",
        links: "",
      },
    },
    "2009-10": {
      home: {
        owned: true,
        quantity: 1,
        details: "9 Ronaldo, Liga",
        missing: "",
        links: "",
      },
    },
    "2007-08": {
      home: {
        owned: true,
        quantity: 1,
        details: "Local sin dorsal ni parches",
        missing: "Anadir dorsal y parches si quieres completarla.",
        links: "",
      },
    },
    "2006-07": {
      home: {
        owned: true,
        quantity: 1,
        details: "23 Beckham, Liga",
        missing: "",
        links: "",
      },
    },
    "2004-05": {
      home: {
        owned: true,
        quantity: 1,
        details: "Local, Liga",
        missing: "Falta dorsal.",
        links: "",
      },
    },
    "2003-04": {
      home: {
        owned: true,
        quantity: 1,
        details: "Local",
        missing: "Reparar publicidad.",
        links: "",
      },
    },
    "2002-03": {
      home: {
        owned: true,
        quantity: 1,
        details: "10 Figo, Champions League",
        missing: "",
        links: "",
      },
    },
    "2000-01": {
      home: {
        owned: true,
        quantity: 1,
        details: "10 Figo, Liga",
        missing: "",
        links: "",
      },
    },
  };

  const catalog = Array.isArray(window.RM_CATALOG)
    ? window.RM_CATALOG.slice().sort((a, b) => seasonStart(b.season) - seasonStart(a.season))
    : [];
  const catalogBySeason = new Map(catalog.map((entry) => [entry.season, entry]));

  const nodes = {
    ownedCount: document.getElementById("ownedCount"),
    seasonCount: document.getElementById("seasonCount"),
    pendingCount: document.getElementById("pendingCount"),
    missingCount: document.getElementById("missingCount"),
    seasonRows: document.getElementById("seasonRows"),
    detailTitle: document.getElementById("detailTitle"),
    detailTotal: document.getElementById("detailTotal"),
    kitGrid: document.getElementById("kitGrid"),
    galleryGrid: document.getElementById("galleryGrid"),
    galleryCount: document.getElementById("galleryCount"),
    searchInput: document.getElementById("searchInput"),
    pendingOnly: document.getElementById("pendingOnly"),
    saveState: document.getElementById("saveState"),
    exportButton: document.getElementById("exportButton"),
    importButton: document.getElementById("importButton"),
    importFile: document.getElementById("importFile"),
    resetButton: document.getElementById("resetButton"),
  };

  let collection = loadCollection();
  let selectedSeason = getInitialSeason();

  nodes.searchInput.addEventListener("input", renderTable);
  nodes.pendingOnly.addEventListener("change", renderTable);
  nodes.exportButton.addEventListener("click", exportCollection);
  nodes.importButton.addEventListener("click", () => nodes.importFile.click());
  nodes.importFile.addEventListener("change", importCollection);
  nodes.resetButton.addEventListener("click", resetCollection);
  window.addEventListener("hashchange", handleHashChange);

  renderAll();

  function seasonStart(season) {
    return Number(String(season).slice(0, 4)) || 0;
  }

  function blankRecord() {
    return {
      owned: false,
      quantity: 1,
      details: "",
      missing: "",
      links: "",
    };
  }

  function normalizeRecord(base, saved) {
    const source = Object.assign(blankRecord(), base || {}, saved || {});
    return {
      owned: Boolean(source.owned),
      quantity: Math.max(1, Number(source.quantity) || 1),
      details: String(source.details || ""),
      missing: String(source.missing || ""),
      links: String(source.links || ""),
    };
  }

  function normalizeCollection(saved) {
    const normalized = {};
    for (const entry of catalog) {
      normalized[entry.season] = {};
      for (const type of KIT_TYPES) {
        const baseRecord = BASE_COLLECTION[entry.season]?.[type.key];
        const savedRecord = saved?.[entry.season]?.[type.key];
        normalized[entry.season][type.key] = normalizeRecord(baseRecord, savedRecord);
      }
    }
    return normalized;
  }

  function loadCollection() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return normalizeCollection({});
      }
      const parsed = JSON.parse(raw);
      return normalizeCollection(parsed.collection || parsed);
    } catch (error) {
      console.warn("No se pudo cargar el inventario guardado.", error);
      return normalizeCollection({});
    }
  }

  function saveCollection(label) {
    const payload = {
      version: 1,
      savedAt: new Date().toISOString(),
      collection,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setSaveState(label || "Guardado");
  }

  function setSaveState(label) {
    const time = new Date().toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
    nodes.saveState.textContent = `${label} ${time}`;
  }

  function getInitialSeason() {
    const hashSeason = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    if (catalogBySeason.has(hashSeason)) {
      return hashSeason;
    }
    if (catalogBySeason.has("2024-25")) {
      return "2024-25";
    }
    return catalog[0]?.season || "";
  }

  function renderAll() {
    renderSummary();
    renderTable();
    renderDetail();
  }

  function renderSummary() {
    let ownedCount = 0;
    let pendingCount = 0;
    let missingCount = 0;

    for (const entry of catalog) {
      for (const type of KIT_TYPES) {
        const record = collection[entry.season][type.key];
        const hasImage = Boolean(entry.images?.[type.key]);

        if (record.owned) {
          ownedCount += Math.max(1, record.quantity || 1);
        } else if (hasImage) {
          missingCount += 1;
        }

        if (record.owned && record.missing.trim()) {
          pendingCount += 1;
        }
      }
    }

    nodes.ownedCount.textContent = ownedCount;
    nodes.seasonCount.textContent = catalog.length;
    nodes.pendingCount.textContent = pendingCount;
    nodes.missingCount.textContent = missingCount;
  }

  function renderTable() {
    const query = nodes.searchInput.value.trim().toLowerCase();
    const pendingOnly = nodes.pendingOnly.checked;
    nodes.seasonRows.textContent = "";

    for (const entry of catalog) {
      if (query && !seasonMatches(entry, query)) {
        continue;
      }
      if (pendingOnly && !seasonHasPending(entry.season)) {
        continue;
      }

      const row = document.createElement("tr");
      row.className = entry.season === selectedSeason ? "selected" : "";
      row.addEventListener("click", () => selectSeason(entry.season));

      const seasonCell = document.createElement("td");
      const seasonButton = document.createElement("button");
      seasonButton.className = "season-button";
      seasonButton.type = "button";
      seasonButton.textContent = entry.season;
      seasonButton.addEventListener("click", (event) => {
        event.stopPropagation();
        selectSeason(entry.season);
      });
      seasonCell.appendChild(seasonButton);
      row.appendChild(seasonCell);

      for (const type of KIT_TYPES) {
        const cell = document.createElement("td");
        cell.appendChild(createStatusPill(entry, type.key));
        row.appendChild(cell);
      }

      const pendingCell = document.createElement("td");
      const pending = countSeasonPending(entry.season);
      const pendingBadge = document.createElement("span");
      pendingBadge.className = pending > 0 ? "pending-badge" : "pending-badge empty";
      pendingBadge.textContent = pending > 0 ? String(pending) : "-";
      pendingCell.appendChild(pendingBadge);
      row.appendChild(pendingCell);

      nodes.seasonRows.appendChild(row);
    }
  }

  function createStatusPill(entry, typeKey) {
    const record = collection[entry.season][typeKey];
    const hasImage = Boolean(entry.images?.[typeKey]);
    const pill = document.createElement("span");
    const pending = record.owned && record.missing.trim();
    pill.className = [
      "status-pill",
      record.owned ? "owned" : "missing",
      pending ? "pending" : "",
      hasImage ? "" : "no-image",
    ]
      .filter(Boolean)
      .join(" ");
    pill.textContent = record.owned ? "\u2713" : "\u00d7";
    pill.title = getStatusTitle(record, hasImage);

    if (record.owned && record.quantity > 1) {
      const count = document.createElement("span");
      count.className = "status-count";
      count.textContent = String(record.quantity);
      pill.appendChild(count);
    }

    return pill;
  }

  function getStatusTitle(record, hasImage) {
    if (!hasImage && !record.owned) {
      return "No tengo. No hay imagen principal en el ZIP.";
    }
    if (!record.owned) {
      return "No tengo.";
    }
    const parts = ["Tengo"];
    if (record.details.trim()) {
      parts.push(record.details.trim());
    }
    if (record.missing.trim()) {
      parts.push(`Pendiente: ${record.missing.trim()}`);
    }
    if (!hasImage) {
      parts.push("No hay imagen principal en el ZIP.");
    }
    return parts.join(". ");
  }

  function seasonMatches(entry, query) {
    const records = KIT_TYPES.map((type) => collection[entry.season][type.key]);
    const haystack = [
      entry.season,
      ...records.flatMap((record) => [record.details, record.missing, record.links]),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  }

  function seasonHasPending(season) {
    return KIT_TYPES.some((type) => collection[season][type.key].missing.trim());
  }

  function countSeasonPending(season) {
    return KIT_TYPES.reduce((total, type) => {
      return total + (collection[season][type.key].owned && collection[season][type.key].missing.trim() ? 1 : 0);
    }, 0);
  }

  function selectSeason(season) {
    selectedSeason = season;
    if (decodeURIComponent(window.location.hash.replace(/^#/, "")) !== season) {
      history.replaceState(null, "", `#${encodeURIComponent(season)}`);
    }
    renderTable();
    renderDetail();
  }

  function handleHashChange() {
    const hashSeason = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    if (catalogBySeason.has(hashSeason)) {
      selectedSeason = hashSeason;
      renderTable();
      renderDetail();
    }
  }

  function renderDetail() {
    const entry = catalogBySeason.get(selectedSeason);
    if (!entry) {
      return;
    }

    nodes.detailTitle.textContent = entry.season;
    const ownedTypes = KIT_TYPES.filter((type) => collection[entry.season][type.key].owned).length;
    nodes.detailTotal.textContent = `${ownedTypes}/3`;
    nodes.kitGrid.textContent = "";

    for (const type of KIT_TYPES) {
      nodes.kitGrid.appendChild(createKitCard(entry, type));
    }

    renderGallery(entry);
  }

  function createKitCard(entry, type) {
    const record = collection[entry.season][type.key];
    const image = entry.images?.[type.key];
    const card = document.createElement("article");
    card.className = "kit-card";

    const media = document.createElement("div");
    media.className = "kit-media";
    if (image) {
      const img = document.createElement("img");
      img.src = image.src;
      img.alt = `${type.label} ${entry.season}`;
      img.loading = "lazy";
      media.appendChild(img);
    } else {
      const empty = document.createElement("div");
      empty.className = "empty-media";
      empty.textContent = "Sin imagen en ZIP";
      media.appendChild(empty);
    }
    card.appendChild(media);

    const body = document.createElement("div");
    body.className = "kit-body";

    const titleRow = document.createElement("div");
    titleRow.className = "kit-title-row";
    const title = document.createElement("h3");
    title.className = "kit-title";
    title.textContent = type.label;
    titleRow.appendChild(title);

    const toggle = document.createElement("label");
    toggle.className = "owned-toggle";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = record.owned;
    checkbox.addEventListener("change", () => {
      record.owned = checkbox.checked;
      if (record.owned && record.quantity < 1) {
        record.quantity = 1;
      }
      saveCollection();
      renderSummary();
      renderTable();
      renderDetailTotal(entry.season);
    });
    toggle.appendChild(checkbox);
    toggle.append("Tengo");
    titleRow.appendChild(toggle);
    body.appendChild(titleRow);

    const quantityRow = document.createElement("div");
    quantityRow.className = "quantity-row";
    const detailsField = createTextareaField("Detalles", record.details, (value) => {
      record.details = value;
      saveCollection();
      renderTable();
    });
    quantityRow.appendChild(detailsField);
    const quantityField = createInputField("Cantidad", "number", record.quantity, (value) => {
      record.quantity = Math.max(1, Number(value) || 1);
      saveCollection();
      renderSummary();
      renderTable();
    });
    quantityField.querySelector("input").min = "1";
    quantityRow.appendChild(quantityField);
    body.appendChild(quantityRow);

    body.appendChild(
      createTextareaField("Pendientes", record.missing, (value) => {
        record.missing = value;
        saveCollection();
        renderSummary();
        renderTable();
      })
    );

    const linksField = createTextareaField("Links", record.links, (value, fieldNode) => {
      record.links = value;
      saveCollection();
      renderTable();
      updateLinkPreview(fieldNode, value);
    });
    updateLinkPreview(linksField, record.links);
    body.appendChild(linksField);

    card.appendChild(body);
    return card;
  }

  function renderDetailTotal(season) {
    const ownedTypes = KIT_TYPES.filter((type) => collection[season][type.key].owned).length;
    nodes.detailTotal.textContent = `${ownedTypes}/3`;
  }

  function createInputField(labelText, type, value, onChange) {
    const label = document.createElement("label");
    label.className = "field";
    const span = document.createElement("span");
    span.textContent = labelText;
    const input = document.createElement("input");
    input.type = type;
    input.value = value;
    input.addEventListener("input", () => onChange(input.value, label));
    label.append(span, input);
    return label;
  }

  function createTextareaField(labelText, value, onChange) {
    const label = document.createElement("label");
    label.className = "field";
    const span = document.createElement("span");
    span.textContent = labelText;
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.addEventListener("input", () => onChange(textarea.value, label));
    label.append(span, textarea);
    return label;
  }

  function updateLinkPreview(fieldNode, value) {
    let preview = fieldNode.querySelector(".link-preview");
    if (!preview) {
      preview = document.createElement("div");
      preview.className = "link-preview";
      fieldNode.appendChild(preview);
    }

    const urls = extractUrls(value);
    preview.textContent = "";
    preview.hidden = urls.length === 0;
    urls.forEach((url, index) => {
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.target = "_blank";
      anchor.rel = "noreferrer";
      anchor.textContent = `Link ${index + 1}`;
      anchor.title = url;
      preview.appendChild(anchor);
    });
  }

  function extractUrls(text) {
    return String(text || "").match(/https?:\/\/[^\s<>"']+/g) || [];
  }

  function renderGallery(entry) {
    nodes.galleryGrid.textContent = "";
    const gallery = entry.gallery || [];
    nodes.galleryCount.textContent = String(gallery.length);

    for (const item of gallery) {
      const link = document.createElement("a");
      link.className = "thumb";
      link.href = item.src;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.title = item.title;

      const img = document.createElement("img");
      img.src = item.src;
      img.alt = item.title;
      img.loading = "lazy";
      const caption = document.createElement("span");
      caption.textContent = item.title;
      link.append(img, caption);
      nodes.galleryGrid.appendChild(link);
    }
  }

  function exportCollection() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      collection,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "camisetas-real-madrid-coleccion.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setSaveState("Exportado");
  }

  async function importCollection(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      collection = normalizeCollection(parsed.collection || parsed);
      saveCollection("Importado");
      renderAll();
    } catch (error) {
      console.error(error);
      alert("No se pudo importar el JSON.");
    } finally {
      event.target.value = "";
    }
  }

  function resetCollection() {
    const ok = confirm("Restablecer el inventario inicial?");
    if (!ok) {
      return;
    }
    collection = normalizeCollection({});
    saveCollection("Restablecido");
    renderAll();
  }
})();
