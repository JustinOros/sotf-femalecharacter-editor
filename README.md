# sotf-femalecharacter-editor

A web page for tweaking the women in [sotf-femalecharacter](https://github.com/JustinOros/sotf-femalecharacter) without installing anything.

**Live site: https://justinoros.github.io/sotf-femalecharacter-editor/**

Open the page, pick a woman and an outfit, and change:

- Skin tone, hair color and eye color for each woman
- The color of every clothing piece, or switch a piece to its original colors or camo
- The fit of every clothing piece (tighter or looser)
- The layer of every clothing piece (0 to 99). Where two pieces overlap, the higher layer goes on top, for example boots at 40 over pants at 20 tucks the pants into the boots. The preview shows the result live.

## Per-woman outfits

Every woman has her own outfit set. The color, look, fit and layer of every piece in every outfit are stored separately for each of the 8 women, so changing Woman3's tactical outfit does not touch Woman0's. Pick a woman at the top and the outfit list, pieces and settings switch to hers.

The page starts from the current settings of the mod, where each `womanN.json` names its outfits file (for example `outfits_whitewoman.json`). Two women can start from the same file, but once loaded each one has an independent copy.

A piece that is in the mod but not in the preview models yet is still listed, with a note. Its settings are kept and exported.

## Saving

Changes are kept in your browser while you work. Click **Export changes (zip)** to download `femalecharacter-settings.zip` and send it back. **Import zip** loads a zip you exported earlier so you can keep editing.

The zip contains:

- `woman0.json` to `woman7.json`, each pointing to its own outfits file
- `outfits_woman0.json` to `outfits_woman7.json`, one outfit set per woman

Import also accepts the old format, a zip with `woman0.json` to `woman7.json` and one shared `outfits.json`. That one outfit set is applied to all 8 women, and from then on each woman can be changed on her own.

**Reset everything** puts all women and all outfits back to the settings the page started from.

Browser storage from the older version of the page (shared outfits) is not carried over. To bring old work in, export the old zip and use **Import zip**.

## Applying the changes

Copy all 16 outfit and woman files from the zip into `tools/` in sotf-femalecharacter. Each `woman0.json` to `woman7.json` already has `"outfits": "outfits_womanN.json"`, and `tools/build_woman.py` reads the outfits file named there, so no script change is needed. Regenerate the models with `tools/build_woman.py` and rebuild the bundle.

## Files

- `index.html`, `editor.js`: the page
- `assets/`: the women as glTF with grayscale clothing textures that the page colors live
- `settings/`: the current settings the page starts from, copied from `tools/` in sotf-femalecharacter
- `vendor/`: three.js 0.160.0 (MIT) and JSZip 3.10.1 (MIT or GPLv3)

The models are made with MakeHuman and MakeHuman community assets (CC0 and CC-BY).
