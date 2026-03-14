const PROXY = "https://api.allorigins.win/raw?url=";
const BASE = "https://api.mangadex.org";

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const results = document.getElementById("results");
const chapterList = document.getElementById("chapterList");
const readerSection = document.getElementById("readerSection");
const toggleTheme = document.getElementById("toggleTheme");

let currentMangaId = "";

// Theme
toggleTheme.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  document.body.classList.toggle("light");
  toggleTheme.textContent = document.body.classList.contains("dark") ? "☀️ Light" : "🌙 Dark";
});

// Search
searchBtn.addEventListener("click", searchManga);
searchInput.addEventListener("keydown", e => { if (e.key === "Enter") searchManga(); });

async function searchManga() {
  const query = searchInput.value.trim();
  if (!query) return;
  results.innerHTML = `<div class="loader">Mencari manga...</div>`;
  show("results");

  try {
    const url = `${BASE}/manga?title=${encodeURIComponent(query)}&limit=20&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive`;
    const res = await fetch(PROXY + encodeURIComponent(url));
    const data = await res.json();
    renderCards(data.data || []);
  } catch {
    results.innerHTML = `<div class="loader">Gagal memuat. Coba lagi.</div>`;
  }
}

function renderCards(mangas) {
  if (!mangas.length) { results.innerHTML = `<div class="loader">Manga tidak ditemukan.</div>`; return; }
  results.innerHTML = mangas.map(m => {
    const title = m.attributes.title.en || Object.values(m.attributes.title)[0] || "No Title";
    const cover = getCover(m);
    return `<div class="card" onclick="openManga('${m.id}','${escHtml(title)}','${cover}')">
      <img src="${cover}" alt="${escHtml(title)}" loading="lazy" onerror="this.src='https://placehold.co/130x190?text=No+Cover'"/>
      <p>${escHtml(title)}</p>
    </div>`;
  }).join("");
}

function getCover(manga) {
  const rel = manga.relationships?.find(r => r.type === "cover_art");
  if (!rel) return "https://placehold.co/130x190?text=No+Cover";
  return `https://uploads.mangadex.org/covers/${manga.id}/${rel.attributes?.fileName}.256.jpg`;
}

// Open manga detail
async function openManga(id, title, cover) {
  currentMangaId = id;
  document.getElementById("mangaTitle").textContent = title;
  document.getElementById("mangaCover").src = cover;
  document.getElementById("chapters").innerHTML = `<div class="loader">Memuat chapter...</div>`;
  show("chapterList");

  try {
    const url = `${BASE}/manga/${id}/feed?translatedLanguage[]=en&order[chapter]=asc&limit=100`;
    const res = await fetch(PROXY + encodeURIComponent(url));
    const data = await res.json();
    renderChapters(data.data || []);
  } catch {
    document.getElementById("chapters").innerHTML = `<div class="loader">Gagal memuat chapter.</div>`;
  }
}

function renderChapters(chapters) {
  if (!chapters.length) { document.getElementById("chapters").innerHTML = `<div class="loader">Tidak ada chapter.</div>`; return; }
  document.getElementById("chapters").innerHTML = chapters.map(c => {
    const num = c.attributes.chapter || "?";
    const ttl = c.attributes.title ? ` — ${c.attributes.title}` : "";
    return `<div class="chapter-item" onclick="openReader('${c.id}','Chapter ${num}${escHtml(ttl)}')">Chapter ${num}${escHtml(ttl)}</div>`;
  }).join("");
}

// Reader
async function openReader(chapterId, title) {
  document.getElementById("chapterTitle").textContent = title;
  document.getElementById("pages").innerHTML = `<div class="loader">Memuat halaman...</div>`;
  show("readerSection");

  try {
    const url = `${BASE}/at-home/server/${chapterId}`;
    const res = await fetch(PROXY + encodeURIComponent(url));
    const data = await res.json();
    const base = data.baseUrl;
    const hash = data.chapter.hash;
    const imgs = data.chapter.data;
    document.getElementById("pages").innerHTML = imgs.map(img =>
      `<img src="${base}/data/${hash}/${img}" loading="lazy" onerror="this.src='https://placehold.co/400x600?text=Error'"/>`
    ).join("");
  } catch {
    document.getElementById("pages").innerHTML = `<div class="loader">Gagal memuat halaman.</div>`;
  }
}

// Navigation
document.getElementById("backToSearch").addEventListener("click", () => show("results"));
document.getElementById("backToChapters").addEventListener("click", () => show("chapterList"));

function show(section) {
  ["results","chapterList","readerSection"].forEach(id => {
    document.getElementById(id).classList.add("hidden");
  });
  document.getElementById(section).classList.remove("hidden");
}

function escHtml(str) {
  return str.replace(/'/g,"&#39;").replace(/"/g,"&quot;");
}