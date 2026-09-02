"""Facebook counts, with a plain JSON fallback. No database, no scraping."""

import json
import logging
import os
import re
import threading
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

# --- останні відомі цифри / last known numbers ---
BASE_DIR = Path(__file__).resolve().parent
SNAPSHOT_PATH = BASE_DIR / "data" / "facebook-stats.json"
CACHE_PATH = BASE_DIR.parent / ".cache" / "facebook-stats.json"
DEFAULTS = {"followers": 9900, "reviews": 11, "recommend_percent": 100}
TTL = 6 * 60 * 60  # once per six hours is plenty for this site.
_lock = threading.Lock()
_next_check = 0.0
_latest = None
logger = logging.getLogger(__name__)


def _valid(key, value):
    # False isn't a follower count, even though Python treats bool as an int.
    return type(value) is int and 0 <= value <= (100 if key == "recommend_percent" else 10**12)


def _read(path):
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except (OSError, ValueError):
        return {}  # missing/corrupt cache? the page still has its bundled snapshot.


def saved_stats():
    """Fast local read for the initial HTML; no network request here."""
    result = dict(DEFAULTS)
    for source in (_read(SNAPSHOT_PATH), _read(CACHE_PATH)):
        for key in DEFAULTS:
            if _valid(key, source.get(key)):
                result[key] = source[key]
    return result


def _fetch_field(page_id, token, version, field):
    # token stays in the Authorization header, never in the URL or browser.
    request = Request(
        f"https://graph.facebook.com/{version}/{page_id}?fields={field}",
        headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
    )
    with urlopen(request, timeout=4) as response:
        payload = json.load(response)
    return payload.get(field) if isinstance(payload, dict) else None


def get_facebook_stats():
    """Try authorized Page counts, but never blank the UI on failure."""
    global _next_check, _latest
    with _lock:
        if _latest is not None and time.monotonic() < _next_check:
            return dict(_latest)

        values = saved_stats()
        if _latest:
            values.update({key: _latest[key] for key in DEFAULTS})
        result = {**values, "source": "saved", "live_fields": [], "checked_at": None}
        page_id = os.getenv("FACEBOOK_PAGE_ID", "")
        token = os.getenv("FACEBOOK_PAGE_ACCESS_TOKEN", "")
        version = os.getenv("FACEBOOK_GRAPH_VERSION", "")
        configured = bool(token and re.fullmatch(r"\d+", page_id) and re.fullmatch(r"v\d+\.\d+", version))
        _next_check = time.monotonic() + TTL  # also back off on errors; don't hammer Meta.
        if not configured:
            _latest = result
            return dict(result)

        # Separate requests: losing review permission shouldn't break follower updates.
        for key, field in (("followers", "followers_count"), ("reviews", "rating_count")):
            try:
                value = _fetch_field(page_id, token, version, field)
                if _valid(key, value):
                    result[key] = value
                    result["live_fields"].append(key)
            except (HTTPError, URLError, TimeoutError, OSError, ValueError):
                # DON'T log the exception body; it can contain account details.
                logger.info("Facebook %s unavailable; keeping the saved value.", key)

        # Facebook's star rating is NOT a recommendation percentage.
        # 100% stays the last manually verified percentage until updated in the JSON.
        if result["live_fields"]:
            result["source"] = "partial-live"
            result["checked_at"] = datetime.now(timezone.utc).isoformat()
            try:
                CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
                temp = CACHE_PATH.with_suffix(".tmp")
                temp.write_text(json.dumps(result, indent=2), encoding="utf-8")
                temp.replace(CACHE_PATH)  # atomic save, so a restart won't leave half a JSON file.
            except OSError:
                logger.info("Facebook cache is read-only; keeping the latest counts in memory.")
        _latest = result
        return dict(result)
