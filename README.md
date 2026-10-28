# lacalabaza.xyz

A personal bilingual blog (every post in English and Spanish), built with
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

## Site structure

The site has two roots, one per language, with the same pages under each:

| English | Spanish |
| --- | --- |
| `/` | `/es/` |
| `/posts/` | `/es/posts/` |
| `/posts/<year>/<slug>/` | `/es/posts/<year>/<slug>/` |
| `/feed.xml` | `/es/feed.xml` |

`/privacy/`, `/terms/` and the 404 page are English only, linked from both footers. The header has an
`EN · ES` switch that goes to the same page in the other language (for these three pages it goes to the
page itself). The site's own words (About, Now, Replies...) live in `src/_data/t.js`, one block per
language; the About and Now texts are in `src/_data/site.js` as `{ en, es }`.

## Write a post

A post is a pair of Markdown files side by side, one per language, named
`src/posts/<year>/yyyy-mm-dd-<slug>.md` (English) and `src/posts/<year>/yyyy-mm-dd-<slug>.es.md`
(Spanish). The file name carries the date and the slug: `src/posts/2026/2026-10-19-hello-again.md` is
published on 19 Oct 2026 at `/posts/2026/hello-again/`, and its Spanish file
`2026-10-19-hello-again.es.md` at `/es/posts/2026/hello-again/`. Eleventy reads the date from the file
name, so the front matter has no `date:`. The year folders are only for tidiness: the URLs and the date
come from the file names alone. The two files of a pair share the folder year and the slug (and so the
date).

