# M&S CORNERSTONE Website

Responsive business website for M&S CORNERSTONE, a licensed contractor based in Parma and serving Greater Cleveland. The site uses FastAPI, Jinja templates, semantic HTML, modern CSS, lightweight JavaScript, and Leaflet county mapping.

For the complete setup, deployment, file reference, editing guide, Facebook dynamic/static explanation, and troubleshooting instructions, see [DOCUMENTATION.md](DOCUMENTATION.md).

## Included

- New owner-supplied project images, selected earlier photos, and owner portrait
- Painting, remodeling, flooring, drywall, basement, deck, and finish-work services
- Public Facebook reel embed and business contact links
- Accurate Northeast Ohio county service-area map
- Responsive desktop and mobile layouts
- FastAPI health endpoint at `/api/health`
- Render free-tier deployment Blueprint
- Square logo in the header, footer, and Parma map marker
- Responsive portrait reel player, with a direct Facebook fallback link
- Saved Facebook stats in JSON, with optional authorized Page API refresh (no database)

## Local review — September 2, 2026

The original owner edits are backed up on `user-edits-20260902` at commit `b2e3f0b`.
The M&S CORNERSTONE changes made afterward are intentionally uncommitted and unpushed.
The remote repository and Render service are still named `sempro`; do not rename those just to change the public branding.

Two newly supplied reference images are retained but not displayed pending project attribution:
`bathroom-skylight-reference.jpg` and `stone-feature-wall-reference.jpg`.

## Run locally

```bat
cd /d D:\AI\contractor_website
.venv\Scripts\activate.bat
python -m uvicorn app.main:app --reload --port 8000
```

For a fresh install, run `py -3.12 -m venv .venv` first and install `python -m pip install -r requirements.txt` after activation.

Run the local checks: `python -m unittest discover -s tests -v`.

Facebook counts are not live until the optional Page credentials are configured; see the updated guide.

Open `http://127.0.0.1:8000/contractor_website`.

## Deploy to Render

The included `render.yaml` uses the free Python web-service plan, installs `requirements.txt`, starts Uvicorn on Render's assigned port, and checks `/api/health`.

Render free web services spin down after periods of inactivity, so the first request after idle time can take longer to load.
