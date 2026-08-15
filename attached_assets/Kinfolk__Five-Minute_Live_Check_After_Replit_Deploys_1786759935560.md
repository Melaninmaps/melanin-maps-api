# Kinfolk: Five-Minute Live Check After Replit Deploys

Do not call the patch complete until every row below passes on the real website.

| Step | Enter or do this | A passing result |
| --- | --- | --- |
| 1 | Type `Tell me about Philly nightlife` | Kinfolk begins a Philadelphia nightlife search. It does **not** ask which city you mean. |
| 2 | Check the response details/logs | The result has `city: Philadelphia`, `state: PA`, and `locationSource: alias`. |
| 3 | Type `Black-owned nightlife in Philly` while your Black-woman profile is active | Kinfolk shows Black cultural, Black-owned, and diaspora-relevant results first, with source links. |
| 4 | Type `Tell me about nightlife` with no city and no saved prior city | Kinfolk asks which city, neighborhood, or metro area to use. |
| 5 | Record a real two-second voice message | Kinfolk transcribes it or gives the real upload/readability problem. It never says the clip is over 60 seconds. |
| 6 | Record a clip over 60 seconds | Kinfolk gives the actual 60-second message. |

> If Step 1 fails, the alias resolver is being called too late—move `resolveLocation(message, sessionLocation)` above the missing-location condition in the `POST /api/kinfolk/chat` server route.

> If Step 5 fails with a 413 response, inspect the server log by request ID. The UI must show an upload-size message, not a duration message.
