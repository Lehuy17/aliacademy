# ALI Academy – English clean URLs (GitHub Pages)

Production domain: https://anhnguali.com

The authoritative HTML source files stay in the repository root. Jekyll's front matter `permalink` publishes them at clean URLs; `redirect_from` creates legacy redirects for old `.html` links. Do not add duplicate `index.html` files in route subdirectories.

| HTML source | Public canonical URL |
| --- | --- |
| `index.html` | `/` |
| `tests.html` | `/tests/` |
| `b1.html` | `/b1/` |
| `ielts.html` | `/ielts/` |
| `toeic.html` | `/toeic/` |
| `speaking.html` | `/speaking/` |
| `movies.html` | `/movies/` |
| `cinema.html` | `/cinema/` |
| `login.html` | `/login/` |
| `register.html` | `/register/` |
| `teacher.html` | `/teacher/` |
| `privacy.html` | `/privacy/` |

Important maintenance notes:

- Continue to edit the original root HTML files (e.g., `movies.html`) when publishing new lessons or movies. Jekyll automatically rebuilds their clean route from that one source.
- Keep the YAML front matter at the top of each routed page and preserve `{% raw %}` / `{% endraw %}` wrappers around its HTML, so Liquid does not interpret JavaScript snippets.
- Keep `<base href="/">` in the routed pages: the existing JS, CSS and media resources are root-relative.
- In navigation, use canonical root-absolute paths, including `/tests/?step=choose` and `/?test=a1a2`. Do not use `./tests.html`.
- Some scripts infer exam type from `location.pathname`: normalize trailing slashes before extracting the filename/slug.
- Old `/movies.html`, `/tests.html`, etc. URLs are redirected to their clean paths by `jekyll-redirect-from`.
- Before production sign-off, verify a complete student login, teacher login, each test, movie playback/subtitles, and permission checks. Firebase Authorized domains must include `anhnguali.com`.

To restore legacy source behavior if GitHub Pages is not running Jekyll, remove page front matter and the Liquid raw wrappers, and restore each HTML file's old relative URLs. The current clean-URL approach requires the standard GitHub Pages Jekyll build with the supported `jekyll-redirect-from` plugin.
