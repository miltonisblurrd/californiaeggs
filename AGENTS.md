<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## ui-sdk

Before using ui-sdk, follow the ui-sdk skill if it's installed, and read `node_modules/@ui-sdk/react/docs/llms.txt`. To build a new component, also search `node_modules/@ui-sdk/react/docs/core.md` by heading, and read `rendering.md` next to it.

Import each component from its own entry, such as `@ui-sdk/react/number-input`. There is no root import. Parts are unstyled. Style them with Tailwind using their `data-*` state attributes.

## This project

California Egg prototype for Colin Grundmeier. The build list is `/Users/blurrd/.cursor/projects/Users-blurrd-Desktop-caliEgg/canvases/california-egg-prototype-plan.canvas.tsx`. Every quantity is boxes (one box is 15 dozen). Sample data only: no QuickBooks, no logins, no database. Every action writes to the shared store so the cooler, route sheet, and dashboard stay in step.
