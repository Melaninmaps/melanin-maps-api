# Geocoding policy note

The official OpenStreetMap Foundation Nominatim usage policy was reviewed on 2026-09-06 UTC: <https://operations.osmfoundation.org/policies/nominatim/>.

The public service sets an absolute maximum of one request per second, requires a valid application-identifying User-Agent or Referer and attribution, and requires caching. Larger bulk geocoding is not encouraged. Any one-time bulk process must use one thread on one machine; long-running or recurring jobs are limited to four requests per minute. Commercial applications are directed toward a third-party provider or a self-hosted Nominatim instance for larger or regular workloads.

**Operational conclusion:** the public Nominatim fallback may support occasional tester-submitted addresses with server caching, but it will not be used to enrich thousands of founder records. Large-scale enrichment requires a separately selected commercial provider or a self-hosted geocoder. Until then, city-only founder candidates remain searchable only after an explicit product decision to allow unpinned city-level listings; they must never receive fabricated city-center business pins.
