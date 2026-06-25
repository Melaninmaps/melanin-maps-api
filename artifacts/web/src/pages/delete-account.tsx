export default function DeleteAccount() {
  return (
    <div style={{ maxWidth: 600, margin: "80px auto", padding: "0 24px", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Delete Your Account</h1>
      <p style={{ color: "#555", marginBottom: 32 }}>
        You can permanently delete your Mapping With Melanin account and all associated data at any time.
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>How to delete your account</h2>
      <ol style={{ lineHeight: 2, color: "#333", paddingLeft: 20 }}>
        <li>Open the <strong>Mapping With Melanin</strong> app on your device</li>
        <li>Tap the <strong>Profile</strong> tab at the bottom</li>
        <li>Tap <strong>Settings</strong></li>
        <li>Scroll down and tap <strong>Delete Account</strong></li>
        <li>Confirm the deletion when prompted</li>
      </ol>

      <p style={{ marginTop: 32, color: "#555" }}>
        Once deleted, your account and all associated data — including saved places, reviews, safety reports, and profile information — will be permanently removed and cannot be recovered.
      </p>

      <p style={{ marginTop: 24, color: "#555" }}>
        If you need assistance, contact us at{" "}
        <a href="mailto:hello@mappingwithmelanin.com?subject=Account%20Deletion%20Support" style={{ color: "#8B4513" }}>
          hello@mappingwithmelanin.com
        </a>
      </p>
    </div>
  );
}
