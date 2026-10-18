import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import countries110m from 'world-atlas/countries-110m.json';

export type GeoPoint = [latitude: number, longitude: number];

// Natural Earth's 1:110m coastline data is detailed enough to recognise every
// continent and major island group while remaining appropriate for a canvas globe.
const WORLD_TOPOLOGY = countries110m as unknown as Topology<{
  countries: GeometryCollection;
}>;

export const WORLD_LANDMASSES: GeoPoint[][] = feature(
  WORLD_TOPOLOGY,
  WORLD_TOPOLOGY.objects.countries,
).features.flatMap(({ geometry }) => {
  const outerRings = geometry.type === 'Polygon'
    ? [geometry.coordinates[0]]
    : geometry.type === 'MultiPolygon'
      ? geometry.coordinates.map((polygon) => polygon[0])
      : [];

  return outerRings.map((ring) => ring.map(([longitude, latitude]): GeoPoint => [latitude, longitude]));
});
