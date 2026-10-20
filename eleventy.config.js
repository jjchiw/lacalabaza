import rssPlugin from "@11ty/eleventy-plugin-rss";
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import markdownItAnchor from "markdown-it-anchor";

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

  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/img");

  // Posts, newest first. Templates reverse the order where they need to.
  const posts = (api) =>
    api
      .getFilteredByGlob("src/posts/*.md")
      .sort((a, b) => b.date - a.date || a.inputPath.localeCompare(b.inputPath));
  eleventyConfig.addCollection("posts", posts);
  eleventyConfig.addCollection("postsEn", (api) =>
    posts(api).filter((p) => p.data.lang === "en")
  );
  eleventyConfig.addCollection("postsEs", (api) =>
    posts(api).filter((p) => p.data.lang === "es")
  );

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
