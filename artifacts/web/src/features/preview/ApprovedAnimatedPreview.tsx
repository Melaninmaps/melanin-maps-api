const approvedPreviewUrl = `${import.meta.env.BASE_URL}kinfolk-preview/kinfolk-preview-suite.html`;

/**
 * The founder-approved Kinfolk preview suite is served as its original,
 * self-contained HTML experience. This wrapper keeps /preview (and its existing
 * aliases) canonical without rewriting the approved visual or interactions.
 */
export function ApprovedAnimatedPreview() {
  return (
    <iframe
      title="Mapping With Melanin preview"
      src={`${approvedPreviewUrl}${window.location.search}`}
      style={{
        display: "block",
        width: "100%",
        height: "100dvh",
        border: 0,
        background: "#2B1507",
      }}
    />
  );
}