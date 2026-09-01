/* navigation — компактне меню для телефонів і вузьких екранів. */
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

/* ---------- GALLERY CONTROLS: mouse, touch scrolling, and keyboard arrows. ---------- */
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

/* !!! SERVICE COUNTIES !!! Edit these two lists when the coverage area changes. */
const regularCounties = new Set(["Cuyahoga", "Lorain", "Medina", "Summit", "Lake", "Geauga"]);
const caseCounties = new Set(["Erie", "Huron", "Ashland", "Wayne", "Portage", "Ashtabula"]);

/* МАПА: if Leaflet cannot load, the rest of the website must still work normally. */
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

    /* live OpenStreetMap tiles provide roads beneath our LOCAL county boundaries. */
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    try {
        /* ЛОКАЛЬНИЙ GEOJSON — real county shapes, no fake service circles. */
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

        /* == FIT VIEW == keep every active service county visible with breathing room. */
        const servicedFeatures = countyData.features.filter((feature) => {
            const name = feature.properties.NAME || feature.properties.name || "";
            return regularCounties.has(name) || caseCounties.has(name);
        });
        const servicedLayer = L.geoJSON({ type: "FeatureCollection", features: servicedFeatures });
        if (servicedFeatures.length) map.fitBounds(servicedLayer.getBounds(), { padding: [24, 24] });
        countyLayer.bringToFront();
    } catch (error) {
        /* developer note only; не показуємо технічну помилку відвідувачам. */
        console.warn("Service-area boundaries could not be loaded.", error);
    }

    /* PARMA BASE MARKER ★ coordinates can be changed if the base moves. */
    const parmaIcon = L.divIcon({ className: "parma-marker", html: "SP", iconSize: [38, 38], iconAnchor: [19, 19] });
    L.marker([41.4048, -81.7229], { icon: parmaIcon }).addTo(map).bindPopup("<strong>Sem Pro Remodeling</strong><br>Based in Parma, Ohio");

    /* Recalculating after layout prevents partial gray tiles in responsive containers. */
    window.setTimeout(() => map.invalidateSize(), 180);
}

initializeServiceMap();

/* рік у copyright оновлюється АВТОМАТИЧНО from the visitor's device clock. */
document.querySelector("#current-year").textContent = new Date().getFullYear();
