(() => {
  "use strict";

  const STICKERS = window.STICKERS || [];
  const N = STICKERS.length;
  const STORAGE_KEY = "superminionu:v1";
  const MAX = 35; // un caractère base36 par vignette

  // ---------- Encodage du fragment ----------
  // #c=<compteurs>&n=<nom>
  // <compteurs> : un caractère base36 (0-9a-z) par vignette, dans l'ordre de data/stickers.js,
  // zéros finaux supprimés. Ex. "1020" = n°1 ×1, n°3 ×2.
  const encode = (counts) => counts.map((c) => Math.min(c, MAX).toString(36)).join("").replace(/0+$/, "");
  const decode = (str) => {
    const out = new Array(N).fill(0);
    (str || "").slice(0, N).split("").forEach((ch, i) => {
      const v = parseInt(ch, 36);
      out[i] = Number.isFinite(v) ? v : 0;
    });
    return out;
  };
  const buildHash = (counts, name) => {
    const p = new URLSearchParams();
    p.set("c", encode(counts));
    if (name) p.set("n", name);
    return "#" + p.toString();
  };
  const parseHash = () => {
    const h = location.hash.replace(/^#/, "");
    if (!h) return null;
    const p = new URLSearchParams(h);
    if (!p.has("c")) return null;
    return { counts: decode(p.get("c")), name: (p.get("n") || "").slice(0, 40) };
  };

  // ---------- Stockage local ----------
  const load = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        return { counts: decode(d.c), name: d.n || "" };
      }
    } catch (e) { /* stockage indisponible */ }
    return { counts: new Array(N).fill(0), name: "" };
  };
  const save = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ c: encode(mine.counts), n: mine.name })); } catch (e) {}
  };

  // ---------- État ----------
  let mine = load();
  let shared = null;        // collection reçue via un lien
  let view = "mine";        // "mine" | "shared"
  let filter = "all";
  let query = "";

  const $ = (s) => document.querySelector(s);
  const grid = $("#grid");
  const current = () => (view === "shared" ? shared : mine);

  const setHash = (counts, name) => {
    const empty = !encode(counts) && !name;
    history.replaceState(null, "", empty ? location.pathname + location.search : buildHash(counts, name));
  };

  const syncFromHash = () => {
    const h = parseHash();
    if (h && (encode(h.counts) !== encode(mine.counts) || h.name !== mine.name)) {
      shared = h;
      view = "shared";
    } else {
      shared = null;
      view = "mine";
      if (!h) setHash(mine.counts, mine.name);
    }
    if (view === "mine" && (filter === "they-give" || filter === "i-give")) filter = "all";
    render();
  };

  // ---------- Rendu ----------
  const matchesFilter = (i) => {
    const c = current().counts[i];
    switch (filter) {
      case "missing": return c === 0;
      case "owned": return c > 0;
      case "doubles": return c > 1;
      case "they-give": return shared.counts[i] > 1 && mine.counts[i] === 0;
      case "i-give": return mine.counts[i] > 1 && shared.counts[i] === 0;
      default: return true;
    }
  };
  const matchesQuery = (s) => !query || s.id.toLowerCase() === query || s.id.toLowerCase().startsWith(query);

  const label = (c) => (c === 2 ? "Double" : c === 3 ? "Triple" : `×${c}`);

  const cellHTML = (s, i, c) => {
    const marks = (s.finish === "pailletee" ? '<span title="Pailletée">✨</span>' : "") +
      (s.finish === "doree" ? '<span title="Dorée">★</span>' : "") +
      (s.peluche ? '<span title="Coin vignette peluche">🧸</span>' : "");
    const visual = s.img
      ? `<img src="${s.img}" alt="" loading="lazy" decoding="async">`
      : `<span class="ph">${s.id}</span>`;
    const title = `N° ${s.id}${s.name ? " – " + s.name : ""}`;
    const state = c === 0 ? "manquante" : c === 1 ? "possédée" : `${c} exemplaires`;
    return `<li class="cell${c > 0 ? " owned" : ""} f-${s.finish}" data-i="${i}">
      <button class="card" type="button" aria-label="${title}, ${state}${view === "mine" ? ". Toucher pour ajouter" : ""}">
        ${visual}
        ${s.img ? `<span class="num">${s.id}</span>` : ""}
        ${marks ? `<span class="marks">${marks}</span>` : ""}
        ${c > 1 ? `<span class="count">${label(c)}</span>` : ""}
      </button>
      ${c > 0 ? `<button class="minus" type="button" aria-label="Retirer un exemplaire du n° ${s.id}">−</button>` : ""}
    </li>`;
  };

  const render = () => {
    const col = current();
    const counts = col.counts;
    let html = "";
    STICKERS.forEach((s, i) => {
      if (matchesFilter(i) && matchesQuery(s)) html += cellHTML(s, i, counts[i]);
    });
    grid.innerHTML = html;
    grid.classList.toggle("readonly", view === "shared");
    $("#empty").hidden = html !== "";

    const owned = counts.filter((c) => c > 0).length;
    const doubles = counts.reduce((a, c) => a + Math.max(0, c - 1), 0);
    $("#s-owned").textContent = owned;
    $("#s-total").textContent = N;
    $("#s-missing").textContent = N - owned;
    $("#s-doubles").textContent = doubles;
    $("#bar").style.width = (N ? (owned / N) * 100 : 0) + "%";

    $("#shared-banner").hidden = view !== "shared";
    $("#shared-name").textContent = view === "shared" && shared.name ? ` de ${shared.name}` : "";
    $("#hint").hidden = view === "shared";
    document.querySelectorAll(".chip.trade").forEach((b) => (b.hidden = view !== "shared"));
    document.querySelectorAll("#filters .chip").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.f === filter)));
    document.title = view === "shared" && shared.name ? `Collection de ${shared.name} — Minions Super U` : "Minions Super U — Ma collection";
  };

  // ---------- Actions ----------
  const change = (i, delta) => {
    if (view !== "mine") return;
    mine.counts[i] = Math.max(0, Math.min(MAX, mine.counts[i] + delta));
    save();
    setHash(mine.counts, mine.name);
    render();
  };

  let toastTimer;
  const toast = (msg) => {
    const t = $("#toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.hidden = true), 2200);
  };

  const copy = async (text, okMsg) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(okMsg);
    } catch (e) {
      window.prompt("Copiez ce texte :", text);
    }
  };

  const shareUrl = () => {
    const col = current();
    return location.origin + location.pathname + buildHash(col.counts, col.name);
  };

  const listText = (kind) => {
    const col = current();
    const items = STICKERS.map((s, i) => [s, col.counts[i]]);
    if (kind === "doubles") {
      const d = items.filter(([, c]) => c > 1).map(([s, c]) => (c > 2 ? `${s.id} (×${c - 1})` : s.id));
      return d.length ? `Mes doubles Minions Super U : ${d.join(", ")}` : "";
    }
    const m = items.filter(([, c]) => c === 0).map(([s]) => s.id);
    return m.length ? `Il me manque (Minions Super U) : ${m.join(", ")}` : "";
  };

  grid.addEventListener("click", (e) => {
    const cell = e.target.closest(".cell");
    if (!cell) return;
    const i = Number(cell.dataset.i);
    if (e.target.closest(".minus")) change(i, -1);
    else if (e.target.closest(".card")) change(i, +1);
  });

  $("#filters").addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (!b) return;
    filter = b.dataset.f;
    render();
  });

  $("#search").addEventListener("input", (e) => {
    query = e.target.value.trim().toLowerCase().replace(/^n°?\s*/, "");
    render();
  });

  $("#btn-share").addEventListener("click", async () => {
    const url = shareUrl();
    const col = current();
    const owned = col.counts.filter((c) => c > 0).length;
    const text = `${col.name ? "Collection de " + col.name : "Ma collection"} Minions Super U : ${owned}/${N}`;
    if (navigator.share) {
      try { await navigator.share({ title: "Minions Super U", text, url }); return; } catch (e) { if (e.name === "AbortError") return; }
    }
    copy(url, "Lien copié !");
  });

  const menu = $("#menu");
  const menuBtn = $("#btn-menu");
  const closeMenu = () => { menu.hidden = true; menuBtn.setAttribute("aria-expanded", "false"); };
  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.hidden = !menu.hidden;
    menuBtn.setAttribute("aria-expanded", String(!menu.hidden));
  });
  document.addEventListener("click", (e) => { if (!menu.contains(e.target)) closeMenu(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });

  menu.addEventListener("click", (e) => {
    const act = e.target.closest("button")?.dataset.act;
    if (!act) return;
    closeMenu();
    if (act === "copy-doubles") {
      const t = listText("doubles");
      t ? copy(t, "Liste des doubles copiée") : toast("Aucun double");
    } else if (act === "copy-missing") {
      const t = listText("missing");
      t ? copy(t, "Liste des manquantes copiée") : toast("Collection complète !");
    } else if (act === "rename") {
      const n = window.prompt("Nom affiché sur le lien partagé :", mine.name);
      if (n === null) return;
      mine.name = n.trim().slice(0, 40);
      save();
      view = "mine";
      setHash(mine.counts, mine.name);
      render();
    } else if (act === "reset") {
      if (!window.confirm("Effacer toute votre collection sur cet appareil ?")) return;
      mine = { counts: new Array(N).fill(0), name: mine.name };
      save();
      view = "mine";
      setHash(mine.counts, mine.name);
      render();
    }
  });

  $("#btn-mine").addEventListener("click", () => {
    view = "mine";
    shared = null;
    if (filter === "they-give" || filter === "i-give") filter = "all";
    setHash(mine.counts, mine.name);
    render();
  });

  $("#btn-import").addEventListener("click", () => {
    if (!window.confirm("Remplacer votre collection sur cet appareil par celle de ce lien ?")) return;
    mine = { counts: shared.counts.slice(), name: shared.name };
    save();
    view = "mine";
    shared = null;
    filter = "all";
    render();
    toast("Collection importée");
  });

  window.addEventListener("hashchange", syncFromHash);
  syncFromHash();
})();
