const router = new Navigo("/", { hash: true });
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

const PAGE_SIZE = 8;
let currentPage = 1;

function renderList(list, page = 1) {
  if (!list.length) {
    appEl.innerHTML = `<h2>No games found</h2>`;
    return;
  }

  currentPage = page;
  const totalPages = Math.ceil(list.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageItems = list.slice(start, end);

  const html = `
    <div class="cards">
      ${pageItems.map(g => `
        <a href="/game/${encodeURIComponent(g.id)}" data-navigo>
          <figure class="card">
            <img data-src="${g.thumbnail}" alt="${escapeHtml(g.title)}" />
            <figcaption>${escapeHtml(g.title)}</figcaption>
          </figure>
        </a>
      `).join("")}
    </div>
    ${renderPagination(totalPages, page, list)}
  `;

  appEl.innerHTML = html;
  router.updatePageLinks();

  // lazy load ảnh + hiệu ứng blur
  const imgs = document.querySelectorAll(".card img");
  imgs.forEach(img => {
    const src = img.getAttribute("data-src");
    if (!src) return;
    const temp = new Image();
    temp.src = src;
    temp.onload = () => {
      img.src = src;
      img.classList.add("loaded");
    };
  });

  // gắn event cho pagination
  const pageBtns = document.querySelectorAll(".pagination button");
  pageBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const newPage = parseInt(btn.dataset.page, 10);
      renderList(list, newPage);
    });
  });
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
    const game = all.find(g => g.id == id);
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

function renderPagination(totalPages, page, list) {
  if (totalPages <= 1) return "";

  let buttons = "";
  for (let i = 1; i <= totalPages; i++) {
    buttons += `
      <button data-page="${i}" class="${i === page ? "active" : ""}">
        ${i}
      </button>
    `;
  }

  return `
    <div class="pagination">
      ${buttons}
    </div>
  `;
}


searchInput.addEventListener("input", (e)=> searchAndRender(e.target.value));
// topSearch.addEventListener("input", (e)=> searchAndRender(e.target.value));
