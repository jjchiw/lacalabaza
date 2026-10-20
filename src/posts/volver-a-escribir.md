---
layout: layouts/post.njk
title: Volver a escribir, trece años después
description: Lo que quedó del sitio de 2013.
date: 2026-10-19
lang: es
tags:
  - personal
---
Este sitio vuelve. La versión vieja es de 2013 y después se quedó en silencio durante mucho tiempo. Esta es pequeña a propósito: páginas estáticas, sin scripts y sin rastreo.

Lo técnico lo voy a escribir en inglés. Todo lo demás, en español, que es como pienso. Cada entrada dice en qué idioma está, y la página principal permite filtrar por idioma.

El sitio se genera con Eleventy a partir de archivos Markdown. Una acción de GitHub construye una imagen pequeña de nginx y la sube al registro de contenedores de GitHub. Después le pide a Caravana, un PaaS propio que estoy construyendo sobre Nomad, que despliegue esa imagen en mi propio servidor.

Escribir una entrada es agregar un archivo Markdown y hacer push a `main`. Un par de minutos después está publicada, y la versión anterior queda a un paso en Caravana si algo sale mal.

No sé todavía con qué frecuencia voy a escribir. La meta es hacerlo más seguido que una vez cada trece años.
