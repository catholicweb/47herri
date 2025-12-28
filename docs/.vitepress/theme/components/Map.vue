<template>
  <div class="map py-8 max-w-3xl mx-auto md:px-4">
    <div class="w-full h-96 overflow-hidden md:shadow-md">
      <div ref="mapContainer" class="w-full h-full z-0"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { data } from "./../../blocks.data.js";
import { useData, useRoute } from "vitepress";
const { page } = useData();
const route = useRoute();

const props = defineProps({
  block: { type: Object, required: true },
});

const mapContainer = ref(null);
let map = null;
let markersLayer = null;

async function loadCSS(url) {
  return new Promise((resolve, reject) => {
    // Check if the CSS is already loaded
    if (!document.querySelector(`link[href="${url}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = url;
      link.onload = resolve;
      link.onerror = reject;
      document.head.appendChild(link);
    } else {
      resolve(); // CSS already loaded
    }
  });
}

watch(
  () => page.value.frontmatter.lang,
  (lang) => renderMarkers(lang),
);

const allMaps = ref([]);

onMounted(async () => {
  if (!mapContainer.value) return;

  await loadCSS("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
  await import("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");

  // Optionally load additional plugins (like fullscreen)
  await loadCSS("https://api.mapbox.com/mapbox.js/plugins/leaflet-fullscreen/v1.0.1/leaflet.fullscreen.css");
  await import("https://api.mapbox.com/mapbox.js/plugins/leaflet-fullscreen/v1.0.1/Leaflet.fullscreen.min.js");

  // Try load the geojson file (if any)
  fetch("/map.geojson")
    .then((response) => response.json()) // Convert the response to JSON
    .then((data) => {
      L.geoJSON(data).addTo(map);
    })
    .catch((error) => {
      console.info("Unable to load geoJSON");
    });

  var supportsTouch = "ontouchstart" in window || navigator.msMaxTouchPoints;

  const map = L.map(mapContainer.value, { fullscreenControl: true, zoomControl: !supportsTouch });

  const latLngBounds = data.maps.map((m) => m.geo?.split(",").map((s) => Number(s.trim())));

  var bounds = L.latLngBounds(latLngBounds);

  map.fitBounds(bounds, { padding: [40, 40] });

  L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", { attribution: "Voyager", maxZoom: 24 }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);

  renderMarkers(page.value.frontmatter.lang);
});

function renderMarkers(lang) {
  if (!markersLayer) return;

  // Create a smaller icon
  const smallIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [15, 25], // Width and Height in pixels (Original is 25x41)
    iconAnchor: [7, 25], // The point of the icon which will correspond to marker's location
    popupAnchor: [1, -20], // Point from which the popup should open relative to the iconAnchor
    shadowSize: [25, 25], // Shadow needs scaling too
  });

  markersLayer.clearLayers();
  data.maps
    .filter((m) => m.lang === lang && m.geo)
    .forEach((m) => {
      const g = m.geo.split(",").map((s) => Number(s.trim()));

      const html = `
        <a href="${m.url}">
          <h3 class="text-xl font-bold text-center text-accent">${m.name}</h3>
          <div style="background:white">
            <img src="${m.image}" style="width:100%;aspect-ratio:16/9;object-fit:cover" />
          </div>
        </a>
      `;

      const marker = L.marker(g, { icon: smallIcon }).bindPopup(html).addTo(markersLayer);

      if (m.url == route.path) {
        marker._icon.classList.add("special");
      } else {
        marker._icon.classList.add("grayscale opacity-50");
      }
    });
}
</script>

<style>
.leaflet-pane .leaflet-marker-pane img {
  filter: hue-rotate(calc(var(--accent-angle) - 204deg));
}

.leaflet-pane .leaflet-marker-pane img.special {
  filter: hue-rotate(calc(var(--primary-angle) - 204deg));
}

.leaflet-popup-content-wrapper {
  padding: 0px !important;
  overflow: hidden;
}

.leaflet-popup {
  width: 300px; /* Increase or decrease the width */
  max-width: 400px; /* Optional: max-width, to prevent the popup from getting too large */
}

.bounce {
  animation: bounce 0.6s infinite alternate ease-in-out;
}

.leaflet-popup-content {
  min-width: 100%;
  min-height: 100%;
  margin: 0px !important;
}

body .leaflet-container a.leaflet-popup-close-button {
  top: 1px;
  right: 3px;
  font: inherit;
  font-weight: bold;
  font-size: large;
}

@keyframes bounce {
  0% {
    transform: translateY(0);
  }

  100% {
    transform: translateY(-10px);
  }
}

.leaflet-pane > svg path.leaflet-interactive {
  stroke: none;
  fill: red;
}
</style>
