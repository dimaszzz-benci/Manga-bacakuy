const BASE = "/api";

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const results = document.getElementById("results");
const toggleTheme = document.getElementById("toggleTheme");

let currentMangaId = "";
let currentGenre = "";

const GENRES = [
  "Action","Adventure","Comedy","Drama","Fantasy","Horror",
  "Mystery","Romance","Sci-Fi","Slice of Life","Sports","Thriller",
  "Isekai","Supernatural","Psychological"
];

const GENRE_IDS = {
  "Action": "391b0423-d847-456f-aff0-8b0cfc03066b",
  "Adventure": "87cc87cd-a395-47af-b27a-93258283bbc6",
  "Comedy": "4d32cc48-9f00-4cca-9b5a-a839f0764984",
  "Drama": "b9af3a63-f058-46de-a9a0-e0c13906197a",
  "Fantasy": "cdc58593-87dd-415e-bbc0-2ec27bf404cc",
  "Horror": "cdad7e68-1419-41dd-bdce-27753074a640",
  "Mystery": "ee968100-4191-4968-93d3-f82d72be7e46",
  "Romance": "423e2eae-a7a2-4a8b-ac03-a8351462d71d",
  "Sci-Fi": "256c8bd9-4904-4360-bf4f-508a76d67183",
  "Slice of Life": "e5301a23-ebd9-49dd-a0cb-2add944c7fe9",
  "Sports": "69964a64-2f90-4d33-beeb-e3bddc604c4e",
  "Thriller": "07251805-a27e-4d59-b488-f0bfbec15168",
  "Isekai": "ace04997-f6bd-436e-b261-779182193d3d",
  "Supernatural": "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
  "Psychological": "3b60b75c-a2d7-4860-ab56-05f391bb889c"
};

// Render genre buttons
var genreTagsEl = document.getElementById("genreTags");
var allBtn = document.createElement("button");
allBtn.className = "genre-btn active";
allBtn.textContent = "Semua";
allBtn.onclick = function() {
  currentGenre = "";
  setActiveGenre(allBtn);
  loadHomePage();
};
genreTagsEl.appendChild(allBtn);

for (var i = 0; i < GENRES.length; i++) {
  (function(genre) {
    var btn = document.createElement("button");
    btn.className = "genre-btn";
    btn.textContent = genre;
    btn.onclick = function() {
      currentGenre = GENRE_IDS[genre];
      setActiveGenre(btn);
      loadByGenre(currentGenre);
    };
    genreTagsEl.appendChild(btn);
  })(GENRES[i]);
}

function setActiveGenre(activeBtn) {
  var btns = document.querySelectorAll(".genre-btn");
  for (var i = 0; i < btns.length; i++) btns[i].classList.remove("active");
  activeBtn.classList.add("active");
}

toggleTheme.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  document.body.classList.toggle("light");
  toggleTheme.textContent = document.body.classList.contains("dark") ? "☀️ Light" : "🌙 Dark";
});

searchBtn.addEventListener("click", searchManga);
searchInput.addEventListener("keydown", e => { if (e.key === "Enter") searchManga(); });
window.addEventListener("load", loadHomePage);

async function loadHomePage() {
  results.innerHTML = '<div class="loader">Memuat manga populer...</div>';
  show("results");
  try {
    const res = await fetch(BASE + "/manga?limit=18&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive&order[followedCount]=desc");
    const data = await res.json();
    renderCards(data.data || [], "🔥 Manga Populer");
  } catch(e) {
    results.innerHTML = '<div class="loader">Gagal memuat.</div>';
  }
}

async function loadByGenre(genreId) {
  results.innerHTML = '<div class="loader">Memuat manga...</div>';
  show("results");
  try {
    const res = await fetch(BASE + "/manga?limit=18&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive&order[followedCount]=desc&includedTags[]=" + genreId);
    const data = await res.json();
    renderCards(data.data || [], "📂 Genre");
  } catch(e) {
    results.innerHTML = '<div class="loader">Gagal memuat.</div>';
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
    renderCards(data.data || [], "🔍 Hasil: " + query);
  } catch(e) {
    results.innerHTML = '<div class="loader">Gagal memuat.</div>';
  }
}

function getGenreNames(manga) {
  var tags = manga.attributes.tags || [];
  var genres = [];
  for (var i = 0; i < tags.length; i++) {
    if (tags[i].attributes.group === "genre") {
      genres.push(tags[i].attributes.name.en || "");
    }
  }
  return genres.slice(0, 3);
}

function renderCards(mangas, label) {
  if (!mangas.length) {
    results.innerHTML = '<div class="loader">Manga tidak ditemukan.</div>';
    return;
  }
  var html = '<h2 class="section-title">' + label + '</h2><div class="card-grid">';
  for (var i = 0; i < mangas.length; i++) {
    var m = mangas[i];
    var title = m.attributes.title.en || Object.values(m.attributes.title)[0] || "No Title";
    var cover = getCover(m);
    var genres = getGenreNames(m);
    var genreHtml = "";
    for (var g = 0; g < genres.length; g++) {
      genreHtml += '<span class="genre-tag">' + genres[g] + '</span>';
    }
    html += '<div class="card" onclick="openManga(\'' + m.id + '\',\'' + escHtml(title) + '\',\'' + cover + '\')">';
    html += '<img src="' + cover + '" loading="lazy" onerror="this.src=\'https://placehold.co/140x210?text=No+Cover\'"/>';
    html += '<div class="card-info"><p class="card-title">' + escHtml(title) + '</p>';
    html += '<div class="genre-list">' + genreHtml + '</div></div></div>';
  }
  html += '</div>';
  results.innerHTML = html;
}

