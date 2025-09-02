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
      ${pageItems
        .map(
          (g) => `
        <a href="/game/${encodeURIComponent(g.id)}" data-navigo>
          <figure class="card">
            <img data-src="${g.thumbnail}" alt="${escapeHtml(g.title)}" />
            <figcaption>${escapeHtml(g.title)}</figcaption>
          </figure>
        </a>
      `
        )
        .join("")}
    </div>
    ${renderPagination(totalPages, page, list)}
  `;

  appEl.innerHTML = html;
  router.updatePageLinks();

  // lazy load ảnh + hiệu ứng blur
  const imgs = document.querySelectorAll(".card img");
  imgs.forEach((img) => {
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
  pageBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const newPage = parseInt(btn.dataset.page, 10);
      renderList(list, newPage);
    });
  });

  //  thêm About Us vào cuối trang home
  //  About Us
  appEl.insertAdjacentHTML(
    "beforeend",
    `
      <section class="about-section">
        <h2 class="about-title">About Us! 🎮✨</h2>
        <p>
          Welcome to our world! We're not just a game dev studio—we're a wild mix of Millennials 
          and Gen Z hardcore gamers who've been leveling up in the industry for the past six years. 
          Stuck in the box for too long, we decided it's time to break free and do something epic.
        </p>
        <p>
          Fueled by an "itch-you-can’t-scratch" kind of idea (and a sprinkle of Elon Musk inspiration), 
          we asked ourselves: What if we turned trending memes into bite-sized, insanely fun Web 3 games? 
          Minimal mechanics, maximum fun—that's our vibe!
        </p>
        <p>
          Our mission? To create quick bursts of joy, make people smile (even if just for a few seconds), 
          and grow alongside the community.
        </p>
        <p>
          But wait, there's more! We're not just about the games—we're building an entire ecosystem. 
          As gamers and developers ourselves, we take this opportunity seriously (like, super seriously). 
          Let's change the game together! 🚀
        </p>
        <p>
          And hey, if you're dreaming of a wild meme game, we’ve got you! 
          We even take payments in $WTF—because why not keep it iconic?
        </p>
      </section>
    `
  );

  // Footer Contract Info
  appEl.insertAdjacentHTML(
    "beforeend",
    `
      <footer class="contract-footer">
        <p class="footer-title">2025 MEME WAR TOKEN All rights reserved</p>
        <div class="contract-info">
          <p>
            Contract Address: 
            <span id="contract-address" class="contract-address">
              0x1234567890abcdef1234567890abcdef12345678
            </span>
          </p>
          <button id="copy-btn" class="copy-btn">
            <i class="fas fa-copy"></i>
            Copy
          </button>
        </div>
        <p id="copy-status" class="copy-status">Copied!</p>
      </footer>
    `
  );

  // Gắn sự kiện copy sau khi render xong
  const copyBtn = document.getElementById("copy-btn");
  const copyStatus = document.getElementById("copy-status");

  copyBtn?.addEventListener("click", () => {
    const addr = document.getElementById("contract-address").textContent;
    navigator.clipboard.writeText(addr).then(() => {
      copyStatus.style.display = "block";
      setTimeout(() => (copyStatus.style.display = "none"), 2000);
    });
  });
}

function renderGame(game) {
  appEl.innerHTML = `
    <h2>${escapeHtml(game.title)}</h2>
    <p>${escapeHtml(game.desc)}</p>
    <div style="margin:12px 0">
      <iframe src="${
        game.url
      }" width="100%" height="600" style="border:1px solid #e5e7eb;border-radius:8px"></iframe>
    </div>
    <p><a class="hover-a" href="/" data-navigo>⬅ Back to list</a></p>
  `;
  router.updatePageLinks();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// build categories list
async function buildCategories() {
  const all = await loadGames();
  const cats = Array.from(new Set(all.map((g) => g.category))).sort();
  categoriesEl.innerHTML =
    `<li><a class="hover-a" href="/" data-navigo>All</a></li>` +
    cats
      .map(
        (c) =>
          `<li><a class="hover-a" href="/category/${encodeURIComponent(
            c
          )}" data-navigo>${escapeHtml(c)}</a></li>`
      )
      .join("");
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
    renderList(all.filter((g) => g.category === cat));
  })
  .on("/game/:id", async ({ data }) => {
    const all = await loadGames();
    const id = decodeURIComponent(data.id);
    const game = all.find((g) => g.id == id);
    if (game) renderGame(game);
    else appEl.innerHTML = "<h2>Game not found</h2>";
  })
  .notFound(() => (appEl.innerHTML = "<h2>404 Not Found</h2>"));

router.resolve();
buildCategories();

// search handlers
async function searchAndRender(term) {
  const all = await loadGames();
  const t = term.trim().toLowerCase();
  if (!t) return renderList(all);
  renderList(
    all.filter(
      (g) =>
        g.title.toLowerCase().includes(t) || g.desc.toLowerCase().includes(t)
    )
  );
}

function renderPagination(totalPages, currentPage) {
  if (totalPages <= 1) return "";

  const NUMBER_OF_VISIBLE_PAGES = 4;

  let startPage = Math.max(1, currentPage - 2);
  let endPage = startPage + NUMBER_OF_VISIBLE_PAGES - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - NUMBER_OF_VISIBLE_PAGES + 1);
  }

  let buttons = "";

  // nút prev
  buttons += `
    <button data-page="${Math.max(1, currentPage - 1)}" ${
    currentPage === 1 ? "disabled" : ""
  }>
      &lt;
    </button>
  `;

  // 4 số trang
  for (let i = startPage; i <= endPage; i++) {
    buttons += `
      <button data-page="${i}" class="${i === currentPage ? "active" : ""}">
        ${i}
      </button>
    `;
  }

  // nút next
  buttons += `
    <button data-page="${Math.min(totalPages, currentPage + 1)}" ${
    currentPage === totalPages ? "disabled" : ""
  }>
      &gt;
    </button>
  `;

  return `<div class="pagination">${buttons}</div>`;
}

searchInput.addEventListener("input", (e) => searchAndRender(e.target.value));
// topSearch.addEventListener("input", (e)=> searchAndRender(e.target.value));
