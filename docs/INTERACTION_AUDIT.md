# Interaction comparison — 2026-10-22

Compared the public [homepage](https://codem8.dev/), [blog](https://codem8.dev/blog/), [portfolio](https://codem8.dev/portfolio/), [authoring reference](https://codem8.dev/blog/l/authoring-reference/), theme picker, search dialog, and browser terminal. This records observable behavior; it does not imply access to the original private source.

| Area | Gap found and change | Verification |
| --- | --- | --- |
| Branding | Renamed visible text, metadata, default Pages domain, package name, terminal identity, and home-project slug to mlii01. | Generated-page checks, browser titles, search and project navigation. |
| Existing browser data | Changing storage keys would lose access to old settings and virtual files. Added fallback and migration, preserving file contents and old keys. | Migration tests, existing browser preferences and game records restored. Applies within the same origin. |
| Homepage ASCII | Replaced the approximate field with the reference's eight simulations and matching canvas pipeline: letter mask and distance field, glyph atlas, complementary gradients, pointer disturbance and noisy boundary. | All eight engines match 60-frame reference output hashes, including pointer entry/exit. Desktop canvas and mouse response compared visually; responsive dimensions match the reference. |
| Mobile navigation | Opening another overlay could leave the menu open. Search/terminal now close it; outside clicks dismiss it. | 390px viewport interaction. |
| Search / terminal | Dialog switching could return focus to the wrong trigger. Closing callbacks now respect the other open dialog. | Ctrl+K / Ctrl+J switches and focused input, empty results, Enter navigation. |
| Theme / fonts | Light palettes other than Light did not drive code/diagram colors; Mermaid stayed on its initial palette. Added a shared light/dark mode and diagram redraw. | Nord/Dark changes, navigation persistence, SVG regeneration. |
| Blog table | Dates were plain text, whereas the reference links them to posts. Added article links. | Browser inspection and generated-link checks. |
| Article navigation | Retained the repaired on-page TOC and added heading permalinks. | Desktop and mobile anchors, scroll highlighting, reload, generated H2/H3 link checks. |
| Code walkthroughs | Only previous/next controls existed. Added direct numbered steps and Arrow/Home/End keyboard controls. | First/last boundaries, direct step 3, Home, narrow layout. |
| Article widgets | Retained counter, notes, disclosures, tab keyboard navigation, code copy/folding, and Svelte islands. Added a working click-to-load YouTube example and click-to-load sandbox support. | Tab and step keyboard checks; video placeholder creates its iframe only after a click. |
| Terminal fonts | The original distinguishes body and terminal fonts. Added `font`, `font body inter`, `font term hack`, and plain font-id forms. | Command tests and live body-font change. |
| Terminal completion | Empty arguments completed from the parent instead of the working directory. Fixed cwd completion. | Directory and file completion regression test. |
| Adventure | A small button demo lacked the original typed exploration. Replaced it with commands, site rooms, article/project passages, inventory, inspection, blueprint collection, map, escape and real-page navigation. | Command tests and browser exploration/open. |
| Arcade | Wordle lacked colored keyboard feedback and a streak; keyboard events could intercept game buttons. Added those features, proper initial focus, and automatic train completion. | Scoring/keyboard/streak tests, restored guesses and keyboard Enter on Exit. |
| GitHub Pages | Renamed routes and localized navigation must retain a repository prefix. | Root and `/mlii/` builds; all 26 pages, assets, language-specific search, raw Markdown, RSS and sitemap checked. |
| Languages | Added i18next dictionaries, English and Simplified Chinese static routes, saved preference and a page-preserving switcher. | Checked translated search, terminal navigation, section fragments across languages, matching heading IDs, hreflang and locale-aware widgets. |

The terminal filesystem/editor, project filters, blog sorting, category links, copy actions, Snake, and existing widgets were also checked during this implementation's browser validation. See [VALIDATION.md](VALIDATION.md) for the complete accumulated record.

The content remains editable local Markdown/MDX with original sample prose. The visual algorithms, game dictionaries, and code-step transitions are independent implementations; code steps use fade/slide transitions rather than the original character animation. Gist opens its source link, and external embed playback depends on the provider. Resume retains the reference site's “Coming soon” behavior. GitHub deployment has not been run remotely.
