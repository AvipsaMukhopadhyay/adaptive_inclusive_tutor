# Read-aloud (add-on)

Adds a **🔊 Read aloud** button to the bottom-right of every page. Pressing it reads all visible text on
the screen line by line, using the browser's built-in voice:

- the line being read gets an outline, the sentence a yellow highlight, and the current word a darker one
- the page scrolls to follow the reading
- controls: **Back** / **Pause** / **Next**, speed **Slow / Normal / Fast** (remembered), **Stop** (or Esc)
- while reading, tap any line of text to read from there
- it starts from the top of the page, and stops when you go to another page
- emoji and arrows are skipped instead of being read out ("owl", "rightwards arrow")

It works for every student and on every page (login, sign-up, dashboard, lesson, practice, tutor chat).

## How it is linked to the app

Everything lives in this folder. The app's own code is unchanged except **one line** in
`frontend/src/main.jsx`:

```js
import './read-aloud/index.js'
```

The add-on only reads the page; it never edits React's elements (highlights use the CSS Custom
Highlight API, the outline is one CSS class it adds and removes).

| File | What it does |
|---|---|
| `index.js` | Finds the visible lines, speaks them one sentence at a time, highlights, controls |
| `read-aloud.css` | The floating button, control panel and highlight colours |

## Turning it off / going back to the previous version

1. Delete the `import './read-aloud/index.js'` line from `frontend/src/main.jsx`.
2. Optionally delete this `read-aloud` folder.
3. Rebuild: run `start.bat -Rebuild` from the project folder (or `npm run dev` in `frontend` for development).

## Browser support

Speech needs `speechSynthesis` (Chrome, Edge, Firefox, Safari). If the browser has none, the button is not
shown. Word/sentence highlighting needs the CSS Custom Highlight API (Chrome/Edge 105+, Safari 17.2+,
Firefox 140+); older browsers still get the line outline.
