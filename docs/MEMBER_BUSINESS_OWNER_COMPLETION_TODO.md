# Member / Business Owner Website Completion

**Branch:** `feature/member-business-owner-web-completion-20261014`
**Base:** `origin/manus/philadelphia-duplicate-dashboard` at `e4a38354a4b76e1a4e8d146e826943bd13918865`

- [ ] **One account, separate roles and contact data.** Preserve one authenticated community member account while supporting separate approved business-owner links, multiple businesses, and manager relationships. Keep founder/Admin authorization independent of owner access. A personal login email, private verification contact, public business email/phone/website, and business social accounts must remain separate data and different emails must never block a legitimate claim.

- [ ] **Safe existing-listing claim lifecycle.** A signed-in member can claim an existing listing without creating a duplicate. The flow must support owner or manager intent, evidence-backed verification choice, pending/approved/rejected/disputed/revoked states, competing-claim protection, audit history, and no owner access before a protected approval. Kinfolk may explain/find public official contact evidence but may not approve claims or send unapproved messages.

- [ ] **Member profile as a community profile.** The default profile Overview must prioritize photo, display name, handle, editable bio, posts/media, tagged content where available, followers/following/connections, reviews, selected activity, and opted-in public businesses. Account controls, privacy, security, membership, badges, and Admin tools remain in their existing settings/secondary surfaces. Private login data, verification contacts, and management permissions remain non-public.

- [ ] **Business-owner navigation and management.** An approved owner can move from the community profile to each approved business's public profile and private dashboard, use already-authorized business editing tools, and return to the personal profile. The public listing remains separate from private management controls. Member managers receive only the permissions explicitly assigned by an approved owner relationship.

- [ ] **Founder/Admin review and disputes.** Retain a private, authorization-checked claim review view with no automatic ownership transfer, private claimant evidence, conflict handling, auditable approval/revocation, and no change to business eligibility, ownership-designation verification, promotion, ranking, or public contact information solely because a claim is approved.

- [ ] **Evidence and release.** Validate synthetic member/owner/manager and claim scenarios in isolated staging, including success/failure/pending/dispute/revocation paths, duplicate prevention, public/private separation, dashboard navigation, and regressions to Kinfolk, Community, Map, Safety, memberships, and Admin. Prepare only the smallest verified web/API release. Before any production migration, real account-to-business association, live claim code/email/SMS delivery, provider change, or production deployment, record the exact action and rollback plan and obtain the required confirmation.
