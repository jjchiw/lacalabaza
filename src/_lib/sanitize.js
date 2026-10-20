import sanitizeHtml from "sanitize-html";

// Text from the fediverse is untrusted HTML. Only this small set of tags
// survives: no images, no styles, no classes, no scripts.
const options = {
  allowedTags: ["p", "br", "a", "em", "strong", "b", "i", "code", "pre", "ul", "ol", "li", "blockquote", "span"],
  allowedAttributes: { a: ["href", "rel"] },
  allowedSchemes: ["http", "https", "mailto"],
  allowProtocolRelative: false,
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "nofollow noopener" }),
  },
};

export function cleanHtml(html) {
  return sanitizeHtml(String(html || ""), options);
}
