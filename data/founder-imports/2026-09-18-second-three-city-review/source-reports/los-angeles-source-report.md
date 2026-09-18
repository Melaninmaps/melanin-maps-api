# Los Angeles Local Directory Research Wave — Source Report

**Scope.** One bounded, read-only research pass for Los Angeles, California, and nearby Los Angeles County suburbs, completed on **2026-09-18**. The retained file includes public municipal directory records with a numbered physical street address in the defined area, an evidence-supported source category, and a customer-facing destination that responded in this pass. It also includes two directly sourced business-community organizations as **community resources**, distinct from commercial businesses.

## Counts

| Measure | Count |
|---|---:|
| Retained candidates | 170 |
| Held records | 301 |
| Municipal records read | 469 |
| Primary source URLs inspected | 9 |
| Customer-facing destination URLs checked and listed | 169 |
| Distinct URLs listed in this report | 176 (two destinations also appear among the primary sources) |

## Primary Source URLs Inspected

1. [City of Los Angeles GeoHub — Black Owned Businesses](https://geohub.lacity.org/datasets/lahub::black-owned-businesses-1) — metadata/summary page. It describes the dataset as a list of 600+ Black-owned businesses, shows 469 records, and reports its data update date as 2021-01-22.
2. [City feature-layer metadata](https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/Black_Owned_Businesses/FeatureServer/0?f=pjson) — schema and field inspection.
3. [City feature-layer data query](https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/Black_Owned_Businesses/FeatureServer/0/query?f=json&where=1%3D1&outFields=F__OBJECTID%2Cname%2Cdisplay_name%2Ccategories%2Cdisplay_categories%2Cdescription%2Caddress%2Cphone%2Cwebsite%2Csource&returnGeometry=false&resultRecordCount=2000) — read-only retrieval of all public records and the record-level source used in `candidates.jsonl`.
4. [Black Owned Los Angeles — All Business Listings](https://blackownedlosangeles.com/directory/all) — public Black-business directory inspected for discovery/category coverage; not used as row-level evidence because its public listing did not expose a customer-facing destination per listing in the extracted page.
5. [Discover Los Angeles — Guide to Black Owned Businesses](https://www.discoverlosangeles.com/visit/the-guide-to-black-owned-businesses-in-la) — public guide inspected for discovery/context; not used as row-level evidence where an exact street address and official destination were absent in extracted detail.
6. [Greater Los Angeles African American Chamber of Commerce](https://glaaacc.org/) — official site used as direct evidence for the retained community-resource record.
7. [Los Angeles Latino Chamber of Commerce](https://www.lalcc.org/) — official site used as direct evidence for the retained community-resource record.
8. [Los Angeles Latino Chamber of Commerce directory](https://www.lalcc.org/Directory) — inspected but login-gated; no member records used.
9. [Search discovery URL](https://www.google.com/search?q=Los+Angeles+Latino+Chamber+business+directory) — inspected only to discover potential public Latino chamber sources; no search snippets used as evidence.

## Customer-Facing Destination URLs Inspected

The following destinations were checked with read-only HTTP requests. HTTP reachability only indicates that the public URL responded; it does **not** establish current operation, ownership, quality, licensing, availability, or the full scope of services.

- http://ackeebamboojacuisine.com/ — HTTP 200
- http://awash.cafes-world.com/?fbclid=IwAR0qaupV4ZIPPgn0ClWlYCzX-Bw5HmrN6S6eYzjwpxofVzyEfqkAVYoKaJY — HTTP 200
- http://bandrburgers.com/ — HTTP 200
- http://days-bbq-and-waffle.top-cafes.com/ — HTTP 200
- http://divinedipsicecreme.com/ — HTTP 200
- http://everlastingbbq.com/Home_Page.html — HTTP 200
- http://honeyskettle.com/ — HTTP 200
- http://jangabyderricks.com/ — HTTP 200
- http://jerkspotla.com/index.html — HTTP 200
- http://jrs-bbq.com/ — HTTP 200
- http://kensicecream.net/ — HTTP 200
- http://marscaribbean.com/ — HTTP 200
- http://mealsbygenetla.com/ — HTTP 200
- http://mytwocentsla.com/ — HTTP 200
- http://orleansandyorkdeli.com — HTTP 200
- http://robertearlsbbq.com/ — HTTP 200
- http://tacomell.net/ — HTTP 200
- http://thekobblerking.com/ — HTTP 200
- http://trencherla.com — HTTP 200
- http://www.brotherbarbequecatering.com — HTTP 200
- http://www.bundtsonmelrose.com/ — HTTP 200
- http://www.faithblakeney.com/ — HTTP 200
- http://www.familyfishmarket.com/ — HTTP 200
- http://www.hawkinsburgers.com/ — HTTP 200
- http://www.lavenderbluela.com/ — HTTP 200
- http://www.mamaschicken.name/ — HTTP 200
- http://www.saycheeselosangeles.com/ — HTTP 200
- http://www.steviescreolecafe.com/ — HTTP 200
- http://www.theblvdkitchen.com/ — HTTP 200
- http://www.twinssmokehouse.com/ — HTTP 200
- http://www.undergrindcafe.com/ — HTTP 200
- https://27thstreetbakery.com/ — HTTP 200
- https://abeautifulcalflorist.com — HTTP 202
- https://azlavegan.com/ — HTTP 200
- https://beyondveganlifestyle.com/ — HTTP 200
- https://bringsomethingtothepartyla.com — HTTP 200
- https://bunaethiopianmarket.com/ — HTTP 200
- https://caamuseum.org/ — HTTP 200
- https://caferuisseau.com/ — HTTP 200
- https://cakebuzzla.com/ — HTTP 200
- https://cobblerfactorypasadena.com/ — HTTP 200
- https://cobblerscakesandkream.com/ — HTTP 200
- https://comptonvegan.com/ — HTTP 200
- https://dmyla.com/ — HTTP 200
- https://downtownla.com/go/funculo — HTTP 200
- https://dulansoncrenshaw.com/ — HTTP 200
- https://earlesrestaurant.com/ — HTTP 200
- https://eatnest.com/ — HTTP 200
- https://girlcavela.com — HTTP 200
- https://glaaacc.org/ — HTTP 200
- https://happyicela.com/ — HTTP 200
- https://haroldandbelles.com/ — HTTP 200
- https://harunintl.com/ — HTTP 200
- https://hotandcoolcafe.com/ — HTTP 200
- https://ittpattyhut.com/ — HTTP 200
- https://jackfruitcafe.com/ — HTTP 200
- https://jamzcreamery.com/ — HTTP 200
- https://jjbbqfish.com/ — HTTP 200
- https://jordanshotdogsla.com/ — HTTP 200
- https://littleamsterdamcoffee.net/ — HTTP 200
- https://littlebelizerestaurant.com/ — HTTP 200
- https://locations.papajohns.com/united-states — HTTP 200
- https://m-and-t-donuts.square.site/ — HTTP 200
- https://maaala.org/ — HTTP 200
- https://malikbooks.com/ — HTTP 200
- https://melsfishshack.com/ — HTTP 200
- https://minglesteabar.com/ — HTTP 200
- https://nobodyjones.bigcartel.com/ — HTTP 200
- https://perrysjoint.com/ — HTTP 200
- https://phatbirds.com/ — HTTP 200
- https://pinkyroseboutique.com/ — HTTP 200
- https://powderbeautyco.com — HTTP 200
- https://rep.club/ — HTTP 200
- https://rosalindsla.com — HTTP 200
- https://rustypotcafe.com/ — HTTP 200
- https://shadesofafrika.com/ — HTTP 200
- https://shopkutula.com/ — HTTP 200
- https://silverbackcoffee.com/ — HTTP 200
- https://simplydliciousla.com/ — HTTP 200
- https://store.unionlosangeles.com/ — HTTP 200
- https://swift-la.com/ — HTTP 200
- https://tacobarla.com/ — HTTP 200
- https://the-underground-museum.square.site/#KTHjFY — HTTP 200
- https://thejuicela.com/ — HTTP 200
- https://theservingspoon.net/ — HTTP 200
- https://www.1ofakindhats.com/ — HTTP 200
- https://www.2ndhealthyeatery.com/home — HTTP 200
- https://www.aaffmuseum.org/ — HTTP 200
- https://www.aarmy.com/home — HTTP 200
- https://www.altaadams.com/ — HTTP 200
- https://www.antiquestoveheaven.com/ — HTTP 200
- https://www.bandofvices.com/ — HTTP 200
- https://www.barandque.com/ — HTTP 200
- https://www.barshalife.com/ — HTTP 200
- https://www.bayougrille.net/ — HTTP 200
- https://www.bestturkeyburgerlosangeles.com/ — HTTP 200
- https://www.bigchicken.com — HTTP 200
- https://www.blessedbeautysupply.com — HTTP 200
- https://www.bodaddys.com/ — HTTP 200
- https://www.bohemianchai.com/ — HTTP 200
- https://www.bonniebssmokin.com/ — HTTP 200
- https://www.brandoni-pepperoni.com/ — HTTP 200
- https://www.busybaking.info/ — HTTP 200
- https://www.castlescatering.com — HTTP 200
- https://www.chefmarilyns2638.com/ — HTTP 200
- https://www.crusteeseatery.com/ — HTTP 200
- https://www.culturalinteriors.com/ — HTTP 200
- https://www.damoneroberts.com/ — HTTP 200
- https://www.darrowsneworleansgrill.com/ — HTTP 200
- https://www.delvignecroissant.com/ — HTTP 200
- https://www.dulans-sfk.com/ — HTTP 200
- https://www.eatcomfortla.com/ — HTTP 200
- https://www.esowonbookstore.com/ — HTTP 200
- https://www.facebook.com/Leesmarketcatering/ — HTTP 200
- https://www.facebook.com/camillesbakes4u/ — HTTP 200
- https://www.facebook.com/milehighcheesecakes — HTTP 200
- https://www.facebook.com/pages/Sikas/111019782374615 — HTTP 200
- https://www.facebook.com/pages/category/African-Restaurant/Veronicas-Kitchen-115691395180607/ — HTTP 200
- https://www.facebook.com/parrainssoulfood/ — HTTP 200
- https://www.facebook.com/phatdaddyss/ — HTTP 200
- https://www.facebook.com/wherewe — HTTP 200
- https://www.findyourhilltop.com/ — HTTP 200
- https://www.haroldschickenla.com/ — HTTP 200
- https://www.hotvillechicken.com/ — HTTP 200
- https://www.instagram.com/_munchiemadness/ — HTTP 200
- https://www.instagram.com/allflavornogrease/ — HTTP 200
- https://www.instagram.com/caribbeangourmet/ — HTTP 200
- https://www.instagram.com/cobblermania/?hl=en — HTTP 200
- https://www.instagram.com/grilledfraiche/ — HTTP 200
- https://www.instagram.com/jamaicaonthego/ — HTTP 200
- https://www.instagram.com/superiorframesla/?hl=en — HTTP 200
- https://www.instagram.com/tacosnegrosla/ — HTTP 200
- https://www.instagram.com/vanillablackla/ — HTTP 200
- https://www.jamafoxpress.com/ — HTTP 200
- https://www.lalcc.org/ — HTTP 200
- https://www.lalibelala.com/ — HTTP 200
- https://www.leberrybakery.com — HTTP 200
- https://www.leeesthers.com — HTTP 200
- https://www.louthefrenchontheblock.com/ — HTTP 200
- https://www.mdears.net/ — HTTP 200
- https://www.messob.com/ — HTTP 200
- https://www.mrfriesman.com/ — HTTP 200
- https://www.msbsmandmsoulfoodrestaurant.com/ — HTTP 200
- https://www.naildega.com — HTTP 200
- https://www.patriacoffee.com/ — HTTP 200
- https://www.redsflavortable.com/ — HTTP 200
- https://www.rideonbikeshop.com/ — HTTP 200
- https://www.roscoeschickenandwaffles.com/ — HTTP 200
- https://www.shoprunwayboutiquela.com/ — HTTP 200
- https://www.simplywholesome.com/ — HTTP 200
- https://www.sipandsonder.com/ — HTTP 200
- https://www.sosorella.com — HTTP 200
- https://www.southerngirldesserts.com/ — HTTP 200
- https://www.southlacafe.com/ — HTTP 200
- https://www.speirpilates.com/ — HTTP 200
- https://www.stuffieat.com/ — HTTP 200
- https://www.sweetblessingsla.com/ — HTTP 200
- https://www.sweetredpeach.com/ — HTTP 200
- https://www.tamuseum.org/ — HTTP 200
- https://www.tandtlifestylelosangeles.com/ — HTTP 200
- https://www.thecorner10th.com/ — HTTP 200
- https://www.thelacelounge.com/ — HTTP 200
- https://www.thememphisgrill.com/ — HTTP 200
- https://www.thesmallshopla.com/ — HTTP 200
- https://www.thrivehealthlab.com/ — HTTP 200
- https://www.whoshungrycatering.com/ — HTTP 200
- https://www.wijammincafe.com/ — HTTP 200
- https://www.wilsonsbbqribshack.com/ — HTTP 200
- https://www.yourbakery1st.com/ — HTTP 200

## Inclusion, Holding, and Classification Method

The municipal layer supplied names, categories, address strings, phone values when present, website values, and a category label. A row was retained only when its source address began with a number, parsed to an included local city plus CA, and its non-marketplace customer-facing URL returned HTTP 2xx/3xx or a public-access 401/403 response. Known review, map, delivery, and reservation marketplaces were not treated as official destinations. Where the directory’s `website` field was an Instagram, Facebook, or TikTok URL, it was placed in the corresponding social field rather than claimed as a conventional website.

A category was translated conservatively from the source’s displayed category. Museum/cultural/shared-space records were routed to `cultural_place`; the two chambers are `community_resource`. Names/descriptions that expressly signaled legal, medical/healthcare, finance/real-estate, or childcare/education professional offerings were routed to `regulated_review`, with `regulatedProfession` explicitly saying that licensing was **not** verified. No ownership conclusion was drawn merely from a chamber relationship.

`ownershipDesignations` for municipal entries reflect only the source’s dataset-level Black-owned designation. The chamber entries describe each chamber’s stated community focus, not the ownership of its members. Exact normalized name + city + state + address duplicates were suppressed against records collected in this pass only.

## Factual Limitations

The City dataset’s reported data update date is **2021-01-22**. A currently responding destination does not prove that a listed business remains open at the same location or retains a claimed identity/ownership status. It was therefore not used to infer hours, ownership details beyond the directory designation, language ability, licensing, accessibility, inventory, availability, service details, or quality. No latitude or longitude was retained. Local coverage is necessarily incomplete, and this pass does not represent an exhaustive census. The LALCC site labels its published street address as a **mailing address**, which is recorded with that qualification.

## Publication / System Boundary

**No production database, API, account, or publication endpoint was called, modified, or used.** The activity consisted solely of public, unauthenticated, read-only web retrieval and local UTF-8 JSONL/report generation.
