# MWM Railway Authenticated Map Findings

After signing in with tester account 01, `/map` loads the authenticated navigation and map page.

The page exposes a search input with placeholder `Search businesses, heritage, events — press Enter`, mood filters, category filters, and `Use My Location`. However, the main map area explicitly displays **“Interactive map coming soon”** and states: **“Browse businesses from the list on the left. The full map with location pins will be available in production.”**

This is a confirmed tester-facing blocker for the requested map functionality. The API returned 743 discoverability pins, but the deployed UI does not render an interactive map or those pins. The user can see filters and a search interface, but not the actual map experience requested.

The page also contains a KinfolkAI floating prompt and navigation links to Library, Events, Businesses, Safety, and For Business Owners.
