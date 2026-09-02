"""Small local checks. Facebook calls are mocked, so tests never need a token."""

import json
import re
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from urllib.error import URLError

from jinja2 import Environment, FileSystemLoader, select_autoescape
from app import facebook_stats as stats

ROOT = Path(__file__).resolve().parents[1]


class FacebookStatsTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        root = Path(self.temp.name)
        snapshot = root / "snapshot.json"
        snapshot.write_text(json.dumps(stats.DEFAULTS), encoding="utf-8")
        self.patchers = [
            patch.object(stats, "SNAPSHOT_PATH", snapshot),
            patch.object(stats, "CACHE_PATH", root / "cache" / "stats.json"),
            patch.object(stats, "_latest", None),
            patch.object(stats, "_next_check", 0.0),
            patch.dict("os.environ", {}, clear=True),
        ]
        for item in self.patchers:
            item.start()
            self.addCleanup(item.stop)

    def credentials(self):
        return patch.dict("os.environ", {
            "FACEBOOK_PAGE_ID": "12345", "FACEBOOK_PAGE_ACCESS_TOKEN": "test-only",
            "FACEBOOK_GRAPH_VERSION": "v25.0",
        })

    def test_no_token_does_not_make_network_call(self):
        with patch.object(stats, "_fetch_field") as fetch:
            result = stats.get_facebook_stats()
        fetch.assert_not_called()
        self.assertEqual(result["followers"], 9900)
        self.assertEqual(result["source"], "saved")

    def test_valid_counts_are_cached_and_percentage_stays_saved(self):
        with self.credentials(), patch.object(stats, "_fetch_field", side_effect=[10100, 14]) as fetch:
            first = stats.get_facebook_stats()
            second = stats.get_facebook_stats()
        self.assertEqual(first, second)
        self.assertEqual(fetch.call_count, 2)
        self.assertEqual(first["reviews"], 14)
        self.assertEqual(first["recommend_percent"], 100)
        self.assertEqual(stats.saved_stats()["followers"], 10100)
        self.assertNotIn("test-only", stats.CACHE_PATH.read_text())

    def test_partial_failure_preserves_other_field(self):
        with self.credentials(), patch.object(stats, "_fetch_field", side_effect=[10200, URLError("blocked")]):
            result = stats.get_facebook_stats()
        self.assertEqual(result["followers"], 10200)
        self.assertEqual(result["reviews"], 11)
        self.assertEqual(result["live_fields"], ["followers"])

    def test_outage_after_restart_uses_last_saved_counts(self):
        with self.credentials(), patch.object(stats, "_fetch_field", side_effect=[10400, 16]):
            stats.get_facebook_stats()
        stats._latest = None
        stats._next_check = 0
        with self.credentials(), patch.object(stats, "_fetch_field", side_effect=TimeoutError):
            result = stats.get_facebook_stats()
        self.assertEqual(result["followers"], 10400)
        self.assertEqual(result["reviews"], 16)
        self.assertEqual(result["source"], "saved")

    def test_missing_fields_do_not_erase_saved_numbers(self):
        with self.credentials(), patch.object(stats, "_fetch_field", side_effect=[None, None]):
            result = stats.get_facebook_stats()
        self.assertEqual(result["followers"], 9900)
        self.assertEqual(result["reviews"], 11)

    def test_invalid_values_and_boolean_are_rejected_but_zero_is_valid(self):
        self.assertFalse(stats._valid("followers", True))
        self.assertFalse(stats._valid("followers", -1))
        self.assertFalse(stats._valid("followers", "10500"))
        self.assertFalse(stats._valid("recommend_percent", 101))
        with self.credentials(), patch.object(stats, "_fetch_field", side_effect=[0, 0]):
            result = stats.get_facebook_stats()
        self.assertEqual(result["followers"], 0)
        self.assertEqual(result["reviews"], 0)

    def test_corrupt_json_falls_back_safely(self):
        stats.SNAPSHOT_PATH.write_text("not json")
        self.assertEqual(stats.saved_stats(), stats.DEFAULTS)

    def test_cache_failure_still_returns_fresh_values(self):
        with self.credentials(), patch.object(stats, "_fetch_field", side_effect=[10400, 15]), patch.object(Path, "mkdir", side_effect=OSError):
            result = stats.get_facebook_stats()
        self.assertEqual(result["followers"], 10400)
        self.assertEqual(result["reviews"], 15)


class TemplateTests(unittest.TestCase):
    def setUp(self):
        self.html = (ROOT / "app/templates/index.html").read_text(encoding="utf-8")

    def test_template_renders_new_name_and_saved_numbers(self):
        env = Environment(loader=FileSystemLoader(ROOT / "app/templates"), autoescape=select_autoescape())
        env.globals["url_for"] = lambda name, path: "/contractor_website/static" + path
        rendered = env.get_template("index.html").render(facebook_stats=stats.DEFAULTS)
        self.assertIn("M&amp;S CORNERSTONE", rendered)
        self.assertIn('id="facebook-followers">9,900', rendered)
        self.assertNotIn("Sem Pro", rendered)
        self.assertNotIn("/images/sem-pro/", rendered)

    def test_every_media_reference_exists_with_exact_case(self):
        for reference in re.findall(r"path='([^']+)'", self.html):
            current = ROOT / "app/static"
            for part in reference.strip("/").split("/"):
                self.assertIn(part, [entry.name for entry in current.iterdir()], reference)
                current /= part

    def test_gallery_prioritizes_new_photos_and_keeps_three_old(self):
        gallery = self.html.split('id="project-gallery"')[1].split('id="gallery-next"')[0]
        images = re.findall(r"/images/cornerstone/([^']+)'", gallery)
        self.assertEqual(len(images), 8)
        self.assertEqual(images[0], "bathroom-glass-shower.jpg")
        self.assertEqual(sum(name.startswith("project-") for name in images), 3)
        self.assertNotIn("reference.jpg", gallery)

    def test_portrait_shape_and_separate_map_lettering(self):
        self.assertEqual(self.html.count('class="brand-logo"'), 2)
        js = (ROOT / "app/static/js/app.js").read_text(encoding="utf-8")
        self.assertIn('class="marker-m">M</span>', js)
        self.assertIn('class="marker-as">&amp;S</span>', js)
        self.assertNotIn("iconUrl:", js)
        css = (ROOT / "app/static/css/styles.css").read_text(encoding="utf-8")
        self.assertIn("border-radius: 45% 45% 16% 45%", css)
        self.assertIn("background: rgba(139,188,34,.2)", css)
        self.assertIn("aspect-ratio: 9 / 16", css)
        self.assertNotIn("height: 560px", css)

    def test_brand_link_targets_page_top_not_sticky_header(self):
        self.assertIn('<body id="top">', self.html)
        self.assertNotIn('<header class="site-header" id="top">', self.html)
        js = (ROOT / "app/static/js/app.js").read_text(encoding="utf-8")
        self.assertIn("window.scrollTo({ top: 0", js)


if __name__ == "__main__":
    unittest.main()
