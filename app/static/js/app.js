/* --- menu / меню --- */
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");

// The header is sticky, so scroll the page itself instead of targeting the header.
document.querySelectorAll('.brand[href="#top"]').forEach((brand) => {
    brand.addEventListener("click", (event) => {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
        siteNav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
        history.replaceState(null, "", "#top");
    });
});

menuToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
});

siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
        siteNav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
    });
});

/* --- gallery --- keep touch scrolling native; the buttons just move it along. */
const gallery = document.querySelector("#project-gallery");
const galleryStep = () => Math.min(gallery.clientWidth * 0.82, 470);

document.querySelector("#gallery-prev").addEventListener("click", () => {
    gallery.scrollBy({ left: -galleryStep(), behavior: "smooth" });
});

document.querySelector("#gallery-next").addEventListener("click", () => {
    gallery.scrollBy({ left: galleryStep(), behavior: "smooth" });
});

gallery.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        gallery.scrollBy({ left: event.key === "ArrowLeft" ? -galleryStep() : galleryStep(), behavior: "smooth" });
    }
});

/* --- coverage --- update the written lists in index.html too. */
const regularCounties = new Set(["Cuyahoga", "Lorain", "Medina", "Summit", "Lake", "Geauga"]);
const caseCounties = new Set(["Erie", "Huron", "Ashland", "Wayne", "Portage", "Ashtabula"]);

/* map missing? no reason to break the rest of the page. */
async function initializeServiceMap() {
    if (!window.L) return;

    const map = L.map("service-map", {
        center: [41.35, -81.73],
        zoom: 8,
        minZoom: 7,
        maxZoom: 11,
        scrollWheelZoom: false,
        attributionControl: true,
    });

    // roads come from OSM; the county outlines are our local file.
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    try {
        // тут справжні межі округів — not a hand-drawn circle.
        const response = await fetch("/contractor_website/static/data/northeast-ohio-counties.geojson");
        if (!response.ok) throw new Error(`County data returned ${response.status}`);
        const countyData = await response.json();

        const countyLayer = L.geoJSON(countyData, {
            style(feature) {
                const name = feature.properties.NAME || feature.properties.name || "";
                const isRegular = regularCounties.has(name);
                const isCase = caseCounties.has(name);
                return {
                    color: isRegular ? "#064b3e" : isCase ? "#c86113" : "#9aa8a3",
                    weight: isRegular || isCase ? 2.2 : 1,
                    fillColor: isRegular ? "#08775f" : isCase ? "#ffd27d" : "#dfe6e2",
                    fillOpacity: isRegular ? 0.62 : isCase ? 0.58 : 0.18,
                };
            },
            onEachFeature(feature, layer) {
                const name = feature.properties.NAME || feature.properties.name || "County";
                const tier = regularCounties.has(name) ? "Regular service" : caseCounties.has(name) ? "Case-by-case service" : "Outside the listed area";
                layer.bindTooltip(`<strong>${name} County</strong><br>${tier}`, { sticky: true });
            },
        }).addTo(map);

        // fit the counties we're actually serving.
        const servicedFeatures = countyData.features.filter((feature) => {
            const name = feature.properties.NAME || feature.properties.name || "";
            return regularCounties.has(name) || caseCounties.has(name);
        });
        const servicedLayer = L.geoJSON({ type: "FeatureCollection", features: servicedFeatures });
        if (servicedFeatures.length) map.fitBounds(servicedLayer.getBounds(), { padding: [24, 24] });
        countyLayer.bringToFront();
    } catch (error) {
        // leave a clue in the console, not a big error on the page.
        console.warn("Service-area boundaries could not be loaded.", error);
    }

    // --- our home base --- city-level location, not a private street address.
    const parmaIcon = L.divIcon({
        className: "parma-marker",
        html: '<span class="marker-m">M</span><span class="marker-as">&amp;S</span>',
        iconSize: [76, 48], iconAnchor: [38, 24], popupAnchor: [0, -24],
    });
    L.marker([41.4048, -81.7229], { icon: parmaIcon, alt: "M&S CORNERSTONE — Parma", title: "M&S CORNERSTONE" }).addTo(map).bindPopup("<strong>M&amp;S CORNERSTONE</strong><br>Based in Parma, Ohio");

    // give layout a moment, then ask Leaflet to measure again.
    window.setTimeout(() => map.invalidateSize(), 180);
}

initializeServiceMap();

/* --- copyright --- one less thing to edit every January. */
document.querySelector("#current-year").textContent = new Date().getFullYear();

/* --- reel sizing --- tell Facebook the real container size, not just CSS width. */
const reelFrame = document.querySelector(".video-frame iframe");
if (reelFrame && window.ResizeObserver) {
    let resizeTimer;
    const observer = new ResizeObserver(() => {
        clearTimeout(resizeTimer); // don't reload the iframe on every pixel of a resize.
        resizeTimer = setTimeout(() => {
            const width = Math.round(reelFrame.parentElement.clientWidth);
            if (width < 180) return;
            const height = Math.round(width * 16 / 9);
            const url = new URL(reelFrame.src);
            if (Number(url.searchParams.get("width")) === width) return;
            url.searchParams.set("width", String(width));
            url.searchParams.set("height", String(height));
            reelFrame.width = String(width);
            reelFrame.height = String(height);
            reelFrame.src = url.toString();
        }, 250);
    });
    observer.observe(reelFrame.parentElement);
}

/* --- Facebook stats --- failure means "keep what we have", never show zero. */
async function refreshFacebookStats() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
        const response = await fetch("/api/facebook-stats", { signal: controller.signal, cache: "no-store" });
        if (!response.ok) return;
        const stats = await response.json();
        for (const key of ["followers", "reviews"]) {
            if (Number.isSafeInteger(stats[key]) && stats[key] >= 0) {
                document.querySelector(`#facebook-${key}`).textContent = stats[key].toLocaleString("en-US");
            }
        }
        // Recommendation percentage stays a saved snapshot; stars aren't percentages.
        if (Array.isArray(stats.live_fields) && stats.live_fields.length) {
            const fields = stats.live_fields.filter((key) => ["followers", "reviews"].includes(key)).join(" and ");
            if (fields) document.querySelector("#facebook-stats-note").textContent =
                `Facebook ${fields} refreshed within the last six hours. Recommendation percentage is the last recorded figure.`;
        }
    } catch {
        // offline, blocked, or timeout — the server-rendered snapshot stays put.
    } finally {
        clearTimeout(timer);
    }
}
refreshFacebookStats();
