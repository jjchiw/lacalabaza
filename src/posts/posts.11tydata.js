import site from "../_data/site.js";
import { cleanHtml } from "../_lib/sanitize.js";

// Replies to the toot named in a post's `fediverse` front matter, read at build
// time with a read-only Hollo token. Without the token, or on any error, a post
// simply has no comments: the build never fails because of Hollo.
const TIMEOUT_MS = 10000;

// status id -> promise of the comments, so a status is fetched once per build.
const fetched = new Map();
let warnedNoToken = false;

function statusId(url) {
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  return parts[parts.length - 1];
}

async function fetchComments(id, token) {
  const res = await fetch(`${site.holloApi}/api/v1/statuses/${encodeURIComponent(id)}/context`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`the context of ${id} answered ${res.status}`);
  const body = await res.json();
  if (!body || !Array.isArray(body.descendants)) throw new Error(`the context of ${id} has no descendants`);
  return body.descendants
    .filter((s) => s && typeof s.url === "string" && !Number.isNaN(Date.parse(s.created_at)))
    .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
    .map((s) => {
      const account = s.account || {};
      return {
        url: s.url,
        createdAt: new Date(s.created_at).toISOString(),
        content: cleanHtml(s.content),
        author: {
          name: account.display_name || account.acct || "unknown",
          acct: account.acct || "",
          url: account.url || "",
          avatar: account.avatar_static || "",
        },
      };
    });
}

export default {
  eleventyComputed: {
    comments: async (data) => {
      if (!data.fediverse) return [];
      const token = process.env.HOLLO_TOKEN;
      if (!token) {
        if (!warnedNoToken) {
          warnedNoToken = true;
          console.warn("[hollo] HOLLO_TOKEN is not set: comments are not fetched");
        }
        return [];
      }
      try {
        const id = statusId(data.fediverse);
        if (!fetched.has(id)) fetched.set(id, fetchComments(id, token));
        return await fetched.get(id);
      } catch (err) {
        console.warn(`[hollo] could not read replies for ${data.page.inputPath}: ${err.message}`);
        return [];
      }
    },
  },
};
