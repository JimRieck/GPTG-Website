import type { MapData } from "@/lib/maps/world-map-data";
import { shadeOpacity } from "@/lib/traffic-geo";

/**
 * A clickable map. Each shape is a plain link, so it works without JavaScript and with the keyboard.
 * Shapes with hits are shaded by volume. The selected shape gets a gold outline.
 */
export default function LocationMap({
  map,
  hits,
  selectedId,
  hrefFor,
  label,
}: {
  map: MapData;
  hits: Map<string, number>; // keyed by lower-case map id
  selectedId?: string;
  hrefFor: (id: string) => string;
  label: string;
}) {
  const max = Math.max(0, ...[...hits.values()]);

  return (
    <svg viewBox={map.viewBox} className="geo-map" role="group" aria-label={label}>
      {map.locations.map((loc) => {
        const count = hits.get(loc.id) ?? 0;
        const isSelected = loc.id === selectedId;
        const opacity = shadeOpacity(count, max);
        const description = `${loc.name}: ${count} ${count === 1 ? "hit" : "hits"}`;
        return (
          <a key={loc.id} href={hrefFor(loc.id)} aria-label={description} aria-current={isSelected ? "true" : undefined}>
            <path
              d={loc.path}
              className={`geo-shape${isSelected ? " is-selected" : ""}`}
              style={count > 0 ? { fill: "var(--green-700)", fillOpacity: opacity } : undefined}
            >
              <title>{description}</title>
            </path>
          </a>
        );
      })}
    </svg>
  );
}
