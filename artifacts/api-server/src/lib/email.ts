ver the communities searching for them."</p>
        <p style="color:#3A1F0E;font-size:13px;margin:0;opacity:0.6">Melanin Maps LLC</p>
      </div>
    `,
  });
}

export async function sendAdminSafetyReportAlert({
  category,
  targetType,
  targetName,
  severity,
  description,
  reporterName,
  isMinorityOwned,
  reportId,
}: {
  category: string;
  targetType: string;
  targetName: string;
  severity: string;
  description: string | null;
  reporterName: string;
  isMinorityOwned: boolean | null;
  reportId: string;
}) {
  if (!resend) return;
  const adminTo = process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim()).filter(Boolean)[0] ?? "hello@mappingwithmelanin.com";
  const severityColors: Record<string, string> = { low: "#CA922B", medium: "#E07A2F", high: "#C0392B", critical: "#7B241C" };
  const ownershipLabel = isMinorityOwned === true ? "Minority-Owned (requires your review to affect score)" : isMinorityOwned === false ? "Non-Minority-Owned (score updates automatically after 3+ reports)" : "Ownership Unknown";
  await sendEmail({
    from: FROM,
    to: adminTo,
    replyTo: "hello@mappingwithmelanin.com",
    subject: `[Safety Report] ${severity.toUpperCase()} — ${category} at ${targetName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <p style="color:#2B1507;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 8px">Safety Report Alert</p>
        <h1 style="font-size:22px;color:#2B1507;font-weight:800;margin:0 0 24px;line-height:1.3">New report submitted</h1>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          <tr><td style="padding:8px 0;color:#6B5744;font-size:13px;width:140px">Report ID</td><td style="padding:8px 0;color:#2B1507;font-size:13px;font-family:monospace">${reportId}</td></tr>
          <tr style="border-top:1px solid #E8DDD0"><td style="padding:8px 0;color:#6B5744;font-size:13px">Category</td><td style="padding:8px 0;color:#2B1507;font-size:13px;font-weight:700;text-transform:capitalize">${category}</td></tr>
          <tr style="border-top:1px solid #E8DDD0"><td style="padding:8px 0;color:#6B5744;font-size:13px">Severity</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:${severityColors[severity] ?? "#2B1507"};text-transform:uppercase">${severity}</td></tr>
          <tr style="border-top:1px solid #E8DDD0"><td style="padding:8px 0;color:#6B5744;font-size:13px">Target type</td><td style="padding:8px 0;color:#2B1507;font-size:13px;text-transform:capitalize">${targetType}</td></tr>
          <tr style="border-top:1px solid #E8DDD0"><td style="padding:8px 0;color:#6B5744;font-size:13px">Location / Name</td><td style="padding:8px 0;color:#2B1507;font-size:13px;font-weight:700">${targetName}</td></tr>
          <tr style="border-top:1px solid #E8DDD0"><td style="padding:8px 0;color:#6B5744;font-size:13px">Reporter</td><td style="padding:8px 0;color:#2B1507;font-size:13px">${reporterName}</td></tr>
          <tr style="border-top:1px solid #E8DDD0"><td style="padding:8px 0;color:#6B5744;font-size:13px">Ownership</td><td style="padding:8px 0;color:#2B1507;font-size:12px">${ownershipLabel}</td></tr>
        </table>
        ${description ? `<div style="background:#fff;border:1px solid #E8DDD0;border-radius:10px;padding:16px;margin-bottom:24px"><p style="color:#6B5744;font-size:12px;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.06em">Description</p><p style="color:#2B1507;font-size:14px;line-height:1.6;margin:0">${description}</p></div>` : ""}
        <a href="https://mappingwithmelanin.com/admin/safety-reports" style="display:inline-block;background:#2B1507;color:#FAF6EF;font-weight:700;font-size:14px;padding:12px 28px;border-radius:50px;text-decoration:none">Review in Admin Panel →</a>
        <p style="color:#6B5744;font-size:12px;margin:24px 0 0">Mapping With Melanin™ · Safety Moderation</p>
      </div>
    `,
  });
}

export async function sendBusinessRecommendationInvite(
  to: string,
  businessName: string,
  recommendationCount: number,
  waitlistLink: string,
) {
  if (!resend) return;

  const countLine =
    recommendationCount >= 2
      ? `<p style="color:#CA922B;font-size:22px;font-weight:700;text-align:center;margin:0 0 8px">
           ${recommendationCount} community members have recommended your business.
         </p>`
      : "";

  const demandLine =
    recommendationCount >= 5
      ? `<p style="color:#3A1F0E;font-size:16px;font-weight:700;text-align:center;margin:0 0 4px">
           That's not just an invitation — that's demand.
         </p>
         <p style="color:#3A1F0E;font-size:15px;text-align:center;font-style:italic;margin:0">
           "Our community is already looking for you."
         </p>`
      : "";

  await sendEmail({
    from: FROM,
    to,
    replyTo: "business@mappingwithmelanin.com",
    subject: "Exciting news — a community member recommended your business 🤎",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping with Melanin" style="height:40px;margin-bottom:32px" />

        <p style="color:#2B1507;font-size:16px;line-height:1.6;margin:0 0 8px">Hello,</p>

        <h1 style="font-size:26px;color:#2B1507;font-weight:700;margin:0 0 20px;line-height:1.3">
          Exciting news!
        </h1>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 16px">
          A member of the <strong>Mapping with Melanin™</strong> community recently recommended
          <strong>${businessName}</strong> and thought others should be able to discover and support what you do.
        </p>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 24px">
          We're currently preparing for launch, and both community members and businesses are joining our early access waitlist
          as we build something special together.
        </p>

        <div style="background:#2B1507;border-radius:16px;padding:28px;margin:0 0 28px;text-align:center">
          ${countLine}
          <p style="color:#F5EBD8;font-size:17px;font-weight:700;margin:0 0 12px;line-height:1.4">
            Someone believes your business deserves to be part of this community.
          </p>
          ${demandLine}
        </div>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 16px">
          By joining the waitlist today, you'll receive updates as we prepare for launch and be among the first businesses
          invited to claim your profile, connect with new supporters, and explore the tools we're building to help businesses grow.
        </p>

        <p style="color:#2B1507;font-size:17px;font-weight:700;margin:0 0 20px">
          Join the Business Waitlist
        </p>

        <div style="text-align:center;margin-bottom:32px">
          <a href="${waitlistLink}" style="display:inline-block;background:#CA922B;color:#fff;font-weight:700;font-size:16px;padding:16px 40px;border-radius:50px;text-decoration:none">
            Join Waitlist →
          </a>
        </div>

        <p style="color:#3A1F0E;font-size:15px;line-height:1.6;margin:0 0 24px">
          Thank you to the community member who thought of you — and thank you for everything you do for your community.
        </p>

        <p style="color:#3A1F0E;font-size:15px;line-height:1.6;margin:0 0 24px;font-style:italic">
          We can't wait to welcome you.
        </p>

        <p style="color:#2B1507;font-size:16px;font-weight:700;font-style:italic;margin:0 0 4px">Map Your Life. Connect Deeper.™</p>
        <p style="color:#3A1F0E;font-size:15px;margin:0 0 4px">The Mapping with Melanin™ Team</p>
        <p style="color:#3A1F0E;font-size:13px;opacity:0.6;margin:0">Melanin Maps LLC · <a href="mailto:hello@mappingwithmelanin.com" style="color:#CA922B">hello@mappingwithmelanin.com</a></p>
      </div>
    `,
  });
}

