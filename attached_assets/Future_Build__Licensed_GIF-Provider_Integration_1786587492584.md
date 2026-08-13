# Future Build: Licensed GIF-Provider Integration

**Author:** Manus AI  
**Status:** Deferred future build — do not implement in the current launch-repair release  
**Priority:** Product enrichment after current tester-launch blockers and core community-media safety gates pass  
**Goal:** Let members express themselves with a licensed GIF picker in permitted Community surfaces without MWM hosting an unlicensed GIF catalog or exposing members’ personal data to a provider.

## 1. Founder outcome

Members should eventually be able to search and add GIFs to Community posts, comments, reactions, and eligible direct business contributions. The GIF picker must be powered by one licensed provider at a time, subject to that provider’s current contract. MWM does not upload arbitrary copyrighted GIFs, rehost a provider catalog, or imply that a selected GIF is Library evidence, a safety fact, a business endorsement, or a Kinfolk answer.

The preferred first-release user experience is a **GIF** button in supported composer surfaces. A member opens the picker, searches or browses the provider’s own approved results, chooses a GIF, reviews their post, and publishes. The post renders a provider-attributed GIF card. Members may remove their GIF post at any time through normal post deletion.

> **A GIF is community expression. It is not evidence, a source, a safety update, a business review, a content-rights transfer, or permission for a business to reuse the member’s post.**

## 2. Required provider-selection decision

Before implementation, Replit must evaluate and choose **one** provider using the current official terms and MWM’s web/mobile needs. The first release must not mix provider results in one picker grid.

| Decision factor | Required standard |
| --- | --- |
| License/terms | Written review and approval of the current provider API/SDK terms, attribution, media delivery, analytics, caching, and moderation rules. |
| Web and future mobile | Supported web implementation now; viable supported native integrations later. |
| Accessibility | Provider metadata/alt text where available; keyboard navigation and screen-reader labels in MWM UI. |
| Content controls | G/high safety filter available and enforceable. |
| Cultural/language discoverability | Search can accept exact member-entered terms and supports language/region settings where available. |
| Data minimization | MWM can avoid sending member identity, email, location, private social graph, cultural preferences, or sensitive search history. |
| Branding | MWM can display the provider’s mandated attribution cleanly and consistently. |

### Recommended initial provider pattern: GIPHY SDK/API, subject to counsel and current provider approval

GIPHY’s official documentation describes API/SDK integration, requires visible `Powered By GIPHY` attribution, provides content ratings and language settings, and states that standard integrations should not proxy, rewrite, cache, or store provider media without approval. It also says GIPHY content must not be mixed with another provider in the same grid. [1] [2]

Tenor is a valid alternative if its current terms better fit the selected product architecture. Its documentation requires `Powered By Tenor` during browsing, `Search Tenor` in the search field, and `Via Tenor` when sharing; its `high` filter maps to G-rated content. [3] [4]

**The selected provider’s current terms govern if they differ from this document. Replit must not begin implementation until the provider and legal/operational owner are selected.**

## 3. In-scope and prohibited surfaces

| Surface | First GIF release | Reason |
| --- | --- | --- |
| Community Feed post composer | Allowed | Core community expression. |
| Community comments/replies | Allowed only if comment moderation and visibility rules are already reliable. | Avoid adding GIFs to an unsafe comment surface. |
| Direct business Community Media contribution | Allowed only as part of a public member-owned post. | Matches community promotion model; business cannot reuse it automatically. |
| Circles | Deferred until Circle privacy/visibility tests are independently passing. | Private group content needs separate authorization testing. |
| Business owner-authored updates | Deferred to future business-post release. | Keep official business material separate from community media. |
| Kinfolk chat | Deferred; no GIF output or input in first version. | Kinfolk needs context/safety quality first. |
| Library, What’s Happening, Safety Hub, medical/legal/public safety pages | Prohibited | GIFs can trivialize, mislead, or distract in high-consequence surfaces. |
| Notifications, emails, SMS, and push | Prohibited | No automatic animated media delivery. |

## 4. Exact data model

