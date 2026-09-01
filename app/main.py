"""FastAPI entry point for the Sem Pro Remodeling website.

FastAPI provides a professional, typed Python foundation while Jinja renders
the landing page and StaticFiles serves local media, map data, CSS, and JS.
"""

from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates


# paths stay anchored to this file — запуск працює з будь-якої папки.
BASE_DIR = Path(__file__).resolve().parent

# === FASTAPI APPLICATION METADATA ===
app = FastAPI(
    title="Sem Pro Remodeling",
    description="Home renovation and contractor services across Greater Cleveland.",
    version="2.0.0",
)

# ВАЖЛИВО: CSS, JS, photos, and map data are published under this exact prefix.
app.mount("/contractor_website/static", StaticFiles(directory=BASE_DIR / "static"), name="static")

# jinja templates live separately from the Python routing logic.
templates = Jinja2Templates(directory=BASE_DIR / "templates")


@app.get("/", include_in_schema=False)
async def root_redirect() -> RedirectResponse:
    """Redirect visitors so contractor_website remains visible in the URL."""

    # !!! KEEP THIS IN SYNC with the public page route immediately below.
    return RedirectResponse(url="/contractor_website", status_code=307)


@app.get("/contractor_website", response_class=HTMLResponse, name="home")
async def contractor_website(request: Request) -> HTMLResponse:
    """Render the public Sem Pro Remodeling landing page."""

    return templates.TemplateResponse(request=request, name="index.html")


@app.get("/api/health", tags=["system"])
async def health_check() -> dict[str, str]:
    """Return a small status payload for local checks and future hosting."""

    # Render can check this lightweight response without loading the full page.
    return {"status": "healthy", "service": "sem_pro_remodeling"}