export async function sendFriendInvitation(
  to: string,
  inviteeName: string | null,
  referrerName: string,
  referralLink: string,
  referralCode: string,
) {
  if (!resend) return;
  const greet = inviteeName ? `Hi ${inviteeName},` : "Hi there,";
  await sendEmail({
    from: FROM,
    to,
    replyTo: "hello@mappingwithmelanin.com",
    subject: `${referrerName} invited you to join Mapping With Melanin™`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping With Melanin" style="height:40px;margin-bottom:32px" />

        <p style="color:#2B1507;font-size:16px;line-height:1.6;margin:0 0 8px">${greet}</p>

        <h1 style="font-size:28px;color:#2B1507;font-weight:700;margin:0 0 16px;line-height:1.3">
          <span style="color:#CA922B">${referrerName}</span> personally invited you to join Mapping With Melanin™.
        </h1>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 20px">
          Mapping With Melanin™ isn't just growing a waitlist — we're building a community. And your friend thought you should be a part of it from the very beginning.
        </p>

        <div style="background:#2B1507;border-radius:12px;padding:28px;margin-bottom:28px">
          <p style="color:#F5EBD8;font-size:15px;font-weight:700;margin:0 0 16px">Here's how it works:</p>

          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(245,235,216,0.1);vertical-align:top;width:28px"><span style="font-size:20px">🤎</span></td>
              <td style="padding:10px 0 10px 12px;border-bottom:1px solid rgba(245,235,216,0.1)">
                <p style="color:#F5EBD8;font-size:14px;font-weight:700;margin:0 0 2px">Refer Community Members</p>
                <p style="color:#F5EBD8;font-size:13px;margin:0;opacity:0.7">Invite others to join the waitlist and help grow the community.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(245,235,216,0.1);vertical-align:top;width:28px"><span style="font-size:20px">🏢</span></td>
              <td style="padding:10px 0 10px 12px;border-bottom:1px solid rgba(245,235,216,0.1)">
                <p style="color:#F5EBD8;font-size:14px;font-weight:700;margin:0 0 2px">Recommend Minority-Owned Businesses</p>
                <p style="color:#F5EBD8;font-size:13px;margin:0;opacity:0.7">Know a business that deserves more visibility? Invite them to join and become part of the movement.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;vertical-align:top;width:28px"><span style="font-size:20px">📍</span></td>
              <td style="padding:10px 0 10px 12px">
                <p style="color:#F5EBD8;font-size:14px;font-weight:700;margin:0 0 2px">Help Build Your City</p>
                <p style="color:#F5EBD8;font-size:13px;margin:0;opacity:0.7">As we prepare for launch, we'll introduce Mapping With Melanin™ city by city — priority given to communities showing the strongest engagement.</p>
              </td>
            </tr>
          </table>
        </div>

        <div style="background:#fff;border:1px solid rgba(58,31,14,0.08);border-radius:12px;padding:24px;margin-bottom:28px">
          <p style="color:#2B1507;font-size:15px;font-weight:700;margin:0 0 10px">🏆 Climb the Waitlist</p>
          <p style="color:#3A1F0E;font-size:14px;line-height:1.6;margin:0">
            Every verified referral earns Community Builder credit. Members who actively help grow the community may move up the waitlist, unlock exclusive <strong>Founding Member</strong> recognition, and gain earlier access to the platform.
          </p>
        </div>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 8px;font-style:italic;font-weight:700">
          Because Mapping With Melanin™ isn't being built for the community — it's being built with the community.
        </p>

        <p style="color:#3A1F0E;font-size:15px;line-height:1.6;margin:0 0 28px">
          Help us grow. Help your city connect. Help your favorite businesses get discovered.
        </p>

        <div style="text-align:center;margin-bottom:28px">
          <a href="${referralLink}" style="display:inline-block;background:#CA922B;color:#fff;font-weight:700;font-size:16px;padding:16px 40px;border-radius:50px;text-decoration:none">
            Join the Waitlist →
          </a>
        </div>

        <div style="background:#2B1507;border-radius:12px;padding:20px 24px;margin-bottom:24px">
          <p style="color:#F5EBD8;font-size:13px;margin:0 0 6px;opacity:0.7">Your invitation link (includes ${referrerName}'s referral code)</p>
          <a href="${referralLink}" style="color:#CA922B;font-size:14px;font-weight:700;word-break:break-all">${referralLink}</a>
          <p style="color:#F5EBD8;font-size:12px;margin:8px 0 0;opacity:0.5">Referral code: <span style="color:#CA922B;letter-spacing:2px;font-weight:700">${referralCode}</span></p>
        </div>

        <p style="color:#2B1507;font-size:16px;font-weight:700;font-style:italic;margin:0 0 4px">Map Your Life. Connect Deeper.™</p>
        <p style="color:#3A1F0E;font-size:15px;margin:0 0 4px">The Mapping With Melanin™ Team</p>
        <p style="color:#3A1F0E;font-size:13px;opacity:0.6;margin:0">Melanin Maps LLC · <a href="mailto:hello@mappingwithmelanin.com" style="color:#CA922B">hello@mappingwithmelanin.com</a></p>
      </div>
    `,
  });
}

export async function sendBusinessWaitlistInvitation(
  to: string,
  businessName: string,
  referrerName: string,
  joinLink: string,
) {
  if (!resend) return;
  await sendEmail({
    from: FROM,
    to,
    replyTo: "business@mappingwithmelanin.com",
    subject: `${referrerName} recommended your business to Mapping With Melanin™`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping With Melanin" style="height:40px;margin-bottom:32px" />

        <p style="color:#2B1507;font-size:16px;line-height:1.6;margin:0 0 8px">Hello ${businessName},</p>

        <h1 style="font-size:28px;color:#2B1507;font-weight:700;margin:0 0 16px;line-height:1.3">
          <span style="color:#CA922B">${referrerName}</span> recommended your business to Mapping With Melanin™.
        </h1>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 20px">
          A community member who knows your business wants to see you featured on Mapping With Melanin™ — a platform built to celebrate and connect people with trusted minority-owned businesses, cultural gems, and community destinations.
        </p>

        <div style="background:#2B1507;border-radius:12px;padding:28px;margin-bottom:28px">
          <p style="color:#F5EBD8;font-size:15px;font-weight:700;margin:0 0 16px">Why join the business waitlist?</p>
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:9px 0;border-bottom:1px solid rgba(245,235,216,0.1);vertical-align:top;width:28px"><span style="font-size:18px">🏪</span></td>
              <td style="padding:9px 0 9px 12px;border-bottom:1px solid rgba(245,235,216,0.1)">
                <p style="color:#F5EBD8;font-size:14px;font-weight:700;margin:0 0 2px">Get Discovered by Conscious Consumers</p>
                <p style="color:#F5EBD8;font-size:13px;margin:0;opacity:0.7">Connect with community members actively seeking minority-owned businesses like yours.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:9px 0;border-bottom:1px solid rgba(245,235,216,0.1);vertical-align:top;width:28px"><span style="font-size:18px">🛡️</span></td>
              <td style="padding:9px 0 9px 12px;border-bottom:1px solid rgba(245,235,216,0.1)">
                <p style="color:#F5EBD8;font-size:14px;font-weight:700;margin:0 0 2px">Community-Verified Visibility</p>
                <p style="color:#F5EBD8;font-size:13px;margin:0;opacity:0.7">Every listing is community-reviewed and authenticity-checked — earning real trust from real people.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:9px 0;vertical-align:top;width:28px"><span style="font-size:18px">📍</span></td>
              <td style="padding:9px 0 9px 12px">
                <p style="color:#F5EBD8;font-size:14px;font-weight:700;margin:0 0 2px">Help Build Your City's Map</p>
                <p style="color:#F5EBD8;font-size:13px;margin:0;opacity:0.7">We launch city by city — businesses on the waitlist get priority positioning when we arrive in your area.</p>
              </td>
            </tr>
          </table>
        </div>

        <p style="color:#3A1F0E;font-size:15px;line-height:1.6;margin:0 0 28px">
          Join the business waitlist today and be part of the platform that's being built <em>with</em> the community — not just for it.
        </p>

        <div style="text-align:center;margin-bottom:28px">
          <a href="${joinLink}" style="display:inline-block;background:#CA922B;color:#fff;font-weight:700;font-size:16px;padding:16px 40px;border-radius:50px;text-decoration:none">
            Join the Business Waitlist →
          </a>
        </div>

        <p style="color:#3A1F0E;font-size:13px;line-height:1.6;margin:0 0 24px;opacity:0.7">
          Questions? Reply to this email or reach us at <a href="mailto:business@mappingwithmelanin.com" style="color:#CA922B">business@mappingwithmelanin.com</a>. We'd love to hear from you.
        </p>

        <p style="color:#2B1507;font-size:16px;font-weight:700;font-style:italic;margin:0 0 4px">Map Your Life. Connect Deeper.™</p>
        <p style="color:#3A1F0E;font-size:15px;margin:0 0 4px">The Mapping With Melanin™ Team</p>
        <p style="color:#3A1F0E;font-size:13px;opacity:0.6;margin:0">Melanin Maps LLC · <a href="mailto:hello@mappingwithmelanin.com" style="color:#CA922B">hello@mappingwithmelanin.com</a></p>
      </div>
    `,
  });
}

export async function sendReferralMilestoneUpdate(
  to: string,
  firstName: string | null,
  totalReferrals: number,
  newInviteeName: string | null,
  cityName: string | null,
  cityTotal: number,
  referralCode: string,
) {
  if (!resend) return;
  const name = firstName ?? "there";
  const referralLink = `https://mappingwithmelanin.com/?ref=${referralCode}`;
  const newJoinedText = newInviteeName
    ? `<strong>${newInviteeName}</strong> just joined the waitlist`
    : "Someone just joined the waitlist";
  await sendEmail({
    from: FROM,
    to,
    replyTo: "hello@mappingwithmelanin.com",
    subject: `Your referral is working, ${name} 🎉 — ${totalReferrals} ${totalReferrals === 1 ? "person" : "people"} joined`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping With Melanin" style="height:40px;margin-bottom:32px" />

        <p style="color:#2B1507;font-size:16px;line-height:1.6;margin:0 0 8px">Hey ${name},</p>

        <h1 style="font-size:26px;color:#2B1507;font-weight:700;margin:0 0 16px;line-height:1.3">
          Your community is growing. 🎉
        </h1>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 20px">
          ${newJoinedText} using your referral link. Keep it up — every person you bring in moves you closer to the front of the list.
        </p>

        <div style="background:#2B1507;border-radius:12px;padding:28px;margin-bottom:24px">
          <p style="color:#F5EBD8;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 20px">Your Referral Stats</p>

          <div style="display:flex;gap:16px;flex-wrap:wrap">
            <div style="flex:1;min-width:120px;background:rgba(245,235,216,0.08);border-radius:10px;padding:16px;text-align:center">
              <div style="color:#CA922B;font-size:36px;font-weight:700;font-family:Georgia,serif;line-height:1">${totalReferrals}</div>
              <div style="color:#F5EBD8;font-size:13px;margin-top:6px;opacity:0.8">Total Referrals</div>
            </div>
            ${cityName && cityTotal > 0 ? `
            <div style="flex:1;min-width:120px;background:rgba(245,235,216,0.08);border-radius:10px;padding:16px;text-align:center">
              <div style="color:#CA922B;font-size:36px;font-weight:700;font-family:Georgia,serif;line-height:1">${cityTotal}</div>
              <div style="color:#F5EBD8;font-size:13px;margin-top:6px;opacity:0.8">${cityName} Members</div>
            </div>
            ` : ""}
          </div>
        </div>

        ${totalReferrals >= 5 ? `
        <div style="background:#CA922B;border-radius:12px;padding:20px 24px;margin-bottom:24px">
          <p style="color:#fff;font-size:15px;font-weight:700;margin:0 0 6px">🏆 You're a Community Builder!</p>
          <p style="color:#fff;font-size:14px;line-height:1.6;margin:0;opacity:0.9">
            With ${totalReferrals}+ referrals, you're on track for Founding Member recognition — early access, an exclusive badge, and a locked-in founding rate on membership.
          </p>
        </div>
        ` : `
        <div style="background:#fff;border:1px solid rgba(58,31,14,0.08);border-radius:12px;padding:20px 24px;margin-bottom:24px">
          <p style="color:#2B1507;font-size:14px;font-weight:700;margin:0 0 6px">🎯 Keep Going</p>
          <p style="color:#3A1F0E;font-size:14px;line-height:1.6;margin:0">
            Reach <strong>5 referrals</strong> to unlock Community Builder status and move toward Founding Member recognition.
          </p>
        </div>
        `}

        <p style="color:#3A1F0E;font-size:15px;line-height:1.6;margin:0 0 20px">
          Share your link to keep the momentum going:
        </p>

        <div style="background:#2B1507;border-radius:12px;padding:20px 24px;margin-bottom:28px">
          <a href="${referralLink}" style="color:#CA922B;font-size:15px;font-weight:700;word-break:break-all;display:block;margin-bottom:8px">${referralLink}</a>
          <p style="color:#F5EBD8;font-size:12px;margin:0;opacity:0.5">Code: <span style="color:#CA922B;letter-spacing:2px;font-weight:700">${referralCode}</span></p>
        </div>

        <a href="${referralLink}" style="display:inline-block;background:#CA922B;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:50px;text-decoration:none;margin-bottom:28px">
          Share Your Link →
        </a>

        <p style="color:#2B1507;font-size:16px;font-weight:700;font-style:italic;margin:0 0 4px">Map Your Life. Connect Deeper.™</p>
        <p style="color:#3A1F0E;font-size:15px;margin:0 0 4px">The Mapping With Melanin™ Team</p>
        <p style="color:#3A1F0E;font-size:13px;opacity:0.6;margin:0">Melanin Maps LLC · <a href="mailto:hello@mappingwithmelanin.com" style="color:#CA922B">hello@mappingwithmelanin.com</a></p>
      </div>
    `,
  });
}

// ── App launch blast ──────────────────────────────────────────────────────────

// ─── Weekly Business Marketing Report ────────────────────────────────────────
export interface WeeklyBusinessReportData {
  businessName: string;
  tier: "navigator" | "trailblazer";
  weekLabel: string;
  views: number;
  viewsChange: number;
  saves: number;
  savesChange: number;
  reviews: number;
  reviewsChange: number;
  avgRating: number | null;
  peakDay: string;
  peakHour: string;
  aiMarketingTip: string;
  topActionItem?: string;
}

export async function sendWeeklyBusinessReport(
  to: string,
  firstName: string | null,
  data: WeeklyBusinessReportData,
) {
  if (!resend) return;
  const name = firstName ?? "there";
  const tierColor = data.tier === "trailblazer" ? "#CA922B" : "#7B2D8B";
  const tierLabel = data.tier === "trailblazer" ? "Trailblazer" : "Navigator";

  function changeArrow(n: number) {
    if (n > 0) return `<span style="color:#2D7A4F">▲ ${n}%</span>`;
    if (n < 0) return `<span style="color:#DC2626">▼ ${Math.abs(n)}%</span>`;
    return `<span style="color:#6B7280">—</span>`;
  }

  await sendEmail({
    from: FROM,
    to,
    replyTo: "hello@mappingwithmelanin.com",
    subject: `📊 Your weekly business report — ${data.businessName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping With Melanin" style="height:40px;margin-bottom:28px" />

        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
          <span style="background:${tierColor};color:#fff;font-size:10px;font-weight:700;letter-spacing:1px;padding:3px 10px;border-radius:20px;text-transform:uppercase">${tierLabel}</span>
          <span style="color:#6B7280;font-size:12px">${data.weekLabel}</span>
        </div>

        <h1 style="font-size:24px;color:#2B1507;font-weight:800;margin:0 0 6px">
          Your Weekly Business Report
        </h1>
        <p style="color:#3A1F0E;font-size:15px;margin:0 0 28px">Hey ${name} — here's how <strong>${data.businessName}</strong> performed this week.</p>

        <!-- Metrics row -->
        <table style="width:100%;border-collapse:separate;border-spacing:8px;margin-bottom:24px">
          <tr>
            <td style="background:#2B1507;border-radius:12px;padding:18px;text-align:center;width:33%">
              <p style="color:#F5EBD8;font-size:28px;font-weight:800;margin:0 0 4px">${data.views.toLocaleString()}</p>
              <p style="color:#F5EBD8;font-size:11px;margin:0 0 4px;opacity:0.6;text-transform:uppercase;letter-spacing:0.5px">Profile Views</p>
              <p style="font-size:12px;margin:0">${changeArrow(data.viewsChange)}</p>
            </td>
            <td style="background:#2B1507;border-radius:12px;padding:18px;text-align:center;width:33%">
              <p style="color:#F5EBD8;font-size:28px;font-weight:800;margin:0 0 4px">${data.saves.toLocaleString()}</p>
              <p style="color:#F5EBD8;font-size:11px;margin:0 0 4px;opacity:0.6;text-transform:uppercase;letter-spacing:0.5px">Community Saves</p>
              <p style="font-size:12px;margin:0">${changeArrow(data.savesChange)}</p>
            </td>
            <td style="background:#2B1507;border-radius:12px;padding:18px;text-align:center;width:33%">
              <p style="color:#F5EBD8;font-size:28px;font-weight:800;margin:0 0 4px">${data.reviews.toLocaleString()}</p>
              <p style="color:#F5EBD8;font-size:11px;margin:0 0 4px;opacity:0.6;text-transform:uppercase;letter-spacing:0.5px">New Reviews${data.avgRating ? ` · ${data.avgRating.toFixed(1)}★` : ""}</p>
              <p style="font-size:12px;margin:0">${changeArrow(data.reviewsChange)}</p>
            </td>
          </tr>
        </table>

        <!-- Engagement timing -->
        <div style="background:#fff;border-radius:12px;padding:18px 20px;margin-bottom:20px;border:1px solid #E8DDD0">
          <p style="color:#CA922B;font-size:10px;font-weight:700;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px">⏰ Peak Engagement Window</p>
          <p style="color:#2B1507;font-size:15px;font-weight:700;margin:0 0 4px">${data.peakDay} around ${data.peakHour}</p>
          <p style="color:#6B7280;font-size:13px;margin:0">Your community is most active at this time — schedule your posts to hit before this window.</p>
        </div>

        <!-- KinfolkAI marketing tip -->
        <div style="background:#1A0A28;border-radius:12px;padding:20px 22px;margin-bottom:20px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
            <span style="font-size:16px">✨</span>
            <p style="color:${tierColor};font-size:10px;font-weight:700;margin:0;text-transform:uppercase;letter-spacing:1px">KinfolkAI™ Marketing Tip</p>
          </div>
          <p style="color:#F5EBD8;font-size:15px;line-height:1.6;margin:0">${data.aiMarketingTip}</p>
        </div>

        ${data.topActionItem ? `
        <!-- Top action item -->
        <div style="background:#0D2318;border-radius:12px;padding:18px 20px;margin-bottom:20px;border-left:4px solid #2D7A4F">
          <p style="color:#2D7A4F;font-size:10px;font-weight:700;margin:0 0 6px;text-transform:uppercase;letter-spacing:1px">🎯 Top Action This Week</p>
          <p style="color:#F5EBD8;font-size:14px;line-height:1.5;margin:0">${data.topActionItem}</p>
        </div>
        ` : ""}

        <!-- CTA -->
        <div style="text-align:center;margin-bottom:28px">
          <a href="https://mappingwithmelanin.com" style="display:inline-block;background:#CA922B;color:#fff;font-weight:700;font-size:15px;padding:14px 36px;border-radius:50px;text-decoration:none">
            Open Your Dashboard →
          </a>
        </div>

        ${data.tier === "navigator" ? `
        <div style="background:#F5EBD8;border-radius:10px;padding:16px 18px;margin-bottom:24px;text-align:center">
          <p style="color:#2B1507;font-size:13px;font-weight:700;margin:0 0 4px">Upgrade to Trailblazer</p>
          <p style="color:#6B7280;font-size:12px;margin:0 0 10px">Get deeper insights, skip-feedback analysis, and full AI action plans.</p>
          <a href="https://mappingwithmelanin.com/membership" style="background:#CA922B;color:#fff;font-size:12px;font-weight:700;padding:8px 20px;border-radius:20px;text-decoration:none">Upgrade Now</a>
        </div>
        ` : ""}

        <p style="color:#6B7280;font-size:12px;text-align:center;margin:0">
          Mapping With Melanin™ · <a href="https://mappingwithmelanin.com" style="color:#CA922B">mappingwithmelanin.com</a><br>
          You're receiving this because you have an active Navigator or Trailblazer membership with a business listing.
        </p>
      </div>
    `,
  });
}

// ── Beta announcement blast ────────────────────────────────────────────────────
export async function sendBetaAnnouncementBlast(
  to: string,
  firstName: string,
  betaSignupUrl: string,
) {
  if (!resend) return;
  if (await checkMarketingOptOut(to)) return;
  const name = firstName || "there";
  await sendEmail({
    from: FROM,
    to,
    replyTo: "hello@mappingwithmelanin.com",
    subject: `🗺️ Mapping With Melanin™ is almost here — join our beta`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping With Melanin" style="height:40px;margin-bottom:32px" />

        <div style="background:#2B1507;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px">
          <p style="color:#CA922B;font-size:13px;font-weight:700;margin:0 0 8px;text-transform:uppercase;letter-spacing:2px">Coming Soon</p>
          <p style="color:#fff;font-size:26px;font-weight:900;margin:0;letter-spacing:-0.5px">We're in testing. 🙌🏾</p>
        </div>

        <p style="color:#2B1507;font-size:16px;line-height:1.6;margin:0 0 16px">Hey ${name},</p>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 16px">
          We wanted to give you a heads-up — <strong>Mapping With Melanin™ is currently in app store testing</strong>
          and will be available for download very soon.
        </p>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 24px">
          In the meantime, we're looking for passionate community members to join our
          <strong style="color:#CA922B">beta testing program</strong> — get early access, help shape the experience,
          and be among the very first to discover minority-owned businesses and Community Intelligence on the app.
        </p>

        <div style="background:#F5EBD8;border-radius:12px;padding:20px 24px;margin-bottom:28px">
          <p style="color:#2B1507;font-size:14px;font-weight:700;margin:0 0 10px">🧪 Beta testers get:</p>
          <ul style="color:#3A1F0E;font-size:14px;line-height:1.8;margin:0;padding-left:18px">
            <li>Early access before the public launch</li>
            <li>Direct line to the founding team</li>
            <li>Your feedback built into the final product</li>
            <li>Founding Member recognition in the app</li>
          </ul>
        </div>

        <a href="${betaSignupUrl}" style="display:block;text-align:center;background:#CA922B;color:#fff;font-weight:700;font-size:16px;padding:16px 32px;border-radius:50px;text-decoration:none;margin-bottom:28px">
          Yes, I want to be a beta tester →
        </a>

        <p style="color:#6B7280;font-size:14px;line-height:1.6;text-align:center;margin:0 0 24px">
          Already on the waitlist? You're first in line — we'll be in touch as soon as the doors open.
        </p>

        <p style="color:#2B1507;font-size:15px;font-weight:700;font-style:italic;margin:16px 0 4px">Map Your Life. Connect Deeper.™</p>
        <p style="color:#3A1F0E;font-size:14px;margin:0 0 4px">The Mapping With Melanin™ Team</p>
        <p style="color:#3A1F0E;font-size:13px;opacity:0.5;margin:0">Melanin Maps LLC · <a href="https://mappingwithmelanin.com" style="color:#CA922B">mappingwithmelanin.com</a></p>
      </div>
    `,
  });
}

export async function sendAppLaunchBlast(
  to: string,
  firstName: string,
  position: number,
  referralCode: string,
  iosUrl: string,
  androidUrl: string,
) {
  if (!resend) return;
  const name = firstName || "there";
  const websiteUrl = `https://mappingwithmelanin.com/?ref=${referralCode}`;
  await sendEmail({
    from: FROM,
    to,
    replyTo: "hello@mappingwithmelanin.com",
    subject: `🎉 The Mapping with Melanin™ app is HERE — your spot is confirmed!`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping with Melanin" style="height:40px;margin-bottom:32px" />

        <div style="background:#CA922B;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px">
          <p style="color:#fff;font-size:28px;font-weight:900;margin:0 0 8px;letter-spacing:-0.5px">🎉 We're LIVE!</p>
          <p style="color:#fff;font-size:15px;margin:0;opacity:0.9">The wait is officially over.</p>
        </div>

        <p style="color:#2B1507;font-size:16px;line-height:1.6;margin:0 0 16px">Hello ${name},</p>

        <p style="color:#2B1507;font-size:18px;font-weight:700;line-height:1.4;margin:0 0 16px">
          Mapping with Melanin™ is now available for download — and your waitlist spot is confirmed.
        </p>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 24px">
          You were <strong style="color:#CA922B">#${position}</strong> on our waitlist. That early belief means everything to us.
          You helped build this community before it launched — and now it's yours to explore.
        </p>

        <div style="display:flex;gap:16px;margin-bottom:28px;flex-wrap:wrap">
          <a href="${iosUrl}" style="flex:1;min-width:200px;display:flex;align-items:center;gap:14px;background:#2B1507;border-radius:14px;padding:16px 20px;text-decoration:none">
            <span style="font-size:28px">🍎</span>
            <div>
              <p style="color:#F5EBD8;font-size:11px;margin:0;opacity:0.6;text-transform:uppercase;letter-spacing:1px">Download on the</p>
              <p style="color:#fff;font-size:18px;font-weight:800;margin:0;line-height:1.2">App Store</p>
              <p style="color:#CA922B;font-size:11px;margin:0">iOS</p>
            </div>
          </a>
          <a href="${androidUrl}" style="flex:1;min-width:200px;display:flex;align-items:center;gap:14px;background:#2B1507;border-radius:14px;padding:16px 20px;text-decoration:none">
            <span style="font-size:28px">🤖</span>
            <div>
              <p style="color:#F5EBD8;font-size:11px;margin:0;opacity:0.6;text-transform:uppercase;letter-spacing:1px">Get it on</p>
              <p style="color:#fff;font-size:18px;font-weight:800;margin:0;line-height:1.2">Google Play</p>
              <p style="color:#CA922B;font-size:11px;margin:0">Android</p>
            </div>
          </a>
        </div>

        <a href="${websiteUrl}" style="display:block;text-align:center;background:#CA922B;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:50px;text-decoration:none;margin-bottom:28px">
          Visit mappingwithmelanin.com →
        </a>

        <div style="background:#2B1507;border-radius:12px;padding:20px 24px;margin-bottom:24px">
          <p style="color:#CA922B;font-size:13px;font-weight:700;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px">Still have friends to invite?</p>
          <p style="color:#F5EBD8;font-size:14px;margin:0 0 12px;opacity:0.8">Share your referral code — every person you bring in strengthens the community.</p>
          <p style="color:#F5EBD8;font-size:12px;margin:0;opacity:0.6">Code: <span style="color:#CA922B;font-weight:700;letter-spacing:3px">${referralCode}</span></p>
        </div>

        <p style="color:#2B1507;font-size:15px;font-weight:700;font-style:italic;margin:16px 0 4px">Map Your Life. Connect Deeper.™</p>
        <p style="color:#3A1F0E;font-size:14px;margin:0 0 4px">The Mapping with Melanin™ Team</p>
        <p style="color:#3A1F0E;font-size:13px;opacity:0.5;margin:0">Melanin Maps LLC</p>
      </div>
    `,
  });
}

export async function sendMeetupSafetyWatcherEmail(
  to: string,
  watcherName: string | null,
  initiatorHandle: string,
  partnerHandle: string,
  location: string | null,
  note: string | null,
  meetupId: number,
) {
  if (!resend) return;
  const name = watcherName ?? "there";
  await sendEmail({
    from: FROM,
    replyTo: "hello@mappingwithmelanin.com",
    to,
    subject: `Safety Alert: @${initiatorHandle} is meeting @${partnerHandle} — You're their safety watcher`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping With Melanin" style="height:40px;margin-bottom:32px" />

        <div style="background:#7C3AED18;border:1px solid #7C3AED40;border-radius:12px;padding:16px 20px;margin-bottom:24px;display:flex;align-items:center;gap:12px">
          <span style="font-size:24px">🛡️</span>
          <p style="color:#5B21B6;font-size:15px;font-weight:700;margin:0">You've been designated as a safety watcher on Mapping With Melanin™</p>
        </div>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 16px">Hi ${name},</p>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 24px">
          <strong>@${initiatorHandle}</strong> is meeting <strong>@${partnerHandle}</strong> in person and has listed you as their safety contact. If something seems wrong, this email contains all the details you need.
        </p>

        <div style="background:#2B1507;border-radius:14px;padding:24px;margin-bottom:24px">
          <p style="color:#CA922B;font-size:13px;font-weight:700;margin:0 0 16px;text-transform:uppercase;letter-spacing:1px">Meetup Details</p>
          <p style="color:#F5EBD8;font-size:15px;margin:0 0 8px"><strong style="color:#CA922B">Person:</strong> @${initiatorHandle}</p>
          <p style="color:#F5EBD8;font-size:15px;margin:0 0 8px"><strong style="color:#CA922B">Meeting:</strong> @${partnerHandle}</p>
          ${location ? `<p style="color:#F5EBD8;font-size:15px;margin:0 0 8px"><strong style="color:#CA922B">📍 Location:</strong> ${location}</p>` : ""}
          ${note ? `<p style="color:#F5EBD8;font-size:15px;margin:0"><strong style="color:#CA922B">📝 Note:</strong> ${note}</p>` : ""}
        </div>

        <p style="color:#3A1F0E;font-size:15px;line-height:1.6;margin:0 0 16px">
          <strong>What does this mean for you?</strong> If @${initiatorHandle} doesn't check in with you after their meetup as expected, please reach out to them directly. If you believe they may be in danger and cannot reach them, contact local emergency services.
        </p>

        <p style="color:#3A1F0E;font-size:15px;line-height:1.6;margin:0 0 24px;opacity:0.7">
          This notification was sent because @${initiatorHandle} designated you as their safety watcher on Mapping With Melanin™. Meetup verification ID: #${meetupId}.
        </p>

        <p style="color:#2B1507;font-size:15px;font-weight:700;font-style:italic;margin:24px 0 4px">Map Your Life. Connect Deeper.™</p>
        <p style="color:#3A1F0E;font-size:13px;opacity:0.6;margin:0">Melanin Maps LLC · <a href="mailto:hello@mappingwithmelanin.com" style="color:#CA922B">hello@mappingwithmelanin.com</a></p>
      </div>
    `,
  });
}

export async function sendMeetupCheckinMissedEmail(
  to: string,
  friendName: string | null,
  memberName: string,
  checkType: "arrival" | "home",
  scheduledAt: Date,
  location: string | null,
  meetupId: number,
) {
  if (!resend) return;
  const name = friendName ?? "there";
  const checkLabel = checkType === "arrival" ? "arrival" : "home safe";
  const checkEmoji = checkType === "arrival" ? "📍" : "🏠";
  const timeStr = scheduledAt.toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true,
  });
  await sendEmail({
    from: FROM,
    replyTo: "hello@mappingwithmelanin.com",
    to,
    subject: `⚠️ ${memberName} missed their ${checkLabel} check-in`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping With Melanin" style="height:40px;margin-bottom:32px" />

        <div style="background:#DC2626;border-radius:12px;padding:20px 24px;margin-bottom:28px;display:flex;align-items:center;gap:16px">
          <span style="font-size:32px">${checkEmoji}</span>
          <div>
            <p style="color:#fff;font-size:18px;font-weight:700;margin:0 0 4px">Missed Check-In Alert</p>
            <p style="color:#fecaca;font-size:14px;margin:0">${memberName} has not confirmed their ${checkLabel} check-in.</p>
          </div>
        </div>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 16px">Hi ${name},</p>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 24px">
          <strong>${memberName}</strong> set up a safety check-in and listed you as their trusted friend.
          They were supposed to confirm their <strong>${checkLabel} check-in</strong> by <strong>${timeStr}</strong> — but they haven't.
        </p>

        <div style="background:#2B1507;border-radius:14px;padding:24px;margin-bottom:24px">
          <p style="color:#CA922B;font-size:13px;font-weight:700;margin:0 0 16px;text-transform:uppercase;letter-spacing:1px">Check-In Details</p>
          <p style="color:#F5EBD8;font-size:15px;margin:0 0 8px"><strong style="color:#CA922B">Person:</strong> ${memberName}</p>
          <p style="color:#F5EBD8;font-size:15px;margin:0 0 8px"><strong style="color:#CA922B">Check-in type:</strong> ${checkType === "arrival" ? "Arrival at meetup location" : "Safely home"}</p>
          <p style="color:#F5EBD8;font-size:15px;margin:0 0 8px"><strong style="color:#CA922B">Expected by:</strong> ${timeStr}</p>
          ${location ? `<p style="color:#F5EBD8;font-size:15px;margin:0"><strong style="color:#CA922B">📍 Location:</strong> ${location}</p>` : ""}
        </div>

        <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:12px;padding:20px;margin-bottom:24px">
          <p style="color:#991B1B;font-size:15px;font-weight:700;margin:0 0 8px">What should you do?</p>
          <p style="color:#7F1D1D;font-size:14px;line-height:1.6;margin:0 0 8px">
            1. Try reaching ${memberName} directly — call or text them now.
          </p>
          <p style="color:#7F1D1D;font-size:14px;line-height:1.6;margin:0 0 8px">
            2. If you cannot reach them and you believe they may be in danger, contact local emergency services (911).
          </p>
          <p style="color:#7F1D1D;font-size:14px;line-height:1.6;margin:0">
            3. <strong>Do not contact the person they were meeting</strong> — this check-in is private and only shared with you.
          </p>
        </div>

        <p style="color:#3A1F0E;font-size:13px;line-height:1.6;margin:0 0 24px;opacity:0.7">
          This alert was sent because ${memberName} designated you as their trusted safety friend on Mapping With Melanin™. Meetup ID: #${meetupId}.
        </p>

        <p style="color:#2B1507;font-size:15px;font-weight:700;font-style:italic;margin:24px 0 4px">Map Your Life. Connect Deeper.™</p>
        <p style="color:#3A1F0E;font-size:13px;opacity:0.6;margin:0">Melanin Maps LLC · <a href="mailto:hello@mappingwithmelanin.com" style="color:#CA922B">hello@mappingwithmelanin.com</a></p>
      </div>
    `,
  });
}

export async function sendMarketplaceInquiry({
  to,
  sellerName,
  buyerName,
  listingTitle,
  listingType,
  message,
  buyerContact,
}: {
  to: string;
  sellerName: string | null;
  buyerName: string;
  listingTitle: string;
  listingType: string;
  message: string;
  buyerContact: string | null;
}) {
  if (!resend) return;
  const name = sellerName ?? "there";
  const typeLabel = listingType === "skill_trade" ? "Skill Trade" : listingType.charAt(0).toUpperCase() + listingType.slice(1);
  await sendEmail({
    from: FROM,
    replyTo: "hello@mappingwithmelanin.com",
    to,
    subject: `Someone is interested in your listing — "${listingTitle}"`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping With Melanin" style="height:40px;margin-bottom:32px" />
        <h1 style="font-size:24px;color:#2B1507;font-weight:700;margin:0 0 12px;line-height:1.3">
          Hey ${name} — someone wants what you've got.
        </h1>
        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 24px">
          A community member is interested in your <strong>${typeLabel}</strong> listing on the Community Market.
        </p>
        <div style="background:#2B1507;border-radius:12px;padding:24px;margin-bottom:24px">
          <p style="color:#CA922B;font-size:12px;font-weight:700;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px">Your Listing</p>
          <p style="color:#F5EBD8;font-size:17px;font-weight:700;margin:0 0 4px">${listingTitle}</p>
          <p style="color:#F5EBD8;font-size:13px;margin:0;opacity:0.7">Type: ${typeLabel}</p>
        </div>
        <div style="background:#FFFFFF;border:1px solid #E8D9C4;border-radius:12px;padding:20px;margin-bottom:24px">
          <p style="color:#CA922B;font-size:12px;font-weight:700;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px">Message from ${buyerName}</p>
          <p style="color:#2B1507;font-size:15px;line-height:1.6;margin:0 0 16px;font-style:italic">"${message}"</p>
          ${buyerContact ? `<p style="color:#3A1F0E;font-size:14px;margin:0"><strong>Their contact:</strong> ${buyerContact}</p>` : ""}
        </div>
        <p style="color:#3A1F0E;font-size:14px;line-height:1.6;margin:0 0 24px;background:#FEF9F0;border:1px solid #F0D9B0;border-radius:8px;padding:14px">
          Reply directly to this email to reach ${buyerName}, or reach out via the contact info above. Always meet in public places for in-person exchanges.
        </p>
        <p style="color:#2B1507;font-size:15px;font-weight:700;font-style:italic;margin:24px 0 4px">Map Your Life. Connect Deeper.™</p>
        <p style="color:#3A1F0E;font-size:13px;opacity:0.6;margin:0">Melanin Maps LLC · <a href="mailto:hello@mappingwithmelanin.com" style="color:#CA922B">hello@mappingwithmelanin.com</a></p>
      </div>
    `,
  });
}

/**
 * sendWaitlistInvitation
 *
 * Sends a warm personal invitation to a waitlist member for the
 * Founding Community Preview event.
 *
 * All event fields are optional — pass undefined to render a
 * placeholder so the template is ready to send the moment you
 * have the details.
 */
export async function sendWaitlistInvitation(
  to: string,
  firstName: string | null,
  opts?: {
    eventDate?: string;     // e.g. "Thursday, August 7, 2025"
    eventTime?: string;     // e.g. "7:00 PM ET / 4:00 PM PT"
    zoomLink?: string;      // full https://zoom.us/… URL
    zoomMeetingId?: string; // e.g. "123 456 7890"
  },
) {
  if (!resend) return;
  const name         = firstName ?? "there";
  const eventDate    = opts?.eventDate    ?? "Date to be announced";
  const eventTime    = opts?.eventTime    ?? "Time to be announced";
  const zoomLink     = opts?.zoomLink     ?? "#";
  const zoomDisplay  = opts?.zoomLink     ?? "Link to be shared";
  const zoomId       = opts?.zoomMeetingId
    ? `<p style="color:#3A1F0E;font-size:13px;margin:4px 0 0;opacity:0.6">Meeting ID: ${opts.zoomMeetingId}</p>`
    : "";

  const agendaItems = [
    "Why Mapping With Melanin&trade; was created",
    "A live walkthrough of the platform",
    "Upcoming features",
    "Our roadmap",
    "How you can become one of our Founding Members",
    "Live Q&amp;A",
  ];

  await sendEmail({
    from: FROM,
    replyTo: "hello@mappingwithmelanin.com",
    to,
    subject: "You're Invited: A First Look at Mapping With Melanin\u2122",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping With Melanin" style="height:40px;margin-bottom:32px" />

        <p style="color:#2B1507;font-size:16px;line-height:1.6;margin:0 0 8px">Hello ${name},</p>

        <h1 style="font-size:28px;color:#2B1507;font-weight:700;margin:0 0 16px;line-height:1.3">
          You're invited to an exclusive Founding Community Preview.
        </h1>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.7;margin:0 0 16px">
          You've shown interest in Mapping With Melanin&#8482;, and we'd love to personally invite you to an exclusive
          <strong>Founding Community Preview</strong>.
        </p>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.7;margin:0 0 28px">
          This isn't just a product demonstration &#8212; it's an opportunity to hear the story behind the platform,
          see an early look at what's coming, and help shape the future of our community.
        </p>

        <div style="background:#2B1507;border-radius:14px;padding:28px;margin-bottom:28px">
          <p style="color:#CA922B;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 20px">During the event we'll share</p>
          <table style="width:100%;border-collapse:collapse">
            ${agendaItems.map((item) => `
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid rgba(245,235,216,0.08);vertical-align:top;width:20px">
                <div style="width:7px;height:7px;background:#CA922B;border-radius:50%;margin-top:7px"></div>
              </td>
              <td style="padding:8px 0 8px 14px;border-bottom:1px solid rgba(245,235,216,0.08)">
                <p style="color:#F5EBD8;font-size:15px;margin:0;line-height:1.5">${item}</p>
              </td>
            </tr>`).join("")}
          </table>
        </div>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.7;margin:0 0 28px">
          Whether you're a traveler, business owner, creator, or someone who believes in building stronger communities &#8212; we'd love to have you with us.
        </p>

        <div style="background:#fff;border:1px solid rgba(202,146,43,0.3);border-radius:14px;padding:28px;margin-bottom:32px">
          <p style="color:#CA922B;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 20px">Event Details</p>
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(43,21,7,0.07);vertical-align:top;width:32px">
                <span style="font-size:20px">&#128197;</span>
              </td>
              <td style="padding:10px 0 10px 14px;border-bottom:1px solid rgba(43,21,7,0.07)">
                <p style="color:#3A1F0E;font-size:11px;font-weight:700;margin:0 0 3px;text-transform:uppercase;letter-spacing:1px;opacity:0.5">Date</p>
                <p style="color:#2B1507;font-size:16px;font-weight:700;margin:0">${eventDate}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(43,21,7,0.07);vertical-align:top;width:32px">
                <span style="font-size:20px">&#128338;</span>
              </td>
              <td style="padding:10px 0 10px 14px;border-bottom:1px solid rgba(43,21,7,0.07)">
                <p style="color:#3A1F0E;font-size:11px;font-weight:700;margin:0 0 3px;text-transform:uppercase;letter-spacing:1px;opacity:0.5">Time</p>
                <p style="color:#2B1507;font-size:16px;font-weight:700;margin:0">${eventTime}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;vertical-align:top;width:32px">
                <span style="font-size:20px">&#128205;</span>
              </td>
              <td style="padding:10px 0 10px 14px">
                <p style="color:#3A1F0E;font-size:11px;font-weight:700;margin:0 0 3px;text-transform:uppercase;letter-spacing:1px;opacity:0.5">Zoom Link</p>
                <a href="${zoomLink}" style="color:#CA922B;font-size:15px;font-weight:700;word-break:break-all;text-decoration:none">${zoomDisplay}</a>
                ${zoomId}
              </td>
            </tr>
          </table>
        </div>

        <div style="text-align:center;margin-bottom:32px">
          <a href="${zoomLink}" style="display:inline-block;background:#CA922B;color:#fff;font-weight:700;font-size:17px;padding:18px 48px;border-radius:50px;text-decoration:none;letter-spacing:0.3px;box-shadow:0 4px 16px rgba(202,146,43,0.35)">
            Save My Spot &#8594;
          </a>
        </div>

        <div style="border-left:3px solid #CA922B;padding-left:18px;margin-bottom:32px">
          <p style="color:#3A1F0E;font-size:14px;line-height:1.7;margin:0;font-style:italic">
            If you know someone who would enjoy being part of this journey, feel free to forward this invitation.
            The more people who show up, the richer the conversation will be.
          </p>
        </div>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 28px">
          We can't wait to meet you.
        </p>

        <p style="color:#2B1507;font-size:16px;font-weight:700;font-style:italic;margin:0 0 4px">Map Your Life. Connect Deeper.&#8482;</p>
        <p style="color:#3A1F0E;font-size:15px;margin:0 0 4px">The Mapping With Melanin&#8482; Team</p>
        <p style="color:#3A1F0E;font-size:13px;opacity:0.5;margin:0">
          Melanin Maps LLC &#183;
          <a href="mailto:hello@mappingwithmelanin.com" style="color:#CA922B">hello@mappingwithmelanin.com</a>
        </p>
      </div>
    `,
  });
}

export async function sendWaitlistUpdateEmail(to: string, firstName: string) {
  if (!resend) return;
  if (await checkMarketingOptOut(to)) return;
  const name = firstName || "there";
  await sendEmail({
    from: FROM,
    to,
    replyTo: "hello@mappingwithmelanin.com",
    subject: "An Update from Mapping with Melanin™ 🗺️",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping With Melanin" style="height:40px;margin-bottom:32px" />

        <div style="background:#2B1507;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px">
          <p style="color:#CA922B;font-size:12px;font-weight:700;margin:0 0 8px;text-transform:uppercase;letter-spacing:2px">A Note From Our Team</p>
          <p style="color:#fff;font-size:22px;font-weight:900;margin:0;letter-spacing:-0.3px">We wanted to share a quick update.</p>
        </div>

        <p style="color:#2B1507;font-size:16px;line-height:1.6;margin:0 0 16px">Hi ${name},</p>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 16px">
          We wanted to share a quick update with you because <strong>you've been with us from the beginning.</strong>
        </p>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 16px">
          Mapping with Melanin™ is currently in our <strong>active testing phase.</strong> Every day we're working
          with our founding testers to refine the experience, improve performance, and make sure everything works
          the way it should before opening the doors to our community.
        </p>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 24px">
          We're taking the time to get this right because our mission has always been bigger than launching an app —
          we're building a trusted platform where people can <strong>discover community, support minority-owned
          businesses, travel with greater confidence, and create meaningful connections</strong> wherever life takes them.
        </p>

        <div style="background:#F5EBD8;border-radius:12px;padding:24px;margin-bottom:28px">
          <p style="color:#2B1507;font-size:15px;font-weight:700;margin:0 0 12px">
            Live Zoom Welcome Sessions — Coming Soon
          </p>
          <p style="color:#3A1F0E;font-size:15px;line-height:1.6;margin:0 0 12px">
            Over the next few weeks, we'll begin hosting a series of live Zoom Welcome Sessions for our waitlist
            community. During these sessions, we'll share:
          </p>
          <ul style="color:#3A1F0E;font-size:15px;line-height:1.9;margin:0;padding-left:20px">
            <li>Our vision for Mapping with Melanin™</li>
            <li>What makes the platform different</li>
            <li>What to expect at launch</li>
            <li>How founding members will help shape the future of our community</li>
            <li>Opportunities to ask questions and meet other early supporters</li>
          </ul>
        </div>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 24px">
          We'll be sending more information soon, including dates and registration details.
        </p>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 8px">
          Thank you for believing in what we're building and for your patience throughout this journey. Your support
          has meant more than you know, and we can't wait to welcome you into the community.
        </p>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 24px">We're getting closer every day.</p>

        <p style="color:#2B1507;font-size:17px;font-weight:700;margin:0 0 4px">Welcome Home.</p>
        <p style="color:#3A1F0E;font-size:15px;margin:0 0 28px">The Mapping with Melanin™ Team</p>

        <div style="background:#2B1507;border-radius:12px;padding:20px 24px;margin-bottom:28px">
          <p style="color:#CA922B;font-size:13px;font-weight:700;margin:0 0 6px">P.S.</p>
          <p style="color:#F5EBD8;font-size:14px;line-height:1.7;margin:0">
            Keep an eye on your inbox over the next few weeks — you'll be among the first to receive invitations to
            our Welcome Sessions, early updates, and important launch announcements.
          </p>
        </div>

        <p style="color:#2B1507;font-size:15px;font-weight:700;font-style:italic;margin:16px 0 4px">Map Your Life. Connect Deeper.™</p>
        <p style="color:#3A1F0E;font-size:14px;margin:0 0 4px">The Mapping With Melanin™ Team</p>
        <p style="color:#3A1F0E;font-size:13px;opacity:0.5;margin:0">Melanin Maps LLC · <a href="https://mappingwithmelanin.com" style="color:#CA922B">mappingwithmelanin.com</a></p>

        ${canSpamFooterHtml(to)}
      </div>
    `,
  });
}
