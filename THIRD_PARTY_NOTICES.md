# Third-party notices

This project independently recreates the public layout and interaction concepts observed at [codem8.dev](https://codem8.dev/). It does not include that site's compiled JavaScript or CSS, private source repository, or personal biography. Example articles were written for this implementation.

The ASCII simulation and renderer were reimplemented in readable TypeScript by studying the public [AsciiHero module](https://codem8.dev/_astro/AsciiHero.DGqeTpcl.js) served by codem8.dev. Its eight simulation modes, numeric parameters and rendering behavior are credited to that reference. Frozen numeric output hashes are included for regression checks; the downloaded compiled module is not part of the source distribution.

Framework and library licenses are supplied with their npm packages. `package-lock.json` records the resolved versions.

- Astro, Svelte, Tailwind CSS, DaisyUI and the other dependencies retain their respective upstream licenses.
- Inter, JetBrains Mono and Fira Code are distributed through their Fontsource packages, which include the font license files.
- The bundled Hack, MesloLGS and Iosevka Nerd Font WOFF2 files in `public/fonts/` were obtained from the reference site's public font URLs to match the available font choices. They originate from [Nerd Fonts](https://github.com/ryanoasis/nerd-fonts). Their upstream license texts are included in `public/fonts/licenses/`; the Nerd Fonts glyphs and each base font retain their own licenses.

No ownership of third-party fonts or the original site's branding is claimed. The application brand used in this project is mlii01.
