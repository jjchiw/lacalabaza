import rssPlugin from "@11ty/eleventy-plugin-rss";
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import markdownItAnchor from "markdown-it-anchor";
import { alternates, postPairs, postFallbacks, postUrls } from "./src/_lib/posts.js";

const LOCALES = { en: "en-US", es: "es-MX" };

// "12 Oct 2026" for en, "12 oct 2026" for es. Built from parts so the
// separators and trailing dots don't depend on the ICU version.
function formatDate(date, lang = "en") {
  const parts = new Intl.DateTimeFormat(LOCALES[lang] || LOCALES.en, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).formatToParts(new Date(date));
  const pick = (type) => parts.find((p) => p.type === type).value;
  let month = pick("month").replace(/\.$/, "");
  if (lang === "es") month = month.toLowerCase();
  return `${pick("day")} ${month} ${pick("year")}`;
}

function stripTags(html) {
  return String(html || "")
    .replace(/<(script|style)[\s\S]*?<\/\1>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ");
}

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(rssPlugin);
  eleventyConfig.addPlugin(syntaxHighlight);

  eleventyConfig.amendLibrary("md", (md) =>
    md.use(markdownItAnchor, {
      level: [2],
      slugify: eleventyConfig.getFilter("slugify"),
    })
  );

  // A post with `draft: true` is left out of a build entirely (no page, no
  // collection, feed or pager entry) and kept when the site is served or watched.
  eleventyConfig.addPreprocessor("drafts", "*", (data, content) => {
    if (data.draft && process.env.ELEVENTY_RUN_MODE === "build") return false;
  });

  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/img");

  // Every post file, both languages, newest first.
  const posts = (api) =>
    api
      .getFilteredByGlob("src/posts/**/*.md")
      .sort((a, b) => b.date - a.date || a.inputPath.localeCompare(b.inputPath));
  eleventyConfig.addCollection("posts", posts);
  // One object per post: { key, year, date, en, es }, newest first. en and es are
  // collection items, or null when that language has no file.
  eleventyConfig.addCollection("postPairs", (api) => postPairs(posts(api)));
  // The pairs with one language missing: posts-fallback.njk paginates them to give
  // the missing language's URL the other language's content.
  eleventyConfig.addCollection("postFallbacks", (api) => postFallbacks(postPairs(posts(api))));

  eleventyConfig.addFilter("pairOf", (pairs, key) => pairs.find((p) => p.key === key) || null);
  // { older, newer } pairs around a key (the list is newest first).
  eleventyConfig.addFilter("neighbors", (pairs, key) => {
    const i = pairs.findIndex((p) => p.key === key);
    return { older: i >= 0 ? pairs[i + 1] || null : null, newer: i > 0 ? pairs[i - 1] : null };
  });
  eleventyConfig.addFilter("postUrls", postUrls);
  // The page's URL in each language: { en, es }.
  eleventyConfig.addFilter("altUrls", alternates);

  eleventyConfig.addFilter("dateFormat", formatDate);
  eleventyConfig.addFilter("isoDate", (date) =>
    new Date(date).toISOString().slice(0, 10)
  );

  eleventyConfig.addFilter("readingTime", (html, lang = "en") => {
    const words = stripTags(html).split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return lang === "es" ? `${minutes} min de lectura` : `${minutes} min read`;
  });

  // The h2 headings (id and text) of rendered HTML, for "On this page".
  eleventyConfig.addFilter("headings", (html) => {
    const found = [];
    const re = /<h2[^>]*\sid="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g;
    let m;
    while ((m = re.exec(String(html || "")))) {
      found.push({ id: m[1], text: stripTags(m[2]).replace(/\s+/g, " ").trim() });
    }
    return found;
  });

  // [{ year, posts }] in the order the posts arrive.
  eleventyConfig.addFilter("groupByYear", (items) => {
    const groups = [];
    for (const item of items) {
      const year = new Date(item.date).getUTCFullYear();
      let g = groups[groups.length - 1];
      if (!g || g.year !== year) {
        g = { year, posts: [] };
        groups.push(g);
      }
      g.posts.push(item);
    }
    return groups;
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    templateFormats: ["njk", "md", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
