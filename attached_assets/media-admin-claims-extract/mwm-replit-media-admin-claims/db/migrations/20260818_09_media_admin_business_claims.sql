BEGIN;

CREATE TABLE IF NOT EXISTS public.media_assets (
  id uuid PRIMARY KEY,
  storage_key text NOT NULL UNIQUE,
  public_url text NOT NULL,
  mime_type text NOT NULL,
  byte_size bigint NOT NULL CHECK (byte_size > 0),
  original_filename text NOT NULL,
  uploader_member_id uuid,
  status text NOT NULL DEFAULT 'ready' CHECK (status IN ('uploading','ready','rejected','deleted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (mime_type IN ('image/jpeg','image/png','image/webp','image/heic','video/mp4','video/quicktime')),
  CHECK ((mime_type LIKE 'image/%' AND byte_size <= 10485760) OR (mime_type LIKE 'video/%' AND byte_size <= 52428800))
);

CREATE TABLE IF NOT EXISTS public.entity_media_assets (
  entity_type text NOT NULL CHECK (entity_type IN ('community_post','business_submission','business','business_claim')),
  entity_id uuid NOT NULL,
  media_asset_id uuid NOT NULL REFERENCES public.media_assets(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (entity_type, entity_id, media_asset_id)
);

ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS added_by_member_id uuid;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS added_via text NOT NULL DEFAULT 'unknown' CHECK (added_via IN ('admin_web','admin_mobile','founder','replit_import','community_approved','unknown'));
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS owner_claim_status text NOT NULL DEFAULT 'unclaimed' CHECK (owner_claim_status IN ('unclaimed','pending_verification','claimed','rejected'));
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS claimed_owner_member_id uuid;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS published_at timestamptz;

CREATE TABLE IF NOT EXISTS public.business_claim_requests (
  id uuid PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  claimant_member_id uuid,
  claimant_name text NOT NULL,
  claimant_email text NOT NULL,
  claimant_phone text,
  claimant_role text NOT NULL,
  verification_message text,
  status text NOT NULL DEFAULT 'pending_verification' CHECK (status IN ('pending_verification','approved','rejected','needs_more_info')),
  reviewed_by_member_id uuid,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS business_claim_requests_business_status_idx ON public.business_claim_requests(business_id, status, created_at DESC);

COMMIT;
