# Shisen-Sho PWA

A React + TypeScript Progressive Web App implementation of a Shisen-Sho tile-matching game.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Gameplay

- Select two matching tiles.
- A match is valid when a path can connect them with at most 2 turns.
- Clearing all tiles wins the board.
- If no moves remain, use **Shuffle**.

## Assets

This project uses the Hong Kong SVG tiles from `samoheen/mahjong-tiles`, which are licensed under CC0 1.0 (public domain).

## PWA

The app is configured with `vite-plugin-pwa` and auto-registers its service worker.