function getCover(manga) {
  var rel = null;
  for (var i = 0; i < manga.relationships.length; i++) {
    if (manga.relationships[i].type === "cover_art") { rel = manga.relationships[i]; break; }
  }
  if (!rel || !rel.attributes) return "https://placehold.co/140x210?text=No+Cover";
  var imgUrl = "https://uploads.mangadex.org/covers/" + manga.id + "/" + rel.attributes.fileName + ".256.jpg";
  return "/api/proxy?url=" + encodeURIComponent(imgUrl);
}

async function openManga(id, title, cover) {
  currentMangaId = id;
  document.getElementById("mangaTitle").textContent = title;
  document.getElementById("mangaCover").src = cover;
  document.getElementById("mangaDesc").textContent = "";
  document.getElementById("mangaGenres").innerHTML = "";
  document.getElementById("chapters").innerHTML = '<div class="loader">Memuat chapter...</div>';
  document.getElementById("recGrid").innerHTML = '<div class="loader">Memuat rekomendasi...</div>';
  show("chapterList");

  // Ambil detail manga
  try {
    const detRes = await fetch(BASE + "/manga/" + id + "?includes[]=cover_art");
    const detData = await detRes.json();
    var m = detData.data;
    var desc = m.attributes.description.id || m.attributes.description.en || Object.values(m.attributes.description || {})[0] || "Tidak ada deskripsi.";
    document.getElementById("mangaDesc").textContent = desc.substring(0, 200) + (desc.length > 200 ? "..." : "");
    var tags = m.attributes.tags || [];
    var genreHtml = "";
    for (var i = 0; i < tags.length; i++) {
      if (tags[i].attributes.group === "genre") {
        genreHtml += '<span class="genre-tag">' + (tags[i].attributes.name.en || "") + '</span>';
      }
    }
    document.getElementById("mangaGenres").innerHTML = genreHtml;

    // Load rekomendasi berdasarkan genre pertama
    var firstGenreTag = null;
    for (var i = 0; i < tags.length; i++) {
      if (tags[i].attributes.group === "genre") { firstGenreTag = tags[i].id; break; }
    }
    if (firstGenreTag) loadRecommendations(firstGenreTag, id);
    else document.getElementById("recGrid").innerHTML = "";
  } catch(e) {}

  // Ambil chapter - semua bahasa
  try {
    const res = await fetch(BASE + "/manga/" + id + "/feed?translatedLanguage[]=id&translatedLanguage[]=en&translatedLanguage[]=ja&translatedLanguage[]=zh&translatedLanguage[]=ko&order[chapter]=asc&limit=500");
    const data = await res.json();
    renderChapters(data.data || []);
  } catch(e) {
    document.getElementById("chapters").innerHTML = '<div class="loader">Gagal memuat chapter.</div>';
  }
}

async function loadRecommendations(genreId, excludeId) {
  try {
    const res = await fetch(BASE + "/manga?limit=6&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive&order[followedCount]=desc&includedTags[]=" + genreId);
    const data = await res.json();
    var mangas = (data.data || []).filter(function(m) { return m.id !== excludeId; });
    if (!mangas.length) { document.getElementById("recGrid").innerHTML = ""; return; }
    var html = "";
    for (var i = 0; i < mangas.length; i++) {
      var m = mangas[i];
      var title = m.attributes.title.en || Object.values(m.attributes.title)[0] || "No Title";
      var cover = getCover(m);
      html += '<div class="card" onclick="openManga(\'' + m.id + '\',\'' + escHtml(title) + '\',\'' + cover + '\')">';
      html += '<img src="' + cover + '" loading="lazy" onerror="this.src=\'https://placehold.co/140x210?text=No+Cover\'"/>';
      html += '<div class="card-info"><p class="card-title">' + escHtml(title) + '</p></div></div>';
    }
    document.getElementById("recGrid").innerHTML = html;
  } catch(e) {
    document.getElementById("recGrid").innerHTML = "";
  }
}

function renderChapters(chapters) {
  if (!chapters.length) {
    document.getElementById("chapters").innerHTML = '<div class="loader">Tidak ada chapter tersedia.</div>';
    return;
  }
  var seen = {};
  var filtered = [];
  for (var i = 0; i < chapters.length; i++) {
    var c = chapters[i];
    var num = c.attributes.chapter || "?";
    var lang = c.attributes.translatedLanguage || "";
    if (!seen[num]) {
      seen[num] = { chapter: c, lang: lang };
      filtered.push(c);
    } else if (lang === "id") {
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
    html += '<div class="chapter-item" onclick="openReader(\'' + c.id + '\',\'Chapter ' + num + escHtml(ttl) + '\')">';
    html += '<span>Chapter ' + num + escHtml(ttl) + '</span>';
    html += '<span class="lang-badge">' + lang.toUpperCase() + '</span></div>';
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
