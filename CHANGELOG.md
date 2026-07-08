# Changelog

All notable changes to AstraNova (CosmosExplorer) are documented here.
Format: [MAJOR.MINOR.PATCH.MICRO] - YYYY-MM-DD

## [0.2.0.0] - 2026-07-08

### Added
- Daily Cosmic Quiz at /quiz — 5 date-seeded questions a day from a 32-question bank in English, Russian and Uzbek, with immediate feedback, day streaks, best-streak tracking and a Wordle-style copyable result.
- "Space Today" homepage section — NASA's Astronomy Picture of the Day, refreshed daily, plus a quiz teaser card that shows your current streak.
- Exoplanets page at /exoplanets — live planet counter and fresh discoveries from the NASA Exoplanet Archive, plus a Hall of Fame of eight famous worlds with real ESO/Hubble/JPL artist imagery, stat tiles and travel-time chips.
- Travel Time page at /travel-time — pick a destination and a ride, see the real journey time, with a log-scale distance ladder, arrival dates, shareable URLs and rotating textured planet sprites.
- Travel Planner at /travel-planner — plan trips with live Wikipedia and Open-Meteo data; trips saved locally in the browser.
- Study Abroad Coach — standalone site at /coach for planning US/UK/Canada university applications.
- Rotating textured celestial sprites (CelestialSprite) reusing the 3D solar system textures; new Moon texture and exoplanet artist images in public/.

### Changed
- Navigation and sitemap now include the Exoplanets, Travel Time and Quiz pages.
- Locale proxy no longer rewrites /api routes or the /coach site.
- Site metadata includes Google site verification.
