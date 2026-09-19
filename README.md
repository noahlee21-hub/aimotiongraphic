# N — Motion Study

A 20.455-second looping, square motion graphic featuring only the uppercase **N**. No personal name or separate brand wordmark.

## Run

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open http://127.0.0.1:8000. Serve over HTTP for WebGL texture loading.

## Editorial structure

- 0–5.60: close crops of illustrated plates, accelerating cuts and slow camera movement.
- 5.60–13.90: rapid N match cuts through cartography, floral wallpaper, manuscript, coins, stamps, blueprint, geometry, natural specimens and procedural scientific patterns. Different colors, densities and treatments; no repeated scatter-and-reassemble transition.
- 13.90–14.7333: botanical N holds, with falling petals.
- 14.7333–16.1667: the butterflies forming N disperse toward the viewer. Oversized wings and blur cover the cut.
- 16.1667–18.60: single N on coral grid paper.
- 18.60–20.455: single N on ivory grid paper, then a foreground butterfly into the loop.

Controls: play/pause, replay, scrub, fullscreen; Space toggles playback and arrow keys step 0.25 seconds unless the slider has focus. Reduced-motion preference opens on a paused botanical frame. No soundtrack.

## Rendering

Plain HTML/CSS/JavaScript, no dependencies or remote font requests. Canvas 2D composes original atlas artwork and procedural patterns. WebGL renders the final animated frames with a film grain and vignette. Depth blur is applied only to nearby butterfly layers. Camera crops, local sprite transforms and flight depth are animated individually. Generated atlas lettering is baked into the artwork; the final N is rendered with the browser's Georgia serif font.

## Assets and analysis

- `assets/specimens.png`: original 4×4 specimen atlas, created with built-in ImageGen; prompt in `assets/prompt.txt`.
- `assets/n-studies.png`: nine original N treatments created with built-in ImageGen; exact prompt in `assets/n-studies-prompt.txt`.
- `reference-analysis/analysis.md`: detailed source observations and the corrected editing approach.
- `reference-analysis/sheet-*.jpg`: local reference contact sheets sampled every 0.25 seconds with zero time tolerance. They are analysis material only and are not loaded into the animation.

Validation: JavaScript syntax check; browser rendering and no reported WebGL/JavaScript warnings or errors; inspected cartographic N, botanical hold, foreground butterfly wipe and single-letter ending.

## Reference-motion refinement

Cut-change measurements at 30 Hz refine the source cadence, including approximately 0.10–0.17-second cuts in the dense montage. Detection is based on image differences, so these are motion-matching estimates rather than an original editing timeline. Plate angles stay fixed; the repeating zoom easing and random inter-cut jitter are removed. Butterflies use independently hinged half-wings, staggered takeoff, separate curved paths, a fixed body strip and per-object depth blur. The same flock persists over the coral background. Whole-frame radial blur and the additional unrelated crossing swarm are removed. This is a 2.5D remake with original N artwork, not a reconstruction of the source's unknown 3D rig.
