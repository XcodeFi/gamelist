const router = new Navigo("/", { hash: false });
const appEl = document.getElementById("app");
const searchInput = document.getElementById("search");
const topSearch = document.getElementById("searchTop");
const categoriesEl = document.getElementById("categories");
let games = [];

// fetch games.json once
async function loadGames() {
  if (games.length) return games;
  const res = await fetch("/games.json");
  games = await res.json();
  return games;
}

function renderList(list) {
  if (!list.length) {
    appEl.innerHTML = `<h2>No games found</h2>`;
    return;
  }
  const html = `<div class="grid">${list.map(g => `
    <article class="game-card">
      <img src="${g.image}" alt="${escapeHtml(g.title)}" />
      <h3>${escapeHtml(g.title)}</h3>
      <p>${escapeHtml(g.desc)}</p>
      <button class="primary-btn" href="/game/${encodeURIComponent(g.id)}" data-navigo>Play Now</button>
    </article>`).join("")}</div>`;
  appEl.innerHTML = html;
  router.updatePageLinks(); // ensure navigo handles new anchors
}

function renderGame(game) {
  appEl.innerHTML = `
    <h2>${escapeHtml(game.title)}</h2>
    <p>${escapeHtml(game.desc)}</p>
    <div style="margin:12px 0">
      <iframe src="${game.url}" width="100%" height="600" style="border:1px solid #e5e7eb;border-radius:8px"></iframe>
    </div>
    <p><a href="/" data-navigo>⬅ Back to list</a></p>
  `;
  router.updatePageLinks();
}

function escapeHtml(str){
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;");
}

// build categories list
async function buildCategories() {
  const all = await loadGames();
  const cats = Array.from(new Set(all.map(g => g.category))).sort();
  categoriesEl.innerHTML = `<li><a href="/" data-navigo>All</a></li>` +
    cats.map(c => `<li><a href="/category/${encodeURIComponent(c)}" data-navigo>${escapeHtml(c)}</a></li>`).join('');
  router.updatePageLinks();
}

// routes
router
  .on("/", async () => {
    const all = await loadGames();
    renderList(all);
  })
  .on("/category/:cat", async ({ data }) => {
    const all = await loadGames();
    const cat = decodeURIComponent(data.cat);
    renderList(all.filter(g => g.category === cat));
  })
  .on("/game/:id", async ({ data }) => {
    const all = await loadGames();
    const id = decodeURIComponent(data.id);
    const game = all.find(g => g.id === id);
    if (game) renderGame(game);
    else appEl.innerHTML = "<h2>Game not found</h2>";
  })
  .notFound(()=> appEl.innerHTML = "<h2>404 Not Found</h2>");

router.resolve();
buildCategories();

// search handlers
async function searchAndRender(term) {
  const all = await loadGames();
  const t = term.trim().toLowerCase();
  if (!t) return renderList(all);
  renderList(all.filter(g => g.title.toLowerCase().includes(t) || g.desc.toLowerCase().includes(t)));
}

searchInput.addEventListener("input", (e)=> searchAndRender(e.target.value));
topSearch.addEventListener("input", (e)=> searchAndRender(e.target.value));