```markdown
---
layout: layouts/post.njk
title: The title
description: One sentence, shown under the title and in the lists.
tags:
  - meta
---
The text, in Markdown. Each `##` heading gets an anchor and an entry in "On this page".
```

- There is no `lang:`. The language is the file name: `.es.md` is Spanish, anything else English.
  Each file keeps its own `title`, `description` and `tags`.
- Both URLs always exist. If a post has only one file, the other language's URL shows that text
  with a line saying it isn't translated yet, and the language tabs under the title show "Español
  (pronto)" or "English (soon)" in grey instead of a link. Writing the missing file replaces the
  fallback; nothing else to change. The home, the lists and the feeds show the post in the page's
  language, or in the other one with a small `en`/`es` mark when that file is missing.
- `draft: true` (optional, per file) keeps that file out of the site. `npm run dev` shows it, marked
  "Draft" in the list and next to its title, so you can write it. `npm run build` leaves it out
  entirely: no page, and no entry in a list, feed or pager. In a build, a pair where one file is a
  draft behaves as if that file did not exist, so the other file's text is shown at both URLs until
  the draft is published. To publish it, remove that line (and rename the file if the date changed).
- `updated` (optional, a date) adds an "updated" note to the post's header.
- Avoid `{{` and `{%` in a post's text or code blocks: posts go through Nunjucks. Wrap such text in
  `{% raw %}...{% endraw %}`.
- `fediverse` (optional, a URL) turns on the replies under the post: the URL of the Hollo toot that
  announces it. Publish the post, post about it on Hollo, paste that toot's URL into `fediverse:`
  (for example `https://social.lacalabaza.xyz/@jjchiw/<status id>`), and push again. See "Hollo" below.
  Each file can have its own toot; a file without one uses its sibling's (the replies are fetched once
  per toot), so a single toot can serve both languages.
- Site-wide text and links (About, Now, Things I make, Elsewhere) live in `src/_data/site.js`. Fill in
  `x` there when the profile exists: until then that link is left out.

## Hollo

The site reads the fediverse account (`site.hollo`, `site.holloApi` and `site.holloHandle` in
`src/_data/site.js`) at build time, in Node. There is still no JavaScript in the browser.

- **Latest from Hollo** (home page, right column) shows the three newest top-level posts. It reads the
  account's public ActivityPub outbox (`src/_data/hollo.js`), so it needs no token. The text goes
  through `sanitize-html` with a small allowlist (paragraphs, links, emphasis, code, lists, quotes; no
  images or styles).
- **Replies** (under each post that sets `fediverse:`, or whose sibling language does) are the replies to that toot, read with the
  Mastodon API (`src/posts/posts.11tydata.js`). Hollo closes that API without a token, so this part
  needs `HOLLO_TOKEN`. Replies are sanitized the same way. Each toot is fetched once per build.
- `HOLLO_TOKEN` is optional. Without it the build still works: the latest posts appear, a post that
  sets `fediverse:` shows only its "Reply on Hollo" link, and the build log says
  `[hollo] HOLLO_TOKEN is not set: comments are not fetched` once. If Hollo is down, the build logs a
  `[hollo]` warning and leaves the sections out; it never fails.

Hollo has no token page in its dashboard; a token comes from the standard Mastodon OAuth flow, once:

```sh
H=https://social.lacalabaza.xyz
# 1. Register the blog as an application (answers with client_id and client_secret).
curl -s -X POST $H/api/v1/apps -d client_name=lacalabaza.xyz \
  -d redirect_uris=urn:ietf:wg:oauth:2.0:oob -d scopes=read
# 2. Open this in the browser, sign in to Hollo, approve, and copy the code it shows:
#    $H/oauth/authorize?response_type=code&client_id=<client_id>&redirect_uri=urn:ietf:wg:oauth:2.0:oob&scope=read
# 3. Trade the code for the token (answers with access_token).
curl -s -X POST $H/oauth/token -d grant_type=authorization_code -d code=<code> \
  -d client_id=<client_id> -d client_secret=<client_secret> \
  -d redirect_uri=urn:ietf:wg:oauth:2.0:oob -d scope=read
```

If Hollo refuses the `oob` redirect, use `https://lacalabaza.xyz/` as `redirect_uris` and
`redirect_uri` instead and read the `code` from the address bar after approving. Store the
`access_token` in Bella Baxter as `HOLLO_TOKEN` in the same environment as `CARAVANA_TOKEN`; the
workflow reads it from there and passes it to the image build as a BuildKit secret, so it is never
stored in an image layer.

The workflow also runs every 6 hours (`schedule` in `.github/workflows/deploy.yml`): it rebuilds and
deploys so new Hollo posts and replies appear. A reply shows up at most 6 hours later, and every
scheduled run is a deploy.

For a local build with comments:

```sh
HOLLO_TOKEN=... npm run build
```

Developer knob: `HOLLO_API` overrides `site.holloApi` (default `https://social.lacalabaza.xyz`), for
example to point the build at a fake server in a test.

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
2. **The token in Bella Baxter, not in GitHub.** The workflow is keyless: it has no repository
   secrets. In Bella Baxter (tenant `code4fun-17d1c3`), the project `lacalabaza` has an environment
   `production` with a provider attached; put the Caravana token there as the secret `CARAVANA_TOKEN`
   (and the optional `HOLLO_TOKEN`, see [Hollo](#hollo)). Then, on that environment's Identity tab,
   add a Trust Domain for GitHub Actions: issuer `https://token.actions.githubusercontent.com`, claim
   rules `repository` Equals `Cosmic-Chimps/lacalabaza` and `ref` Equals `refs/heads/main`, role
   Consumer, token TTL 15 minutes. A run from another repository or branch is refused with
   `exchange_failed`. The scheduled and manual runs also come from `main`, so they pass. The console's
   address (`https://caravana.lacalabaza.xyz`) is written in the workflow.
3. **DNS before the first deploy.** Point `lacalabaza.xyz` at the Caravana host first. Without it,
   Let's Encrypt can't issue the certificate. Never give this app the domain
   `caravana.lacalabaza.xyz`: that is the console's own domain.
4. **The image must be pullable.** After the first push the ghcr.io package is private. Either make it
   public (GitHub › Packages › lacalabaza › Package settings › Change visibility), or add ghcr.io
   credentials in Caravana's Settings › Registries.

After a successful deploy, a `prune` job keeps the newest 10 tagged image versions on ghcr.io and
deletes the rest, plus untagged versions older than a week that no kept image uses (each scheduled
rebuild of the same commit leaves one behind). `.github/scripts/prune-images.sh` does it; run it
locally with `DRY_RUN=1 OWNER=Cosmic-Chimps .github/scripts/prune-images.sh` to see what it would
delete (needs `gh`, `jq` and `docker buildx`).

`deploy/caravana-app.json` is the app's definition (one service `web`, nginx on port 80, the domain
`lacalabaza.xyz`, health check `/healthz`, 64 MB reserved and up to 128 MB). The action uses it only
when the app doesn't exist yet or has no definition, so changes made to the app in the Caravana
console are kept by later deploys; each deploy only swaps the image.
