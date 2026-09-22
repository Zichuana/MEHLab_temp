# Publication cover images

One cover image per paper. They appear in the publications list
thumbnail (`pub-thumb-frame` / Cover).

Name each file after the publication `id`:

```
img/journals/liu-2026-isme-journal.jpg
img/journals/gao-2025-environmental-science-technology.jpg
```

Supported formats: `.jpg`, `.jpeg`, `.png`, `.webp`.

In the paper JSON:

```json
"image": "img/journals/<id>.jpg"
```

If the file is missing, the page keeps showing the Cover placeholder.
