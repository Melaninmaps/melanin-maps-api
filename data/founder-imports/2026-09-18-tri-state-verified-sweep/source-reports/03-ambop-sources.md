# Source report: Association of Mexican Business Owners of Philadelphia (AEM Philly)

## Scope and source family

This source-by-source pass covered the public AEM Philly website and its publicly discoverable business/member URL family for Philadelphia and Southeastern Pennsylvania. The association describes its network as supporting Latino-owned businesses and publishes a public business network page. The source-specific designation is treated only as a voluntary association listing; no identity, ethnicity, language, licensing, or service claim was inferred beyond what the source or independently opened official destination expressly stated.

## Actual source URLs used

| URL | Use |
|---|---|
| https://aemphilly.org/en/our-association/ | Public association business network page; current visible listing set, categories, names, addresses, links and remote-business labels. |
| https://aemphilly.org/wp-sitemap.xml | Public sitemap index used to discover the members and businesses sitemap families. |
| https://aemphilly.org/businesses-sitemap.xml | Public businesses sitemap; traversed all 34 unique business profile URLs listed there. |
| https://aemphilly.org/members-sitemap.xml | Public member sitemap; confirmed only leadership/member profile URLs, not a business directory. |
| https://aemphilly.org/en/become-a-member/ | Public membership page; confirms application process but no public member list. |
| https://aemphilly.org/en/leadership-and-board/ | Public leadership page; confirms board listings but no business addresses or official business destinations. |
| https://aemphilly.org/en/ | Official homepage and navigation check. |
| https://aemphilly.org/newstaging/en/contact-us/ | Public contact page/navigation check. |
| https://consultorias.lovable.app/ | Public member portal check; access is restricted to active members and exposes no public directory. |
| https://laingratacamden.com/ | Official customer website independently opened for La Ingrata; confirms address, phone, hours, menu/services and official social links. |
| https://www.southphillysalonunisex.com/ | Official customer website independently opened for South Philly Salon Unisex; confirms address, phone, hours and Instagram. |
| https://www.instagram.com/nuuxakun/ | Official social destination independently opened; confirms Mexican folklore profile and class schedule. |
| https://www.instagram.com/nocheztli_clothing/ | Official social destination independently opened; confirms Nocheztli identity, product description and Shopify link. |
| https://nocheztliclothing.myshopify.com/ | Customer website linked from the official Nocheztli Instagram; opened as the official shop destination. |
| https://www.instagram.com/sparklecreations25/ | Official social destination independently opened; confirms Sparkle Creation identity, handmade products and Etsy shop link. |
| https://www.etsy.com/ca/shop/Sparkle825 | Customer destination linked from the official Sparkle Creation Instagram. |
| https://renteriaolga.com/ | Official customer website independently opened; confirms interpreting/translation services and phone, but no exact street address. |
| https://www.instagram.com/olga_renteria_/ | Official social destination independently opened for cross-checking Olga Renteria identity. |

## Pages/ranges traversed

The current public association page was opened and its visible listing area was traversed through the displayed `Load More` boundary. It exposed a current visible set including La Ingrata, Ñuuxakun, Nocheztli Clothing, Sparkle Creation, South Philly Salon Unisex and Olga Renteria. The public `businesses-sitemap.xml` was then traversed in full: 34 unique business profile URLs, spanning `philatinos` through `la-ingrata`, including older 2024 profiles and newer 2026 profiles. Individual profile pages were opened for the first ten older profiles to test whether profile detail pages contained usable listing data; those pages rendered only names, navigation and site chrome, without public exact addresses or official business links. The sitemap therefore served as the complete candidate URL range, while the association page served as the usable current listing source.

The public `members-sitemap.xml` was opened in full. It contained the members index and duplicated profile URLs for Monica Herrera, Karina Sánchez, Felipa Ventura and Andrés Hernández. The leadership page was opened and checked; these are association leaders, not public business directory records with the required address and independently verified official business destination. The member portal was opened and found to require member email access.

## Candidate counts

| Target kind | Count | Category breakdown |
|---|---:|---|
| business | 2 | food_and_drink: 1; personal_care: 1 |
| online_business | 4 | education_and_training: 1; retail: 2; professional_services: 1 |
| community_resource | 0 | No houses of worship, nonprofits, mutual aid, food support, family/parent support, elder/disability support, education/training organizations, funeral services, shelters, civic-support organizations or community centers were publicly listed by this AEM source with an exact street address and independently opened official destination. |
| cultural_place | 0 | No separately listed cultural or heritage venue with an exact street address and independently opened official destination was exposed by this source. |
| **Total retained** | **6** | 2 physical businesses and 4 legitimate online-only businesses. |

## Retained records and evidence rules

La Ingrata is retained as a physical business because AEM lists its exact Camden address and links the business website; the official website was independently opened and confirms the same address, phone, hours, menu and services. South Philly Salon Unisex is retained as a physical business because AEM lists its exact Philadelphia address and links the official website; the website independently confirms the address, phone, hours and Instagram. Ñuuxakun, Nocheztli Clothing, Sparkle Creation and Olga Renteria are retained as online businesses only because AEM explicitly labels them `Empresa en línea - Remota` and each has an independently opened official website or official social/customer destination. Their addresses remain null and each notes `online_only_no_map_pin`.

No coordinates were invented. AEM’s repeated `1108 S 9th St` text appears as a generic image/gallery caption beneath multiple remote listings rather than an exact business address; it was not used as an address. No business was retained solely from a search snippet. No ownership, language, accessibility, license validity, or regulated status was inferred. Olga Renteria’s site mentions legal and immigration interpreting, but the business is not itself a regulated profession; the record is categorized as professional services and does not claim attorney, legal, or license status.

## Specific omissions and blocks

The older business profile pages in the businesses sitemap were largely empty of business detail when opened: they showed the profile title and generic navigation but no exact address, phone, or official destination. Consequently, the following publicly discoverable names were not retained: Philatinos; Taquería Morales; Tamalex–7th; Tenangos; Mexi Bike; Mundo de Queen; La Ilusión; Los Catrines; Los Cuatro Soles; Kalas–Hair Salon & Hair dresser; Chocolate Arts & Crafts; Adelita Restaurant; Arepas Grubspot; Bered Joyería; Tortillería San Román; Gamalex Bar & Grill; Mole Poblano; Philly Tacos; Ay Chihuahua; Ana Thorne Designs; Los Gallos Mexican Taqueria; Flores Coffee Shop; Blue Corn Mexican Restaurant and Bar; Aztlan Taqueria; Opulencia Financial Group; Duskaia Coffee; Sales Strategy; Rosas Flowers Events and Gifts LLC; and Ascend Equity Access. These omissions reflect missing required public evidence, not a claim that the businesses are closed or nonexistent.

The AEM member portal at https://consultorias.lovable.app/ is access-controlled. The public membership page explains how to join and submit business details but does not publish a directory. No public AEM pagination endpoint or additional accessible member detail range was exposed beyond the business sitemap and the current association page. No community-resource or cultural-place records were invented from association events, board members, partner mentions, or generic 9th Street references.

The candidate JSONL contains exactly six unique `sourceRow` values and exactly the requested keys.
