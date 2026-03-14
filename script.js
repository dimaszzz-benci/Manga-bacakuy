const BASE = "/api";

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const results = document.getElementById("results");
const toggleTheme = document.getElementById("toggleTheme");

let currentMangaId = "";

toggleTheme.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  document.body.classList.toggle("light");
  toggleTheme.textContent = document.body.classList.contains("dark") ? "☀️ Light" : "🌙 Dark";
});

searchBtn.addEventListener("click", searchManga);
searchInput.addEventListener("keydown", e => { if (e.key === "Enter") searchManga(); });

async function searchManga() {
  const query = searchInput.value.trim();
  if (!query) return;
  results.innerHTML = '<div class="loader">Mencari manga...</div>';
  show("results");
  try {
    const res = await fetch(BASE + "/manga?title=" + encodeURIComponent(query) + "&limit=20&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive");
    const data = await res.json();
    renderCards(data.data || []);
  } catch(e) {
    results.innerHTML = '<div class="loader">Gagal memuat. Coba lagi.</div>';
  }
}

function renderCards(mangas) {
  if (!mangas.length) {
    results.innerHTML = '<div class="loader">Manga tidak ditemukan.</div>';
    return;
  }
  var html = "";
  for (var i = 0; i < mangas.length; i++) {
    var m = mangas[i];
    var title = m.attributes.title.en || Object.values(m.attributes.title)[0] || "No Title";
    var cover = getCover(m);
    html += '<div class="card" onclick="openManga(\'' + m.id + '\',\'' + escHtml(title) + '\',\'' + cover + '\')">';
    html += '<img src="' + cover + '" loading="lazy" onerror="this.src=\'https://placehold.co/130x190?text=No+Cover\'"/>';
    html += '<p>' + escHtml(title) + '</p></div>';
  }
  results.innerHTML = html;
}

function getCover(manga) {
  var rel = null;
  for (var i = 0; i < manga.relationships.length; i++) {
    if (manga.relationships[i].type === "cover_art") { rel = manga.relationships[i]; break; }
  }
  if (!rel) return "https://placehold.co/130x190?text=No+Cover";
  return "/covers/" + manga.id + "/" + rel.attributes.fileName + ".256.jpg";
}

async function openManga(id, title, cover) {
  currentMangaId = id;
  document.getElementById("mangaTitle").textContent = title;
  document.getElementById("mangaCover").src = cover;
  document.getElementById("chapters").innerHTML = '<div class="loader">Memuat chapter...</div>';
  show("chapterList");
  try {
    const res = await fetch(BASE + "/manga/" + id + "/feed?translatedLanguage[]=en&order[chapter]=asc&limit=100");
    const data = await res.json();
    renderChapters(data.data || []);
  } catch(e) {
    document.getElementById("chapters").innerHTML = '<div class="loader">Gagal memuat chapter.</div>';
  }
}

function renderChapters(chapters) {
  if (!chapters.length) {
    document.getElementById("chapters").innerHTML = '<div class="loader">Tidak ada chapter.</div>';
    return;
  }
  var html = "";
  for (var i = 0; i < chapters.length; i++) {
    var c = chapters[i];
    var num = c.attributes.chapter || "?";
    var ttl = c.attributes.title ? " - " + c.attributes.title : "";
    html += '<div class="chapter-item" onclick="openReader(\'' + c.id + '\',\'Chapter ' + num + escHtml(ttl) + '\')">Chapter ' + num + escHtml(ttl) + '</div>';
  }
  document.getElementById("chapters").innerHTML = html;
}

async function openReader(chapterId, title) {
  document.getElementById("chapterTitle").textContent = title;
  document.getElementById("pages").innerHTML = '<div class="loader">Memuat halaman...</div>';
  show("readerSection");
  try {
    const res = await fetch(BASE + "/at-home/server/" + chapterId);
    const data = await res.json();
    var base = data.baseUrl;
    var hash = data.chapter.hash;
    var imgs = data.chapter.data;
    var html = "";
    for (var i = 0; i < imgs.length; i++) {
      var imgUrl = base + "/data/" + hash + "/" + imgs[i];
      html += '<img src="/imgproxy?url=' + encodeURIComponent(imgUrl) + '" loading="lazy" onerror="this.src=\'https://placehold.co/400x600?text=Error\'"/>';
    }
    document.getElementById("pages").innerHTML = html;
  } catch(e) {
    document.getElementById("pages").innerHTML = '<div class="loader">Gagal memuat halaman.</div>';
  }
}

document.getElementById("backToSearch").addEventListener("click", function() { show("results"); });
document.getElementById("backToChapters").addEventListener("click", function() { show("chapterList"); });

function show(section) {
  var ids = ["results","chapterList","readerSection"];
  for (var i = 0; i < ids.length; i++) {
    document.getElementById(ids[i]).classList.add("hidden");
  }
  document.getElementById(section).classList.remove("hidden");
}

function escHtml(str) {
  return str.replace(/'/g,"&#39;").replace(/"/g,"&quot;");
}
