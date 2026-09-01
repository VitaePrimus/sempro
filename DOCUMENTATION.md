# Sem Pro Remodeling Website — Complete Project Documentation

This document explains how the Sem Pro Remodeling website works, how to run it locally, how to deploy it to Render, what every project file does, and where to make common content and design changes.

## Quick reference

| Item | Value |
|---|---|
| Live website | <https://sempro-xojy.onrender.com/contractor_website> |
| GitHub repository | <https://github.com/VitaePrimus/sempro> |
| Render service | `sempro` |
| Render project/environment | `sempro` / `Production` |
| Local project folder | `D:\AI\contractor_website` |
| Local website | <http://127.0.0.1:8000/contractor_website> |
| Health check | `/api/health` |
| Python framework | FastAPI |
| Template engine | Jinja2 |
| Production server | Uvicorn |

## Table of contents

1. [How the website works](#how-the-website-works)
2. [Install the required software](#install-the-required-software)
3. [Run the website locally](#run-the-website-locally)
4. [Stop and restart the local website](#stop-and-restart-the-local-website)
5. [Deploy the website to Render](#deploy-the-website-to-render)
6. [Publish later changes](#publish-later-changes)
7. [Project file reference](#project-file-reference)
8. [How to change website content](#how-to-change-website-content)
9. [Facebook data: dynamic versus static](#facebook-data-dynamic-versus-static)
10. [How to change the featured Facebook reel](#how-to-change-the-featured-facebook-reel)
11. [How to change the map](#how-to-change-the-map)
12. [Testing checklist](#testing-checklist)
13. [Troubleshooting](#troubleshooting)
14. [Opening this Markdown file in Word](#opening-this-markdown-file-in-word)

## How the website works

The website uses a small server-rendered Python architecture:

1. A visitor requests `/` or `/contractor_website`.
2. FastAPI receives the request in `app/main.py`.
3. `/` redirects to `/contractor_website` so the requested project name remains in the URL.
4. FastAPI renders `app/templates/index.html` through Jinja2.
5. The HTML loads local CSS, JavaScript, images, Leaflet, and county GeoJSON files from `app/static/`.
6. JavaScript activates the mobile menu, photo carousel, service-area map, and automatic copyright year.
7. Render runs the same FastAPI application publicly with Uvicorn.

There is no database, administrator panel, contact-form database, or customer login. Site content is changed by editing files and publishing a new Git commit.

## Install the required software

For local development on Windows, install:

- Python 3.12 or a compatible current Python version
- Git
- Visual Studio Code or another text editor
- A modern browser

Confirm Python and Git are available:

```powershell
py --version
git --version
```

## Run the website locally

Open PowerShell and move into the project:

```powershell
cd D:\AI\contractor_website
```

### First-time setup

Create a virtual environment:

```powershell
py -m venv .venv
```

Activate it:

```powershell
.venv\Scripts\Activate.ps1
```

Install the Python packages:

```powershell
pip install -r requirements.txt
```

Start the local development server:

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Open:

```text
http://127.0.0.1:8000/contractor_website
```

`--reload` watches Python and template files and restarts the application when they change. Most CSS, JavaScript, and HTML changes become visible after refreshing the browser.

### Later local sessions

After the first setup, only run:

```powershell
cd D:\AI\contractor_website
.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Stop and restart the local website

In the terminal running Uvicorn, press:

```text
Ctrl+C
```

Then restart with:

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

If port `8000` is already occupied, either stop the existing server or temporarily use another port:

```powershell
uvicorn app.main:app --reload --port 8001
```

Then visit `http://127.0.0.1:8001/contractor_website`.

## Deploy the website to Render

### Current deployment architecture

The current Render service deploys the public GitHub repository:

```text
https://github.com/VitaePrimus/sempro
```

It uses these commands:

```text
Build command: pip install -r requirements.txt
Start command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

The service uses the free compute plan and the Ohio region.

### Create the GitHub repository

If reproducing the deployment from scratch:

1. Create a GitHub repository such as `sempro`.
2. In the local project folder, initialize Git if needed:

   ```powershell
   git init -b main
   git add .
   git commit -m "Build Sem Pro Remodeling website"
   ```

3. Connect the repository and push:

   ```powershell
   git remote add origin https://github.com/YOUR-USERNAME/sempro.git
   git push -u origin main
   ```

Do not commit `.venv`, passwords, tokens, browser data, or private customer information.

### Create the Render web service manually

1. Sign in at <https://dashboard.render.com>.
2. Select **New → Web Service**.
3. Select **Public Git Repository** or connect your GitHub provider.
4. Enter the repository URL.
5. Use these settings:

   | Render field | Value |
   |---|---|
   | Name | `sempro` |
   | Language | `Python 3` |
   | Branch | `main` |
   | Region | `Ohio (US East)` |
   | Build Command | `pip install -r requirements.txt` |
   | Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
   | Compute Plan | `Free` |

6. Under advanced settings, set the health-check path to `/api/health` if that option is available.
7. Select **Deploy web service**.
8. Wait for the build log to show `Your service is live`.
9. Test both `/contractor_website` and `/api/health`.

### Deploy with the included Blueprint

`render.yaml` contains the same deployment configuration. To use it as a Blueprint:

1. Push this repository to GitHub.
2. In Render, select **New → Blueprint**.
3. Connect or enter the repository containing `render.yaml`.
4. Review the planned free `sempro` web service.
5. Apply the Blueprint.

Blueprint deployment is useful because the build, start, health-check, and free-plan settings live in version control.

### Important free-tier behavior

Free Render web services spin down after inactivity. The first request after the service sleeps can take noticeably longer while Render wakes it. This is expected and is not a website error.

## Publish later changes

### 1. Test locally

Run the local website and check your changes before publishing.

### 2. Review changed files

```powershell
git status
git diff
```

### 3. Commit and push

```powershell
git add .
git commit -m "Describe the website update"
git push origin main
```

### 4. Deploy the new commit on Render

The current service was created from a **Public Git Repository** connection. If automatic deployment is not enabled for that source type:

1. Open the `sempro` service in Render.
2. Select **Manual Deploy**.
3. Select **Deploy latest commit**.
4. Watch the logs until the service is live.

If Render is later connected directly to the GitHub account or managed as a Blueprint with automatic deploys enabled, a push to `main` can start deployment automatically.

## Project file reference

### Root files

#### `.gitignore`

Prevents local-only files from being committed, including `.venv`, Python caches, editor metadata, and operating-system files.

#### `.python-version`

Requests Python `3.12`. Render currently resolves this to an available Python 3.12 patch release.

#### `README.md`

Short GitHub landing-page summary with quick local and deployment instructions.

#### `DOCUMENTATION.md`

This complete maintenance, deployment, content-editing, and troubleshooting guide.

#### `requirements.txt`

Pins the Python packages:

- `fastapi` — request routing and application framework
- `uvicorn[standard]` — ASGI web server for local and Render execution
- `jinja2` — renders the HTML template

#### `render.yaml`

Render Blueprint configuration: service name, Python runtime, free plan, build command, start command, and health-check path.

### Python application

#### `app/__init__.py`

Marks `app` as a Python package. It is intentionally small.

#### `app/main.py`

The backend entry point. It:

- creates the FastAPI application;
- mounts the static-file directory;
- configures Jinja templates;
- redirects `/` to `/contractor_website`;
- renders the main website route; and
- provides `/api/health` for monitoring.

### HTML template

#### `app/templates/index.html`

Contains nearly all visible business content and page structure:

- metadata and title;
- contact bar and header;
- hero section;
- follower/review statistics;
- project gallery;
- selected Facebook reel;
- service descriptions;
- owner biography;
- service-area section;
- contact section; and
- footer.

### CSS files

#### `app/static/css/styles.css`

All custom visual styling, including brand colors, typography, spacing, header, hero, galleries, service cards, owner section, map layout, footer, and mobile breakpoints.

The main color variables are at the top under `:root`:

```css
--green: #08775f;
--green-dark: #064b3e;
--orange: #f28a2f;
--blue: #1769aa;
--yellow: #ffd84f;
```

#### `app/static/css/leaflet.css`

Third-party Leaflet map-library styling. Normally do not edit this file. Make map appearance changes in `styles.css` and `app.js` instead.

### JavaScript files

#### `app/static/js/app.js`

Custom website behavior:

- opens and closes the mobile menu;
- scrolls the project gallery;
- defines regular and case-by-case counties;
- initializes the Leaflet map;
- fetches the local county GeoJSON;
- styles county polygons;
- places the Parma marker; and
- updates the copyright year.

#### `app/static/js/leaflet.js`

Third-party Leaflet map library. Do not hand-edit it unless intentionally upgrading Leaflet.

### Map data

#### `app/static/data/northeast-ohio-counties.geojson`

Local geographic boundary data for Northeast Ohio counties. `app.js` decides which included counties receive regular-service or case-by-case styling.

### Active Sem Pro images

The active project assets are under `app/static/images/sem-pro/`:

| File | Purpose |
|---|---|
| `project-05.jpg` | Hero and exterior-painting gallery image |
| `project-06.jpg` | Exterior-finish gallery image |
| `project-08.jpg` | Entrance finish-painting image |
| `project-09.jpg` | Doorway detail image |
| `project-11.jpg` | Bathroom repair image |
| `project-12.jpg` | Behind-the-wall plumbing/repair image |
| `sem-molo-owner.jpg` | Owner portrait |
| `sem-pro-reference.png` | Original business-card/reference artwork; not displayed on the current page |

`project-07.jpg` and `project-10.jpg` are retained project media but are not currently displayed.

### Legacy unused images

These files are left from the earlier placeholder version and are not referenced by the current template:

- `owner-placeholder.jpg`
- `project1-before.jpg`
- `project1-after.jpg`
- `project2-before.jpg`
- `project2-after.jpg`
- `project3-before.jpg`
- `project3-after.jpg`

They can be removed in a future cleanup after confirming they are not needed.

## How to change website content

### Business name and branding text

Open `app/templates/index.html` and search for:

```text
SEM PRO
REMODELING
Sem Pro Remodeling
```

Update all intended occurrences consistently, including the HTML title, header, hero, contact section, and footer.

### Phone number

Search `index.html` for both formats:

```text
(216) 385-0883
tel:+12163850883
```

The human-readable number and `tel:` link must match.

### Facebook profile

Search `index.html` for:

```text
https://www.facebook.com/SemMolo7991/
```

Replace every intended Facebook link if the business page changes.

### Hero image, headline, and paragraph

In `index.html`, locate the comment containing:

```html
HERO / ГОЛОВНИЙ ЕКРАН
```

Change:

- the `hero-media` image path;
- the `<h1>` headline;
- the `hero-lede` paragraph; and
- button text if needed.

Place new images in `app/static/images/sem-pro/` and reference them like:

```html
{{ url_for('static', path='/images/sem-pro/new-image.jpg') }}
```

### Followers and reviews

In `index.html`, search for:

```text
9.9K
11
100%
```

These values are static and must be updated manually after checking Facebook.

### Project gallery

Each gallery item is a `<figure class="project-card">` in `index.html`.

To replace a project:

1. Copy the new image into `app/static/images/sem-pro/`.
2. Change the `<img src>` path.
3. Write an accurate `alt` description.
4. Change the category `<span>` and headline `<strong>`.

To add a project, duplicate one complete `<figure>` block and change its content.

### Services

Search `index.html` for:

```html
<div class="services-grid">
```

Each `<article class="service-card">` contains its number, title, and description. Duplicate, remove, or edit complete cards. The CSS automatically changes from three columns to two and then one on smaller screens.

### Owner photo and biography

Search `index.html` for:

```text
Meet the owner
sem-molo-owner.jpg
```

The simplest photo replacement is to overwrite `sem-molo-owner.jpg` with a new square image using the same filename. Otherwise change the template path. Edit the two biography paragraphs in the same section.

### Brand colors

Edit the variables at the top of `app/static/css/styles.css`. Because sections reuse these variables, changing them updates the full design consistently.

### Spacing, sizes, and mobile design

Edit `styles.css`. The mobile breakpoint begins near:

```css
@media (max-width: 640px)
```

The tablet/navigation breakpoint begins near:

```css
@media (max-width: 980px)
```

After CSS changes, test desktop and mobile widths.

## Facebook data: dynamic versus static

| Website element | Current behavior | How it updates |
|---|---|---|
| `9.9K` follower count | Static | Manually edit `index.html` |
| `11` recommendation reviews | Static | Manually edit `index.html` |
| `100% recommend` statement | Static | Manually edit `index.html` |
| Business phone/name/services | Static | Manually edit `index.html` |
| Project photos | Static local files | Replace images and template references |
| Owner biography/photo | Static | Edit HTML or replace image |
| Featured reel selection | Static selection | Replace the reel URL in the iframe |
| Featured reel playback/content | Loaded live from Facebook | Facebook serves the selected reel through its embed player |
| “Watch more on Facebook” destination | Static link to the Reels page | Edit the link in `index.html` |
| Latest reel automatically selected | Not implemented | Requires Facebook API integration and authorized page access |
| Copyright year | Dynamic | `app.js` reads the visitor device year |
| Road/city map tiles | Dynamic network data | Loaded from OpenStreetMap when the page opens |
| County boundary shapes | Static local data | Stored in the GeoJSON file |
| County colors/tier labels | Dynamic browser rendering from static lists | `app.js` applies styles from the two county sets |
| Photo carousel movement | Dynamic interaction | Browser JavaScript scrolls the static photos |
| Mobile navigation | Dynamic interaction | Browser JavaScript toggles the menu |
| Render port | Dynamic hosting value | Render provides `$PORT` at runtime |
| Health endpoint response | Dynamic server response | FastAPI returns JSON on every request |

### Why Facebook counts are not automatic

The site does not currently call the Facebook Graph API. Automatically reading page statistics would require a maintained Facebook application, appropriate page permissions, a Page access token stored securely on Render, error handling, and a caching strategy. Tokens must never be placed in HTML, JavaScript, screenshots, or GitHub.

For a small contractor site, manually updating public counts is simpler and more dependable. Consider displaying approximate wording such as `9K+ followers` so small count changes do not immediately make the site look outdated.

## How to change the featured Facebook reel

The site currently embeds one selected reel. It does **not** automatically show the newest reel.

### Select a different reel manually

1. Open the desired public reel on Facebook.
2. Copy its public URL. Example:

   ```text
   https://www.facebook.com/reel/1234567890123456/
   ```

3. URL-encode the reel URL. The example becomes:

   ```text
   https%3A%2F%2Fwww.facebook.com%2Freel%2F1234567890123456%2F
   ```

4. Open `app/templates/index.html`.
5. Find the iframe with this title:

   ```html
   title="Sem Pro Remodeling Facebook project video"
   ```

6. In its `src`, replace only the encoded URL after `href=` and before `&amp;show_text`.

The final format should look like:

```html
src="https://www.facebook.com/plugins/video.php?href=ENCODED_REEL_URL&amp;show_text=false&amp;width=500"
```

7. Test locally. Confirm the play button, preview image, and Facebook link correspond to the intended reel.

### Automatically show the latest reel

This is not currently implemented. A reliable implementation would require:

1. a Facebook developer application;
2. authorized access to the business Page;
3. a Page access token stored as a Render environment variable;
4. a backend request to the supported Facebook Graph API endpoint;
5. selection of the newest eligible video/reel;
6. cached results so each visitor does not trigger a Facebook request; and
7. fallback behavior when the API, token, or reel is unavailable.

Do not scrape a logged-in Facebook page from production and do not expose an access token in frontend code. Manual reel selection is the current recommended workflow.

## How to change the map

### Regular-service counties

Open `app/static/js/app.js` and edit:

```javascript
const regularCounties = new Set(["Cuyahoga", "Lorain", "Medina", "Summit", "Lake", "Geauga"]);
```

### Case-by-case counties

Edit:

```javascript
const caseCounties = new Set(["Erie", "Huron", "Ashland", "Wayne", "Portage", "Ashtabula"]);
```

County names must match the `NAME` values in the GeoJSON file exactly.

### Parma base marker

Find this coordinate pair in `app.js`:

```javascript
[41.4048, -81.7229]
```

Replace it with the latitude and longitude of the new base. Do not place a private home address on the public site unless the business intentionally publishes it.

### Map colors

County polygon colors are inside the `style(feature)` function in `app.js`. Legend and marker styles are in `styles.css` under `.map-legend` and `.parma-marker`.

## Testing checklist

Before publishing:

- [ ] Local `/contractor_website` returns the full page.
- [ ] `/api/health` returns `healthy`.
- [ ] Header links scroll to the intended sections.
- [ ] Phone links contain the correct number.
- [ ] Every project image loads and has accurate alternative text.
- [ ] Gallery arrows work.
- [ ] Mobile menu opens and closes.
- [ ] Featured Facebook reel is the intended public reel.
- [ ] Map tiles load.
- [ ] Regular and case-by-case county colors are correct.
- [ ] Parma marker appears in the correct place.
- [ ] Footer year is current.
- [ ] Desktop view has no horizontal scrollbar.
- [ ] Mobile view has no horizontal scrollbar.
- [ ] Git does not include `.venv`, credentials, or private customer material.
- [ ] Render build finishes successfully.
- [ ] Live website and health endpoint work after deployment.

## Troubleshooting

### `uvicorn` is not recognized

Activate `.venv` and install requirements:

```powershell
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Or run Uvicorn through Python:

```powershell
python -m uvicorn app.main:app --reload --port 8000
```

### PowerShell blocks activation

Use Command Prompt with `.venv\Scripts\activate.bat`, or review the machine's PowerShell execution policy with its administrator. Do not weaken system security settings without understanding the impact.

### Images return 404

Check:

- exact spelling and capitalization;
- that the file exists under `app/static/images/`;
- that the template path starts with `/images/`; and
- that the image was committed and pushed to GitHub.

Linux hosting is case-sensitive even when Windows is not.

### Map is gray or incomplete

Check the browser console and network connection. OpenStreetMap tiles require internet access. Also preserve a defined height for `#service-map`, because Leaflet cannot render correctly in a zero-height container.

### County polygons do not appear

Confirm `/contractor_website/static/data/northeast-ohio-counties.geojson` loads and contains valid JSON. Confirm the county names in `app.js` match GeoJSON `NAME` properties.

### Facebook reel does not load

Confirm the reel is public, the copied URL is correct, and the URL in the embed is encoded. Facebook can restrict embedding for some content. The “Watch more on Facebook” link remains a fallback.

### Render build fails

Check the first actual error in the Render logs. Confirm:

- `requirements.txt` exists at the repository root;
- the build command is `pip install -r requirements.txt`;
- the start command references `app.main:app`;
- the server binds to `0.0.0.0` and `$PORT`; and
- Python dependencies remain compatible with `.python-version`.

### Live page shows an older version

Confirm the latest commit is visible on GitHub, then use **Manual Deploy → Deploy latest commit** in Render. Hard-refresh the browser after deployment.

## Opening this Markdown file in Word

Microsoft Word can open the Desktop copy of this `.md` file as text. For the best editable Word version:

1. Open Word.
2. Select **File → Open** and choose `Sem Pro Website Documentation.md` from the Desktop.
3. If Word displays a conversion prompt, choose UTF-8 so Ukrainian comments and symbols remain correct.
4. Select **File → Save As**.
5. Save a separate `.docx` copy.

Keep `DOCUMENTATION.md` in the GitHub repository as the source documentation. Update it whenever the deployment process, business details, file structure, or integrations change.
