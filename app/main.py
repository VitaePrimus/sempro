"""Small Python server for M&S CORNERSTONE. Content still lives in HTML."""

from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from app.facebook_stats import get_facebook_stats, saved_stats


# --- folders / шляхи ---
BASE_DIR = Path(__file__).resolve().parent

# name here is for the API docs; the page title lives in index.html.
app = FastAPI(
    title="M&S CORNERSTONE",
    description="Home renovation and contractor services across Greater Cleveland.",
    version="2.0.0",
)

# leave this URL alone unless we're also updating the map's fetch path.
app.mount("/contractor_website/static", StaticFiles(directory=BASE_DIR / "static"), name="static")

# --- page routes ---
templates = Jinja2Templates(directory=BASE_DIR / "templates")


@app.get("/", include_in_schema=False)
async def root_redirect() -> RedirectResponse:
    """Redirect visitors so contractor_website remains visible in the URL."""

    # той самий URL, що й нижче — keep old bookmarks working.
    return RedirectResponse(url="/contractor_website", status_code=307)


@app.get("/contractor_website", response_class=HTMLResponse, name="home")
async def contractor_website(request: Request) -> HTMLResponse:
    """Show the page straight away, even if Facebook is unavailable."""

    return templates.TemplateResponse(
        request=request, name="index.html", context={"facebook_stats": saved_stats()}
    )


@app.get("/api/facebook-stats", tags=["public"])
def facebook_stats() -> dict:
    # FastAPI runs this sync route in a thread; a slow Facebook call won't block the site.
    return get_facebook_stats()


@app.get("/api/health", tags=["system"])
async def health_check() -> dict[str, str]:
    """Return a small status payload for local checks and future hosting."""

    # tiny ping for Render, nothing fancy.
    return {"status": "healthy", "service": "ms_cornerstone"}
