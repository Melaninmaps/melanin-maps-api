# Media Upload Repair, Direct Admin Listings, and Owner Claims

## Immediate correction

The photo control shown in the Community composer must stop being a decorative icon. The shared `MediaUploader` opens a real file chooser, obtains a server-signed upload URL, transfers the file, verifies object storage received it, and only then returns a ready media asset ID. A failure is visible at the actual stage; it cannot silently do nothing.

Use `MediaUploader` in **every** entry point that accepts media:

1. Community composer: `Discussion`, `Rec`, and `Alert`.
2. Community business-submission form.
3. Founder/admin direct-business form.
4. Business owner claim form.
5. Any mobile business, community, or owner-claim flow.

Do not maintain separate upload implementations for each form.

## Business workflow: two intentional lanes

| Who creates the listing | Initial status | Public visibility | What happens next |
|---|---|---|---|
| Community member | `pending_review` | Not public | Founder/admin reviews before approval. |
| Founder or designated admin | `published` | Immediate | The owner may submit a verified claim afterward. |
| Business owner who claims | `pending_verification` | Listing remains public | Founder/admin verifies and approves/rejects the claim. |

This follows your instruction exactly: businesses added by you, your two authorized admins, or a direct managed import appear immediately. Community-submitted businesses remain in the queue while you calibrate the process.

## 1. Apply the migration

```bash
pnpm db:migrate
```

This creates `media_assets`, `entity_media_assets`, `business_claim_requests`, and adds publication/claim fields to the canonical `businesses` table.

## 2. Configure private object storage

The server must supply an `ObjectStorage` adapter to `registerMediaRoutes`. It needs exactly two operations:

```ts
createUploadUrl({ key, mimeType, byteSize })
objectExists(key)
```

Use the project’s private storage credentials on the server only. Never put a storage secret, bucket secret, or permanent upload credential in browser or mobile code. Presigned URLs must be short lived. Enforce supported MIME type and the limits already in the route: **10 MB per image** and **50 MB per video**.

## 3. Register routes

```ts
registerMediaRoutes(app, pool, objectStorage);
registerAdminPublishAndClaimRoutes(app, pool, directBusinessPublisher);
```

`directBusinessPublisher.publishDirect` is the required adapter to the existing canonical business schema. It must geocode/validate the location, generate the server-side slug, attach ready media assets, set the business to public, record the adding admin, set `owner_claim_status='unclaimed'`, and return the canonical business UUID/slug. It must never allow the browser to set public status by itself.

## 4. Mount the entry points

```tsx
// Community composer: replace the broken visual-only Add Photo control.
<MediaUploader label="Add photos or video" maxFiles={5} onChange={setMediaAssetIds} value={mediaAssetIds} />

// Founder/admin direct listing page.
<Route path="/founder/businesses/new" element={<DirectBusinessForm />} />

// Public business detail page.
<BusinessClaimForm businessId={business.id} />
```

The direct admin route must require the current session role `founder` or `admin`. Give the other two designated administrators that role through the existing member-role system; do not hard-code email addresses in the browser.

## 5. Claim process

An owner claim is deliberately **not** automatic. The owner submits their contact and verification information; the business switches to `pending_verification`, remains publicly visible, and enters an admin/founder review queue. An authorized reviewer decides `approved`, `rejected`, or `needs_more_info`. Only approval sets `claimed_owner_member_id` and grants owner tools.

This protects an admin-added business from being taken over by someone who merely knows its name.

## Required acceptance tests

| Test | Required result |
|---|---|
| Community composer photo button | Opens native file chooser; valid image produces thumbnail/ready asset ID; error is visible if storage fails. |
| Community business submission with image | Creates a pending submission with attached ready asset; no public business appears. |
| Founder/admin direct business with image | Publishes immediately, has valid location/slug, and can appear only in relevant local results. |
| Non-admin direct publish request | Returns 403 and creates no business. |
| Public owner claim | Creates `pending_verification`, not ownership. |
| Admin approves claim | Assigns claimed owner only after review. |
| Unsupported/oversize file | Returns a clear type/size error and creates no ready asset. |

## Do not release until

1. The Add Photo control works in all five entry points.
2. Public results exclude pending community submissions.
3. Direct admin entries publish immediately and show only in the right local area.
4. Owner claims cannot bypass verification.
5. The mobile app uses the same API and storage path; it must not have a separate client-side publication route.
