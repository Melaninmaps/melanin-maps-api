# Live Admin Enrichment Access Note — 2026-10-15

- Authenticated My Browser is on `https://www.mappingwithmelanin.com/admin?profile_enrichment=1` and the **Businesses** section is loaded successfully.
- The deployed JavaScript asset (`/assets/index-B3WRN043.js`) contains the field-level profile-enrichment UI and POST route `/api/businesses/admin/businesses/profile-enrichment-apply`.
- The UI conditionally renders only after the **Intake cohort** filter becomes `kinfolk_current` or `non_kinfolk_current`; the default all-cohort state does not render its upload/apply buttons.
- A standard browser automation select action targeting the visible native cohort selector reported the intended option but did not change the rendered controlled React state. No production data change has occurred.
- Exact approved scope remains 24 checked manifests / 2,364 Kinfolk Current candidates under `apply-manifests-v2/`.
