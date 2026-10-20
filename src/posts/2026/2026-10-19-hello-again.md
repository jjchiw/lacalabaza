---
layout: layouts/post.njk
title: Hello again
description: The site is back after thirteen years, built with Eleventy and hosted on my own server.
lang: en
tags:
  - meta
---
This site is back. The old version went up in 2013 and then went quiet for a long time. This one is small on purpose: static pages, no scripts, no tracking.

Posts about technology will be in English. Everything else will be in Spanish. Each post says which language it is in, and the home page can filter by language.

## How it is built

The pages are generated with [Eleventy](https://www.11ty.dev/) from Markdown files. A GitHub Action builds a small nginx image from the result and pushes it to the GitHub container registry. Then it asks [Caravana](https://github.com/Cosmic-Chimps/caravana), a self-hosted PaaS I am building on Nomad, to deploy that exact image on my own server.

The whole image is only the generated files and one nginx config:

```dockerfile
FROM nginx:1.29-alpine
COPY _site /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

Writing a post means adding a Markdown file and pushing to `main`. A minute or two later it is live, and the previous version stays one rollback away in Caravana.

I do not know yet how often I will write. The goal is more often than once every thirteen years.
