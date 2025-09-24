// ==== main.js ====

// ====== ДАННЫЕ И ИНИЦИАЛИЗАЦИЯ ======
let collection = JSON.parse(localStorage.getItem("collection") || "[]");
let diamonds = Number(localStorage.getItem("diamonds") || 0);
let nextPackTime = Number(localStorage.getItem("nextPackTime") || 0);

const el = {
  diamonds: () => document.getElementById("diamonds"),
  pokemonList: () => document.getElementById("pokemonList"),
  searchBtn: () => document.getElementById("searchBtn"),
  searchInput: () => document.getElementById("searchInput"),
  typeFilter: () => document.getElementById("typeFilter"),
  rarityFilter: () => document.getElementById("rarityFilter"),
  sortSelect: () => document.getElementById("sortSelect"),
  openPackBtn: () => document.getElementById("openPackBtn"),
  openedPokemons: () => document.getElementById("openedPokemons"),
  packCooldown: () => document.getElementById("packCooldown"),
};

// ====== СОХРАНЕНИЕ ======
function saveGame() {
  localStorage.setItem("collection", JSON.stringify(collection));
  localStorage.setItem("diamonds", String(diamonds));
  localStorage.setItem("nextPackTime", String(nextPackTime));
  updateUI();
}

function updateUI() {
  if (el.diamonds()) el.diamonds().textContent = diamonds;
  updateCooldown();
}

// ====== РЕДКОСТЬ ======
function getRarity() {
  const r = Math.random();
  if (r < 0.65) return "common";       // 65%
  if (r < 0.90) return "rare";         // 25%
  if (r < 0.99) return "legendary";    // 9%
  return "chromatic";                  // 1%
}

function ensureRarity(poke) {
  if (!poke.rarity) poke.rarity = getRarity();
  return poke;
}

function normalizeCollection() {
  let changed = false;
  collection = collection.map(p => {
    if (!p.rarity) {
      p.rarity = getRarity();
      changed = true;
    }
    return p;
  });
  if (changed) saveGame();
}

// ====== ПЕРЕКЛЮЧЕНИЕ СТРАНИЦ ======
function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  const target = document.getElementById(id);
  if (target) target.classList.remove("hidden");
}

// ====== ПАКИ ======
function openPack(type = "normal") {
  const now = Date.now();
  if (type === "normal" && now < nextPackTime) {
    alert("Подожди час для бесплатного пака!");
    return;
  }
  if (type === "normal") nextPackTime = now + 60 * 60 * 1000;

  const opened = [];
  for (let i = 0; i < 3; i++) {
    const base = pokemons[Math.floor(Math.random() * pokemons.length)];
    const newPoke = ensureRarity({ ...base });
    collection.push(newPoke);
    opened.push(newPoke);
  }

  saveGame();
  renderOpened(opened);
}

function renderOpened(list) {
  const box = el.openedPokemons();
  if (!box) return;
  box.innerHTML = "";
  list.forEach(p => {
    const card = document.createElement("div");
    card.className = `pokemon-card ${p.rarity}`;
    card.innerHTML = `
      <div><b>${escapeHtml(p.name)}</b> <small>(${p.rarity})</small></div>
      <img src="${p.img}" alt="${escapeHtml(p.name)}">
      <p>Type: ${formatTypes(p.type)}</p>
    `;
    box.appendChild(card);
  });
}

// ====== МАГАЗИН ======
function buyPack(kind) {
  if (kind === "normal") {
    if (diamonds < 10) return alert("Недостаточно 💎!");
    diamonds -= 10;
    openPack("shop");
  } else if (kind === "rare") {
    if (diamonds < 50) return alert("Недостаточно 💎!");
    diamonds -= 50;
    openPack("shop");
  }
  saveGame();
}

