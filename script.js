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

// Load popular manga di halaman utama
window.addEventListener("load", loadHomePage);

async function loadHomePage() {
  results.innerHTML = '<div class="loader">Memuat manga populer...</div>';
  show("results");
  try {
    const res = await fetch(BASE + "/manga?limit=18&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive&order[followedCount]=desc");
    const data = await res.json();
    renderCards(data.data || [], true);
  } catch(e) {
    results.innerHTML = '<div class="loader">Gagal memuat. Coba lagi.</div>';
  }
}

async function searchManga() {
  const query = searchInput.value.trim();
  if (!query) return;
  results.innerHTML = '<div class="loader">Mencari manga...</div>';
  show("results");
  try {
    const res = await fetch(BASE + "/manga?title=" + encodeURIComponent(query) + "&limit=20&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive");
    const data = await res.json();
    renderCards(data.data || [], false);
  } catch(e) {
    results.innerHTML = '<div class="loader">Gagal memuat. Coba lagi.</div>';
  }
}

function getGenres(manga) {
  var tags = manga.attributes.tags || [];
  var genres = [];
  for (var i = 0; i < tags.length; i++) {
    if (tags[i].attributes.group === "genre") {
      genres.push(tags[i].attributes.name.en || "");
    }
  }
  return genres.slice(0, 3);
}

function renderCards(mangas, isHome) {
  if (!mangas.length) {
    results.innerHTML = '<div class="loader">Manga tidak ditemukan.</div>';
    return;
  }
  var label = isHome ? '<h2 class="section-title">🔥 Manga Populer</h2>' : '<h2 class="section-title">🔍 Hasil Pencarian</h2>';
  var html = label + '<div class="card-grid">';
  for (var i = 0; i < mangas.length; i++) {
    var m = mangas[i];
    var title = m.attributes.title.en || Object.values(m.attributes.title)[0] || "No Title";
    var cover = getCover(m);
    var genres = getGenres(m);
    var genreHtml = "";
    for (var g = 0; g < genres.length; g++) {
      genreHtml += '<span class="genre-tag">' + genres[g] + '</span>';
    }
    var desc = m.attributes.description.en || Object.values(m.attributes.description || {})[0] || "";
    desc = desc.substring(0, 80) + (desc.length > 80 ? "..." : "");
    html += '<div class="card" onclick="openManga(\'' + m.id + '\',\'' + escHtml(title) + '\',\'' + cover + '\')">';
    html += '<img src="' + cover + '" loading="lazy" onerror="this.src=\'https://placehold.co/130x190?text=No+Cover\'"/>';
    html += '<div class="card-info">';
    html += '<p class="card-title">' + escHtml(title) + '</p>';
    html += '<div class="genre-list">' + genreHtml + '</div>';
    html += '</div></div>';
  }
  html += '</div>';
  results.innerHTML = html;
}

function getCover(manga) {
  var rel = null;
  for (var i = 0; i < manga.relationships.length; i++) {
    if (manga.relationships[i].type === "cover_art") { rel = manga.relationships[i]; break; }
  }
  if (!rel) return "https://placehold.co/130x190?text=No+Cover";
  var imgUrl = "https://uploads.mangadex.org/covers/" + manga.id + "/" + rel.attributes.fileName + ".256.jpg";
  return "/api/proxy?url=" + encodeURIComponent(imgUrl);
}

async function openManga(id, title, cover) {
  currentMangaId = id;
  document.getElementById("mangaTitle").textContent = title;
  document.getElementById("mangaCover").src = cover;
  document.getElementById("chapters").innerHTML = '<div class="loader">Memuat chapter...</div>';
  show("chapterList");
  try {
    // Ambil semua bahasa sekaligus
    const res = await fetch(BASE + "/manga/" + id + "/feed?translatedLanguage[]=en&translatedLanguage[]=id&translatedLanguage[]=ja&order[chapter]=asc&limit=500");
    const data = await res.json();
    renderChapters(data.data || []);
  } catch(e) {
    document.getElementById("chapters").innerHTML = '<div class="loader">Gagal memuat chapter.</div>';
  }
}

function renderChapters(chapters) {
  if (!chapters.length) {
    document.getElementById("chapters").innerHTML = '<div class="loader">Tidak ada chapter tersedia.</div>';
    return;
  }
  // Hapus duplikat chapter, prioritas EN > ID > lainnya
  var seen = {};
  var filtered = [];
  for (var i = 0; i < chapters.length; i++) {
    var c = chapters[i];
    var num = c.attributes.chapter || "?";
    var lang = c.attributes.translatedLanguage || "";
    if (!seen[num]) {
      seen[num] = true;
      filtered.push(c);
    } else if (lang === "en" || lang === "id") {
      // Ganti dengan versi EN/ID kalau ada
      for (var j = 0; j < filtered.length; j++) {
        if ((filtered[j].attributes.chapter || "?") === num) {
          filtered[j] = c;
          break;
        }
      }
    }
  }
  var html = '<p class="chapter-count">' + filtered.length + ' Chapter tersedia</p>';
  for (var i = 0; i < filtered.length; i++) {
    var c = filtered[i];
    var num = c.attributes.chapter || "?";
    var ttl = c.attributes.title ? " - " + c.attributes.title : "";
    var lang = c.attributes.translatedLanguage || "";
    var langBadge = '<span class="lang-badge">' + lang.toUpperCase() + '</span>';
    html += '<div class="chapter-item" onclick="openReader(\'' + c.id + '\',\'Chapter ' + num + escHtml(ttl) + '\')">';
    html += 'Chapter ' + num + escHtml(ttl) + langBadge + '</div>';
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
      html += '<img src="/api/proxy?url=' + encodeURIComponent(imgUrl) + '" loading="lazy" onerror="this.src=\'https://placehold.co/400x600?text=Gagal+Load\'"/>';
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
  return String(str).replace(/'/g,"&#39;").replace(/"/g,"&quot;");
    }
