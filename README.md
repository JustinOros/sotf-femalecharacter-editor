# sotf-femalecharacter-editor

A web page for tweaking the women in [sotf-femalecharacter](https://github.com/JustinOros/sotf-femalecharacter) without installing anything.

Open the page, pick a woman and an outfit, and change:

- Skin tone, hair color and eye color for each woman
- The color of every clothing piece, or switch a piece to its original colors or camo
- The fit of every clothing piece (tighter or looser)
- The layer of every clothing piece (0 to 99). Where two pieces overlap, the higher layer goes on top, for example boots at 40 over pants at 20 tucks the pants into the boots. Layers are applied when the models are rebuilt, so the preview does not show them.

Changes are kept in your browser while you work. Click **Export changes (zip)** to download `femalecharacter-settings.zip` and send it back. **Import zip** loads a zip you exported earlier so you can keep editing.

Outfit colors and fit are shared by all 8 women. Skin, hair and eyes are per woman.

## Applying the changes

The zip contains `woman0.json` to `woman7.json` and `outfits.json`, the same files as `tools/` in sotf-femalecharacter. Copy them into `tools/`, regenerate the models with `tools/build_woman.py`, and rebuild the bundle.

## Files

- `index.html`, `editor.js`: the page
- `assets/`: the women as glTF with grayscale clothing textures that the page colors live
- `settings/`: the current settings the page starts from
- `vendor/`: three.js 0.160.0 (MIT) and JSZip 3.10.1 (MIT or GPLv3)

The models are made with MakeHuman and MakeHuman community assets (CC0 and CC-BY).
