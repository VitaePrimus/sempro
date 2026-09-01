/* ---------- Mobile navigation keeps links compact on narrow screens. ---------- */
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");

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

/* ---------- Gallery controls scroll one card at a time and also support arrow keys. ---------- */
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

/* ---------- County groups control the two service tiers displayed by the map. ---------- */
const regularCounties = new Set(["Cuyahoga", "Lorain", "Medina", "Summit", "Lake", "Geauga"]);
const caseCounties = new Set(["Erie", "Huron", "Ashland", "Wayne", "Portage", "Ashtabula"]);

/* ---------- Map setup is guarded so the rest of the page still works if Leaflet fails. ---------- */
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

    /* OpenStreetMap tiles provide roads and city context beneath exact county shapes. */
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    try {
        /* Local GeoJSON avoids the distorted circles used by the earlier map design. */
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

        /* Fit the full service region with padding so county edges remain visible. */
        const servicedFeatures = countyData.features.filter((feature) => {
            const name = feature.properties.NAME || feature.properties.name || "";
            return regularCounties.has(name) || caseCounties.has(name);
        });
        const servicedLayer = L.geoJSON({ type: "FeatureCollection", features: servicedFeatures });
        if (servicedFeatures.length) map.fitBounds(servicedLayer.getBounds(), { padding: [24, 24] });
        countyLayer.bringToFront();
    } catch (error) {
        /* A console message helps development without exposing technical errors to visitors. */
        console.warn("Service-area boundaries could not be loaded.", error);
    }

    /* A branded marker identifies Parma as the base of operations. */
    const parmaIcon = L.divIcon({ className: "parma-marker", html: "SP", iconSize: [38, 38], iconAnchor: [19, 19] });
    L.marker([41.4048, -81.7229], { icon: parmaIcon }).addTo(map).bindPopup("<strong>Sem Pro Remodeling</strong><br>Based in Parma, Ohio");

    /* Recalculating after layout prevents partial gray tiles in responsive containers. */
    window.setTimeout(() => map.invalidateSize(), 180);
}

initializeServiceMap();

/* ---------- The copyright year updates automatically without manual maintenance. ---------- */
document.querySelector("#current-year").textContent = new Date().getFullYear();
