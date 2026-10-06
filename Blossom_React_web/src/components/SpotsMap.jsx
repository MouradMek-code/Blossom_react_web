import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DEFAULT_VIEW, TILE_ATTRIBUTION, TILE_URL, mapPoints, pointsKey } from "../api/spotMap";
import styles from "./SpotsMap.module.css";

// The date spots on OpenStreetMap: a pin per spot (🎁 for the gifts), its
// name on hover, and a click opens its card (onOpen). The map fits the pins
// each time they change - filters, search - and otherwise stays where the
// person moved it.
export default function SpotsMap({ spots, onOpen }) {
  const box = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const latest = useRef({ spots, onOpen });
  latest.current = { spots, onOpen };

  const points = mapPoints(spots);
  const key = pointsKey(points);

  useEffect(() => {
    const map = L.map(box.current, {
      // The page scrolls with the wheel; zoom with the buttons or pinch.
      scrollWheelZoom: false,
      center: [DEFAULT_VIEW.lat, DEFAULT_VIEW.lng],
      zoom: DEFAULT_VIEW.zoom,
    });
    L.tileLayer(TILE_URL, { maxZoom: 19, attribution: TILE_ATTRIBUTION }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    const current = mapPoints(latest.current.spots);
    current.forEach((point) => {
      const icon = L.divIcon({
        className: styles.pinWrap,
        // Only an emoji goes in as HTML; the name (typed by members) is set
        // as text below.
        html: `<span class="${styles.pin} ${point.gift ? styles.pinGift : ""}"><span class="${styles.pinEmoji}">${point.emoji}</span></span>`,
        iconSize: [38, 46],
        iconAnchor: [19, 44],
        tooltipAnchor: [0, -40],
      });
      const label = document.createElement("span");
      label.textContent = point.name;
      L.marker([point.lat, point.lng], { icon, riseOnHover: true, zIndexOffset: point.gift ? 1000 : 0, keyboard: true, title: point.name })
        .bindTooltip(label, { direction: "top" })
        .on("click", () => {
          const spot = latest.current.spots.find((s) => s.id === point.id);
          if (spot) latest.current.onOpen(spot);
        })
        .addTo(layer);
    });
    if (current.length === 1) {
      map.setView([current[0].lat, current[0].lng], 15);
    } else if (current.length > 1) {
      map.fitBounds(L.latLngBounds(current.map((p) => [p.lat, p.lng])), { padding: [48, 48], maxZoom: 15 });
    }
  }, [key]);

  return <div ref={box} className={styles.map} />;
}
