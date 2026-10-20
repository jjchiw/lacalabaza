FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY eleventy.config.js ./
COPY src ./src
# The optional Hollo token is a BuildKit secret: it is mounted for this one command and
# never lands in a layer. Without it (a local build) the site just has no comments.
RUN --mount=type=secret,id=hollo_token HOLLO_TOKEN="$(cat /run/secrets/hollo_token 2>/dev/null || true)" npm run build

FROM nginx:1.30-alpine
RUN apk upgrade --no-cache
COPY --from=build /app/_site /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80