Do not store a downloaded GIF binary, a provider media copy, or a provider search history. Store only the selected provider reference needed to render a member’s post under the provider contract.

```sql
CREATE TABLE IF NOT EXISTS community_provider_gifs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('giphy','tenor')),
  provider_gif_id text NOT NULL,
  provider_media_url text NOT NULL,
  provider_page_url text NULL,
  provider_creator_name text NULL,
  alt_text text NULL,
  rendition_key text NULL,
  content_rating text NOT NULL DEFAULT 'g',
  attribution_required boolean NOT NULL DEFAULT true,
  selected_at timestamptz NOT NULL DEFAULT now(),
  removed_at timestamptz NULL,
  UNIQUE(provider, provider_gif_id, post_id)
);

CREATE INDEX IF NOT EXISTS community_provider_gifs_post_active_idx
  ON community_provider_gifs(post_id) WHERE removed_at IS NULL;

CREATE TABLE IF NOT EXISTS gif_provider_configuration (
  provider text PRIMARY KEY CHECK (provider IN ('giphy','tenor')),
  enabled boolean NOT NULL DEFAULT false,
  safety_rating text NOT NULL DEFAULT 'g',
  terms_reviewed_at timestamptz NULL,
  terms_reviewed_by_user_id uuid NULL REFERENCES users(id),
  attribution_version text NULL,
  provider_key_status text NOT NULL DEFAULT 'not_configured' CHECK (provider_key_status IN ('not_configured','beta','production','suspended')),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

The `provider_media_url` must be exactly the selected provider’s response URL. MWM must not rewrite, strip query parameters, proxy, cache, copy, store, or transform the asset unless the selected provider has explicitly approved the behavior in writing. Provider-specific retention/removal requirements override this schema design.

## 5. Exact client implementation

### 5.1 GIF picker component

Create a reusable `LicensedGifPicker` component only after a provider is selected. It accepts a `surface` prop limited to allowed surfaces and returns a provider GIF reference, not a raw image URL.

```ts
type GifSurface = 'community_post' | 'community_comment' | 'business_community_contribution';

