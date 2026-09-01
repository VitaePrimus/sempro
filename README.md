# Sem Pro Remodeling Website

Responsive business website for Sem Pro Remodeling, a licensed contractor based in Parma and serving Greater Cleveland. The site uses FastAPI, Jinja templates, semantic HTML, modern CSS, lightweight JavaScript, and Leaflet county mapping.

## Included

- Real Sem Pro project images and owner portrait used with permission
- Painting, remodeling, flooring, drywall, basement, deck, and finish-work services
- Public Facebook reel embed and business contact links
- Accurate Northeast Ohio county service-area map
- Responsive desktop and mobile layouts
- FastAPI health endpoint at `/api/health`
- Render free-tier deployment Blueprint

## Run locally

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Open `http://127.0.0.1:8000/contractor_website`.

## Deploy to Render

The included `render.yaml` uses the free Python web-service plan, installs `requirements.txt`, starts Uvicorn on Render's assigned port, and checks `/api/health`.

Render free web services spin down after periods of inactivity, so the first request after idle time can take longer to load.
