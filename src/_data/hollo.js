import site from "./site.js";
import { cleanHtml } from "../_lib/sanitize.js";

// The latest posts of the fediverse account, read at build time from its public
// ActivityPub outbox (no token needed). A failure never fails the build: the
// home page just leaves the section out.
const LIMIT = 3;
const TIMEOUT_MS = 10000;

async function getJson(url) {
  const res = await fetch(url, {
    headers: { Accept: "application/activity+json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`${url} answered ${res.status}`);
  return res.json();
}

export default async function () {
  try {
    const outbox = await getJson(`${site.hollo}/outbox`);
    const first = outbox.first;
    const page = typeof first === "string" ? await getJson(first) : first;
    if (!page || !Array.isArray(page.orderedItems)) {
      throw new Error("the outbox has no orderedItems");
    }
    return page.orderedItems
      .filter((a) => a && a.type === "Create" && a.object && a.object.type === "Note" && !a.object.inReplyTo)
      .map((a) => a.object)
      .filter((n) => typeof n.url === "string" && typeof n.content === "string" && !Number.isNaN(Date.parse(n.published)))
      .sort((a, b) => Date.parse(b.published) - Date.parse(a.published))
      .slice(0, LIMIT)
      .map((n) => ({
        url: n.url,
        published: new Date(n.published).toISOString(),
        content: cleanHtml(n.content),
      }));
  } catch (err) {
    console.warn(`[hollo] could not read the latest posts: ${err.message}`);
    return [];
  }
}