type LicensedGifSelection = {
  provider: 'giphy' | 'tenor';
  providerGifId: string;
  mediaUrl: string;
  providerPageUrl?: string;
  creatorName?: string;
  altText?: string;
  renditionKey?: string;
  rating: 'g';
};
```

The picker must:

1. Render the selected provider’s official/approved integration or direct client-side query pattern.
2. Use `G`/`high` filtering in the initial release.
3. Show the provider-required attribution at browse, search, and share locations.
4. Preserve the member’s exact search terms; do not send Kinfolk’s inferred cultural preferences, profile identity, private tags, location, email, or MWM user ID to the provider.
5. Use a random/non-identifying provider customer identifier only if the provider’s analytics contract requires it.
6. Render `altText` when supplied; otherwise use a neutral accessible label such as `Animated GIF selected by community member`.
7. Support keyboard focus, Escape-to-close, and a typed-search fallback.
8. Make selection editable/removable before post submission.

### 5.2 Community composer integration

In `artifacts/web/src/pages/community.tsx`, add a **GIF** picker trigger next to supported media controls. A chosen GIF becomes a `licensedGif` field in the existing post draft. The composer must continue to support caption, visibility, hashtags, normal member media, direct business contribution, content warning, and report flows.

No provider key may be added to server-side secret output or proxied through `/api/community`. Replit must follow the selected provider’s required client/SDK integration pattern and key restrictions. If the selected provider requires a key that cannot safely be exposed in web client code, use only that provider’s officially sanctioned solution; do not invent a proxy contrary to terms.

### 5.3 Post-card rendering

The post card renders the provider’s permitted media rendition, proper attribution, creator information where required, pause/reduce-motion support, and a click through to provider page when required. Autoplay must respect reduced-motion preference and be disabled in low-bandwidth/data-saver conditions where feasible.

The GIF card is labeled `Member shared`. A business tag/direct contribution does not change the label to business-sponsored or officially endorsed.

## 6. Exact server validation

Extend `POST /api/community/posts` only with the following additive input:

```ts
interface LicensedGifInput {
  provider: 'giphy' | 'tenor';
  providerGifId: string;
  providerMediaUrl: string;
  providerPageUrl?: string;
  creatorName?: string;
  altText?: string;
  renditionKey?: string;
  rating: 'g';
}
```

The server must validate the provider is active in `gif_provider_configuration`, the content rating matches the initial safety limit, and the URL hostname/path conforms to an allowlist supplied by the chosen provider’s official documentation. It must not fetch/download the GIF, scrape the provider page, re-encode media, or use the GIF in any external-content/Library/Safety worker.

The server writes `community_posts` and `community_provider_gifs` atomically. If the member removes the post, set/remove the GIF relationship following the provider’s terms and MWM’s ordinary post lifecycle. No GIF-selection data may be added to Kinfolk behavioral profile, business analytics, Library Growth Engine, safety case, or member sensitive preferences.

## 7. Safety, privacy, and rights controls

| Risk | Mandatory control |
| --- | --- |
| Copyright/licensing | Use the selected provider’s official integration, attribution, delivery, and cache rules. No arbitrary member-uploaded third-party GIF library. |
| Minors/sensitive content | Initial filter is G/high. Do not offer a GIF picker in Safety Hub, Library evidence, medical/legal/public safety, urgent alerts, or Kinfolk chat. |
| Member privacy | Do not send account ID, email, precise location, private social graph, private hashtag, cultural preference, or sensitive context to provider. |
| Movement/accessibility | Honor `prefers-reduced-motion`; provide pause/stop behavior and accessible alternative text. |
| Abuse | Community report/removal tools apply to GIF posts. Provider content can be hidden on MWM after a valid report; provider deletion/removal policies must be honored. |
| Business rights | A business cannot reuse/download/repost a member GIF without a separate future member consent flow. |
| Feed permission | GIF post follows the same public/follower-only policy. A follower-only GIF cannot appear in public trending, business page Community Media, public hashtag result, or global Kinfolk context. |

## 8. Required test gates

| ID | Scenario | Required result |
| --- | --- | --- |
| GIF-01 | Provider is disabled. | GIF trigger hidden or clearly unavailable; no provider request. |
| GIF-02 | Member opens selected provider picker. | Required attribution and G/high filtering render. |
| GIF-03 | Member searches a culturally relevant exact phrase. | Exact entered phrase is sent under provider contract; no profile/sensitive data is transmitted. |
| GIF-04 | Member chooses a GIF, removes it, and posts. | Draft behavior works; only selected reference is persisted. |
| GIF-05 | Public GIF post. | Renders with attribution and accessible label after hard refresh. |
| GIF-06 | Follower-only GIF post. | Visible only to permitted viewers; excluded from public result/trend/business page. |
| GIF-07 | Direct business contribution GIF post. | Visible as `Member shared` only after direct-contribution acknowledgement and public visibility. |
| GIF-08 | User chooses a GIF in Safety/Library/Kinfolk chat. | Picker is unavailable. |
| GIF-09 | Reduced-motion preference. | GIF does not autoplay or offers a static/pause state. |
| GIF-10 | Provider URL/media is removed or unavailable. | MWM renders a safe unavailable state; no broken page. |
| GIF-11 | Ordinary member attempts to change provider configuration. | HTTP 403. |
| GIF-12 | Existing media, hashtags, business contribution, and feed visibility tests. | No regression. |

## 9. Production proof requirement

Replit must submit provider selection/terms review record, configuration proof, browser screenshots of attribution/search/selection/share, network proof that MWM does not proxy/cache media, GIF-01–GIF-12 results, a three-member visibility matrix, reduce-motion proof, and rollback instructions. Manus will independently test with an isolated account before the feature is called ready.

## References

[1] [GIPHY Developer Documentation](https://developers.giphy.com/docs/)  
[2] [GIPHY API Documentation](https://developers.giphy.com/docs/api/)  
[3] [Tenor Attribution Guide](https://developers.google.com/tenor/guides/attribution)  
[4] [Tenor Content Filtering Guide](https://developers.google.com/tenor/guides/content-filtering)
