export default {
  name: "lacalabaza",
  url: "https://lacalabaza.xyz",
  author: "jjchiw",
  repo: "https://github.com/Cosmic-Chimps/lacalabaza",
  contactEmail: "jjchiw@cosmic-chimps.com",
  // The fediverse profile URL, e.g. https://<host>/@jjchiw. Empty until it is known:
  // while empty, no Hollo link, no "Reply" link and no fediverse line are drawn.
  hollo: "",
  // The X profile URL. Empty until it is known.
  x: "",
  github: "https://github.com/Cosmic-Chimps",
  about:
    "I'm jjchiw. I write software for a living and run a small server on the side, which is where this site lives. Tech posts are in English, the rest in Spanish.",
  now: {
    text: "Building Caravana, learning Go from C#, and trying to write more often than once every thirteen years.",
    updated: "2026-10-19",
  },
  make: [
    { name: "Caravana", what: "a self-hosted PaaS on Nomad", url: "https://github.com/Cosmic-Chimps/caravana" },
    { name: "Umbral", what: "single sign-on for my own apps", url: "" },
  ],
  // The last year of the copyright line in the footer.
  year: new Date().getFullYear(),
};
