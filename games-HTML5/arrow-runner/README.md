Arrow Runner — Minimal Precision Runner

How to run
1. Open `arrow-runner/arrow-runner.html` in a modern browser (Chrome/Firefox/Edge/Safari).
2. Click Play, or press and hold Space / click/tap to lift the arrow.

Design goals (implemented to spec)
- Flat-shaded right-pointing arrow (isosceles triangle) with optional thin outline and glow.
- Extremely dark background with no texture.
- Walls/floor are solid rectangles; spikes are filled triangles.
- Physics: continuous upward force while holding; gravity otherwise; immediate vertical velocity change on input.
- Six levels of increasing speed and obstacle complexity.
- Precise triangle vs triangle/rect collision checks; immediate flash and reset on death.

Notes
- This is a minimal, dependency-free implementation. You can tune `physics` object in `arrow-runner.js` for exact feel.
- Audio intentionally minimal — not added by default. Add short sounds in `die()` or input handlers if needed.