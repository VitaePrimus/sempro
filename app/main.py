"""FastAPI entry point for the Sem Pro Remodeling website.

FastAPI provides a professional, typed Python foundation while Jinja renders
the landing page and StaticFiles serves local media, map data, CSS, and JS.
"""

from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates


# Resolve folders from this module so startup works from any terminal location.
BASE_DIR = Path(__file__).resolve().parent

# Create the application with accurate metadata for future deployment tooling.
app = FastAPI(
    title="Sem Pro Remodeling",
    description="Home renovation and contractor services across Greater Cleveland.",
    version="2.0.0",
)

# Expose browser assets beneath the branded route requested for the project URL.
app.mount("/contractor_website/static", StaticFiles(directory=BASE_DIR / "static"), name="static")

# Configure the server-rendered template directory.
templates = Jinja2Templates(directory=BASE_DIR / "templates")


@app.get("/", include_in_schema=False)
async def root_redirect() -> RedirectResponse:
    """Redirect visitors so contractor_website remains visible in the URL."""

    return RedirectResponse(url="/contractor_website", status_code=307)


@app.get("/contractor_website", response_class=HTMLResponse, name="home")
async def contractor_website(request: Request) -> HTMLResponse:
    """Render the public Sem Pro Remodeling landing page."""

    return templates.TemplateResponse(request=request, name="index.html")


@app.get("/api/health", tags=["system"])
async def health_check() -> dict[str, str]:
    """Return a small status payload for local checks and future hosting."""

    return {"status": "healthy", "service": "sem_pro_remodeling"}
