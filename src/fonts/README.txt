CELESTIAN SHARED TYPOGRAPHY

All production HTML entries load /src/fonts/index.css. React and standalone
documents use the same font families and /fonts/v1/ URLs. Browser caching can
reuse font files across same-origin documents. No runtime font-provider request
or page-specific font subset is needed.

Roles (defined only in index.css):
  --font-body        Noto Serif SC, Chinese headings, narrative and music UI
  --font-display     Cinzel, ceremonial Latin headings
  --font-mono        JetBrains Mono, numbers and terminal content
  --font-ui          System sans serif, utility controls
  --font-decorative  Existing Yishan seal script, ornamental titles
  --font-signature   Mrs Saint Delafield, badge signatures
  --font-classic     Georgia with shared Chinese fallback, small Latin captions
  --font-editorial   Existing editorial Latin stack with shared Chinese fallback

Use these roles in CSS and the matching Tailwind utilities. Keep page-specific
font sizes, line heights and spacing in page styles. Existing SVG title outlines
are artwork and are intentionally preserved.

Font data lives in public/fonts/v1/. faces.css and font-sources.json are generated.
The lock records upstream URLs, effective Unicode coverage, bytes and SHA-256.
Font licenses are beside the WOFF2 assets; yishan-source.css preserves the existing
seal-font provider attribution. Historical prototype font assets are retained,
but production pages do not load them.

The standard Vite build copies public/fonts/ automatically. Custom builds that
disable copying public assets must also package /fonts/v1/ and the font licenses.

One shared 104 KB variable font pack is preloaded at the beginning of every HTML
entry. It contains music titles/subtitles, faction names and character headings,
derived from the existing catalogs by scripts/font-priority.mjs. Remaining known
Chinese text uses small frequency-ordered packs; full source shards still cover
new database text and rare characters. Priority ranges are removed from the
fallback faces, so rendering one title does not download those larger files too.

The browser loads only shards whose unicode-range intersects text being rendered.
Only the critical pack is preloaded, never the entire CJK alphabet. Native
font-display:swap shows readable fallback glyphs immediately while fonts load. Images and controls remain
visible; the browser still permits readable fallback on slow/failed downloads.
There is no JavaScript-dependent page hiding or permanent font-loading overlay.

Commands:
  npm run fonts:check  Offline integrity, known Chinese glyph coverage, weights,
                      shared-entry, preload budget and retired-family checks.
                      Runs before build.
  npm run fonts:test-loading
                      Browser regression: cold-cache size, preload reuse, a
                      delayed font with immediate readable fallback, and readable failure.
                      Uses the local preview; PREVIEW_URL, PLAYWRIGHT_PATH and
                      BROWSER_BIN can override the workspace defaults.
  npm run fonts:sync   Fetch missing pinned files, refresh shared priority packs,
                      and regenerate CSS/lock and HTML preload URLs.
  python scripts/sync-fonts.py --refresh
                      Explicitly refresh upstream Google Fonts versions.

Sync needs Python, fonttools and brotli (pip install fonttools brotli). It also
supports the existing workspace tooling directories. Check needs only Node.
After a refresh, run fonts:check, preview desktop/mobile and inspect actual
rendered fonts with browser CSS.getPlatformFontsForNode. A computed font-family
string alone does not prove that its glyphs rendered without fallback.

Font range limitations are surfaced by the checker. Adding ordinary text within
the source font's coverage never requires regenerating a page subset.
