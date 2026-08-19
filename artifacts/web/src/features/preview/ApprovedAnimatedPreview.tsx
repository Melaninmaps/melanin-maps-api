const approvedPreviewUrl = `${import.meta.env.BASE_URL}approved-preview-8-5.html`;

/**
 * The approved 8/5 visitor preview is intentionally served as its original,
 * self-contained HTML document. This wrapper keeps /preview as the canonical
 * React route without rewriting the approved visual or animation artifact.
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