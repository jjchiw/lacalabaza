// Helpers shared by the Eleventy config and the posts' data file.
// A post is a pair of files: yyyy-mm-dd-slug.en.md (English; the bare
// yyyy-mm-dd-slug.md is English too) and yyyy-mm-dd-slug.es.md (Spanish).
// Both languages always have a URL.

export function langOf(inputPath) {
  return String(inputPath).endsWith(".es.md") ? "es" : "en";
}

// "./src/posts/2026/2026-10-20-first.es.md" -> "first"
// Derived from the path on purpose: page.fileSlug would keep ".es" or ".en".
export function slugOf(inputPath) {
  const file = String(inputPath).split("/").pop();
  return file
    .replace(/\.md$/, "")
    .replace(/\.(en|es)$/, "")
    .replace(/^\d{4}-\d{2}-\d{2}-/, "");
}

// The pair key is "<year>/<slug>".
export function pairKeyOf(year, inputPath) {
  return `${year}/${slugOf(inputPath)}`;
}

export function postUrl(key, lang) {
  return lang === "es" ? `/es/posts/${key}/` : `/posts/${key}/`;
}

export function postUrls(key) {
  return { en: postUrl(key, "en"), es: postUrl(key, "es") };
}

// The same page in each language. The one place that knows how pages pair up.
// Pages without a translation (privacy, terms, 404) point at themselves.
export function alternates(url, pairKey) {
  if (pairKey) return postUrls(pairKey);
  if (url === "/" || url === "/es/") return { en: "/", es: "/es/" };
  if (url === "/posts/" || url === "/es/posts/") return { en: "/posts/", es: "/es/posts/" };
  return { en: url, es: url };
}

// One object per pair, newest first: { key, year, date, en, es }.
// en and es are collection items or null.
export function postPairs(posts) {
  const byKey = new Map();
  for (const item of posts) {
    const key = item.data.pairKey;
    let pair = byKey.get(key);
    if (!pair) {
      pair = { key, year: Number(key.split("/")[0]), date: item.date, en: null, es: null };
      byKey.set(key, pair);
    }
    const lang = item.data.lang;
    pair[lang] = item;
    // The English file's date names the pair when both exist.
    if (lang === "en") pair.date = item.date;
  }
  return [...byKey.values()].sort((a, b) => b.date - a.date || a.key.localeCompare(b.key));
}

// The pairs with one language missing, with what to show at the missing URL.
export function postFallbacks(pairs) {
  return pairs
    .filter((p) => !p.en || !p.es)
    .map((p) => {
      const missing = p.en ? "es" : "en";
      const shown = p.en ? "en" : "es";
      return { ...p, missing, shown, url: postUrl(p.key, missing) };
    });
}
