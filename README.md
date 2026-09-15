# Bob Randolph Archive — prototype

A first working build of the Bob Randolph poetry archive, made to give a concrete
direction to react to. Plain HTML/CSS/JS, no build step — works as GitHub Pages
straight out of the box.

## What's here

- `index.html` — home page, sets out the full vision (text, audio/video, print, translation)
- `about.html` — Bob's biography
- `chapbooks/index.html` — the browse-by-chapbook spine
- `chapbooks/yokohama-rickshaw-boy/` — the first chapbook, with 5 fully built poem pages
  (real transcription + original scan toggle + language-switcher scaffold + audio/video
  placeholders)
- `master-index.html` — searchable/sortable table of Bob's 1,775-poem master index
- `data/master-index.json` — the data behind that table
- `assets/css/app.css`, `assets/js/app.js` — shared styling and behavior

## How to add a poem

1. Copy an existing file under `chapbooks/<chapbook>/poems/` as a template.
2. Swap in the title, date, and poem text (line breaks are preserved as written).
3. Drop the scanned page image into `assets/img/<chapbook>/` and point the
   `<img src>` at it.
4. Add a line to the chapbook's `index.html` poem list, linking to the new page.

## How to add a chapbook

Copy the `chapbooks/yokohama-rickshaw-boy/` folder as a starting structure, and add
a card for it on `chapbooks/index.html`.

## Publishing to GitHub Pages

Push this folder to the root of a repo (or `/docs`), turn on Pages in the repo's
Settings, and it's live — no build step, no dependencies.

## Not yet built

Audio players, video embeds, and populated translations are all scaffolded in the
markup (see any poem page) but not wired to real files yet. The master index has
some known gaps (truncated titles, an unnumbered run, a few illegible titles) —
see the note on `master-index.html`.
