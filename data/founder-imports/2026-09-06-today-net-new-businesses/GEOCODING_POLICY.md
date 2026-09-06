# U.S. Address Geocoding Policy

The U.S. rows in this batch use the official U.S. Census Geocoder batch service with benchmark `Public_AR_Current`.

The official API documentation states that batch requests accept up to 10,000 records and require a unique ID, street address, city, state, and ZIP columns. The service covers the United States, Puerto Rico, and U.S. Island Areas. It returns latitude and longitude based on address data in the Master Address File/Topologically Integrated Geographic Encoding and Referencing database.

The Census technical documentation states that returned coordinates are interpolated or approximated along TIGER address ranges. Therefore, accepted coordinates in this batch must be described as **exact address matches with interpolated address-range coordinates**, not rooftop coordinates and not Mapping With Melanin verification of the business.

The validator accepts a pin only when the Census response reports `Match` and `Exact`, returns valid non-Null-Island coordinates, matches the supplied state, matches the supplied ZIP when present (or city when ZIP is absent), and preserves the supplied numeric house number. All other results remain unpinned.

## References

[1]: https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html "U.S. Census Geocoding Services API"
[2]: https://www.census.gov/programs-surveys/geography/technical-documentation/complete-technical-documentation/census-geocoder.html "U.S. Census Geocoder Documentation"
