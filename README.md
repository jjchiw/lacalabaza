# lacalabaza.xyz

A personal bilingual blog (English for tech, Spanish for the rest), built with
[Eleventy](https://www.11ty.dev/) 3. It builds into a small nginx image and deploys to
[Caravana](https://github.com/Cosmic-Chimps/caravana), a self-hosted PaaS, from GitHub Actions.
There is no JavaScript on the site.

## Run it

```sh
npm install
npm run dev
```

Open the address Eleventy prints (usually http://localhost:8080/). `npm run build` writes the site to
`_site/`.

## Write a post

Add a Markdown file to `src/posts/`. The file name is the URL: `src/posts/my-post.md` becomes
`/posts/my-post/`.

```markdown
---
layout: layouts/post.njk
title: The title
description: One sentence, shown under the title and in the lists.
date: 2026-10-19
lang: en
tags:
  - meta
---
The text, in Markdown. Each `##` heading gets an anchor and an entry in "On this page".
```

- `lang` is `en` or `es`. It sets the `lang` of the post, the date format, the reading time wording,
  the language lists (`/en/`, `/es/`) and the feeds (`/feed.xml`, `/en/feed.xml`, `/es/feed.xml`).
- `updated` (optional, a date) adds an "updated" note to the post's header.
- Avoid `{{` and `{%` in a post's text or code blocks: posts go through Nunjucks. Wrap such text in
  `{% raw %}...{% endraw %}`.
- Site-wide text and links (About, Now, Things I make, Elsewhere) live in `src/_data/site.js`. Fill in
  `hollo` and `x` there when the profiles exist: until then those links, the "Reply" link and the
  fediverse line are left out.

## Build the image locally

```sh
docker build -t lacalabaza .
docker run -p 8080:80 lacalabaza
curl -s localhost:8080/healthz   # ok
```

## Deploy: one-time setup

Every push to `main` runs `.github/workflows/deploy.yml`: build the image, push it to
`ghcr.io/cosmic-chimps/lacalabaza`, and ask Caravana to deploy that exact digest.

1. **A token in Caravana.** Settings › API tokens › "Only for one app", project `default`, app
   `lacalabaza`. Or use New app › "From a GitHub repository", which makes the token too.
2. **A GitHub secret.** In this repository's settings add the secret `CARAVANA_TOKEN`. The console's
   address (`https://caravana.lacalabaza.xyz`) is written in the workflow, so no variable is needed.
3. **DNS before the first deploy.** Point `lacalabaza.xyz` at the Caravana host first. Without it,
   Let's Encrypt can't issue the certificate. Never give this app the domain
   `caravana.lacalabaza.xyz`: that is the console's own domain.
4. **The image must be pullable.** After the first push the ghcr.io package is private. Either make it
   public (GitHub › Packages › lacalabaza › Package settings › Change visibility), or add ghcr.io
   credentials in Caravana's Settings › Registries.

`deploy/caravana-app.json` is the app's definition (one service `web`, nginx on port 80, the domain
`lacalabaza.xyz`, health check `/healthz`, 64 MB reserved and up to 128 MB). The action uses it only
when the app doesn't exist yet or has no definition, so changes made to the app in the Caravana
console are kept by later deploys; each deploy only swaps the image.