// ====== ПРОДАЖА ДУБЛИКАТОВ ======
function sellDuplicates() {
  const seen = new Set();
  let sold = 0;
  const remaining = [];
  for (const p of collection) {
    const key = `${p.id || p.num}-${p.rarity}`;
    if (seen.has(key)) {
      diamonds += 5;
      sold++;
    } else {
      seen.add(key);
      remaining.push(p);
    }
  }
  collection = remaining;
  alert(`Продано ${sold} дубликатов за ${sold * 5} 💎`);
  saveGame();
  renderPokemons(collection);
}

// ====== РЕНДЕР POKEDEX ======
function renderPokemons(data) {
  const listEl = el.pokemonList();
  if (!listEl) return;
  listEl.innerHTML = "";
  data.forEach(item => {
    ensureRarity(item);
    const types = formatTypes(item.type);
    const card = document.createElement("div");
    card.className = `pokemon-card ${item.rarity}`;
    card.innerHTML = `
      <div class="card-header"><b>${escapeHtml(item.name)}</b> #${escapeHtml(String(item.num || item.id))}</div>
      <img src="${item.img}" alt="${escapeHtml(item.name)}">
      <p>Type: ${types}</p>
      <p>Weight: ${escapeHtml(item.weight || "")}</p>
      <p><b>Rarity:</b> ${escapeHtml(item.rarity)}</p>
    `;
    listEl.appendChild(card);
  });
  saveGame();
}

// ====== ФИЛЬТРЫ ======
function applyFiltersAndRender() {
  const name = (el.searchInput().value || "").toLowerCase().trim();
  const type = el.typeFilter().value;
  const rarity = el.rarityFilter().value;
  const sort = el.sortSelect().value;

  let data = collection.filter(p => {
    const pname = (p.name || "").toLowerCase();
    if (!pname.includes(name)) return false;

    const types = Array.isArray(p.type) ? p.type : [p.type];
    if (type !== "all" && !types.includes(type)) return false;

    if (rarity !== "all" && p.rarity !== rarity) return false;

    return true;
  });

  data.sort((a, b) => {
    if (sort === "az") return (a.name || "").localeCompare(b.name || "");
    return (b.name || "").localeCompare(a.name || "");
  });

  renderPokemons(data);
}

// ====== КУЛДАУН ПАКА ======
let cooldownTimerId = null;
function updateCooldown() {
  const elc = el.packCooldown();
  if (!elc) return;
  const now = Date.now();
  const diff = nextPackTime - now;
  if (diff > 0) {
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    elc.textContent = `До следующего бесплатного пака: ${mins}м ${secs}с`;
    if (cooldownTimerId) clearTimeout(cooldownTimerId);
    cooldownTimerId = setTimeout(updateCooldown, 1000);
  } else {
    elc.textContent = "Можно открыть бесплатный пак!";
    if (cooldownTimerId) {
      clearTimeout(cooldownTimerId);
      cooldownTimerId = null;
    }
  }
}

// ====== УТИЛИТЫ ======
function formatTypes(t) {
  if (!t) return "";
  return Array.isArray(t) ? t.join(", ") : t;
}
function escapeHtml(text) {
  if (!text) return "";
  return String(text).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[s]));
}

// ====== СЛУШАТЕЛИ ======
document.addEventListener("DOMContentLoaded", () => {
  normalizeCollection();

  if (el.searchBtn()) el.searchBtn().addEventListener("click", applyFiltersAndRender);
  if (el.typeFilter()) el.typeFilter().addEventListener("change", applyFiltersAndRender);
  if (el.rarityFilter()) el.rarityFilter().addEventListener("change", applyFiltersAndRender);
  if (el.sortSelect()) el.sortSelect().addEventListener("change", applyFiltersAndRender);

  if (el.openPackBtn()) el.openPackBtn().addEventListener("click", () => openPack("normal"));

  updateUI();
  renderPokemons(collection);

  showPage("pokedex");
});

// Экспорт для HTML
window.openPack = openPack;
window.buyPack = buyPack;
window.sellDuplicates = sellDuplicates;
window.showPage = showPage;
