import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = "Mapping With Melanin™ <hello@mappingwithmelanin.com>";

function log(msg: string) {
  if (!resend) console.warn("[email] RESEND_API_KEY not set — skipping:", msg);
}

export async function sendWaitlistConfirmation(to: string, position: number, referralCode: string, firstName: string) {
  if (!resend) { log("waitlist confirmation"); return; }
  const referralLink = `https://mappingwithmelanin.com/?ref=${referralCode}`;
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Welcome to the Mapping with Melanin™ Waitlist 🗺️✊🏾",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping with Melanin" style="height:40px;margin-bottom:32px" />

        <p style="color:#2B1507;font-size:16px;line-height:1.6;margin:0 0 16px">Hello ${firstName},</p>

        <p style="color:#2B1507;font-size:16px;line-height:1.6;margin:0 0 16px">Welcome to the Mapping with Melanin™ waitlist!</p>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 16px">
          We're excited to have you join a growing community of travelers, explorers, professionals, entrepreneurs, and changemakers who believe that finding connection, opportunity, and belonging should be easier wherever life takes you.
        </p>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 16px">
          Mapping with Melanin™ is more than an app. We're building a community-powered platform designed to help people discover businesses, neighborhoods, employers, events, and communities through real experiences and shared insights.
        </p>

        <p style="color:#2B1507;font-size:16px;font-weight:700;margin:0 0 8px">As a waitlist member, you'll be among the first to:</p>
        <ul style="color:#3A1F0E;font-size:16px;line-height:1.8;margin:0 0 16px;padding-left:20px">
          <li>Receive early access to the platform</li>
          <li>Help shape future features and functionality</li>
          <li>Participate in testing opportunities</li>
          <li>Share feedback that directly influences development</li>
          <li>Join a community committed to connection, discovery, and empowerment</li>
        </ul>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 16px">
          What makes Mapping with Melanin™ different is that the platform is powered by its community. Every review, recommendation, safety insight, business listing, event submission, and neighborhood experience helps create a richer, more valuable resource for everyone.
        </p>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 24px">
          Your voice matters, and we're grateful you've chosen to be part of this journey from the beginning.
        </p>

        <p style="color:#2B1507;font-size:16px;font-weight:700;margin:0 0 24px">Waitlist Position: <span style="color:#CA922B">#${position}</span></p>

        <div style="background:#2B1507;border-radius:12px;padding:24px;margin-bottom:24px">
          <p style="color:#F5EBD8;font-size:14px;font-weight:700;margin:0 0 12px;text-align:center;letter-spacing:1px">── Move Up the Waitlist ──</p>
          <p style="color:#F5EBD8;font-size:15px;line-height:1.6;margin:0 0 16px;text-align:center">
            Invite friends and move up the waitlist. Every person who joins using your link moves you closer to early access.
          </p>
          <p style="color:#F5EBD8;font-size:14px;margin:0 0 6px">Your personal link:</p>
          <a href="${referralLink}" style="color:#CA922B;font-size:14px;word-break:break-all;display:block;margin-bottom:12px">${referralLink}</a>
          <p style="color:#F5EBD8;font-size:14px;margin:0 0 6px">Your referral code:</p>
          <p style="color:#CA922B;font-size:20px;font-weight:700;margin:0;letter-spacing:4px">${referralCode}</p>
          <p style="color:#F5EBD8;font-size:13px;margin:16px 0 0;text-align:center;opacity:0.7">──────────────────────────</p>
        </div>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 16px">
          We'll keep you updated as we move closer to launch and will reach out with opportunities for early access, testing, and exclusive announcements.
        </p>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 24px">
          Thank you for joining us as we build something special.
        </p>

        <p style="color:#2B1507;font-size:16px;font-weight:700;font-style:italic;margin:0 0 4px">Map Your Life. Connect Deeper.™</p>

        <p style="color:#3A1F0E;font-size:15px;margin:0 0 4px">The Mapping with Melanin™ Team</p>
        <p style="color:#3A1F0E;font-size:14px;opacity:0.6;margin:0">Melanin Maps LLC</p>
      </div>
    `,
  });
}

export async function sendReferralNudge(
  to: string,
  firstName: string,
  position: number,
  referralCode: string,
  newSignupsThisWeek: number,
) {
  if (!resend) { log("referral nudge"); return; }
  const referralLink = `https://mappingwithmelanin.com/?ref=${referralCode}`;
  const name = firstName || "there";
  await resend.emails.send({
    from: FROM,
    to,
    subject: `You're #${position} on the Mapping with Melanin™ waitlist 📍`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping with Melanin" style="height:40px;margin-bottom:32px" />

        <p style="color:#2B1507;font-size:16px;line-height:1.6;margin:0 0 16px">Hello ${name},</p>

        <p style="color:#2B1507;font-size:18px;font-weight:700;line-height:1.4;margin:0 0 16px">
          You're still <span style="color:#CA922B">#${position}</span> on the Mapping with Melanin™ waitlist.
        </p>

        ${newSignupsThisWeek > 0 ? `
        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 16px">
          <strong>${newSignupsThisWeek.toLocaleString()} people</strong> joined the waitlist this week.
          Share your referral link to move ahead of them and get closer to early access.
        </p>
        ` : `
        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 16px">
          Share your referral link with friends to move up the waitlist and get early access sooner.
        </p>
        `}

        <div style="background:#2B1507;border-radius:12px;padding:28px;margin:24px 0">
          <p style="color:#F5EBD8;font-size:14px;font-weight:700;margin:0 0 12px;text-align:center;letter-spacing:1px">── Your Referral Link ──</p>
          <p style="color:#F5EBD8;font-size:15px;line-height:1.6;margin:0 0 16px;text-align:center">
            Every friend who joins using your link moves you up the list.
          </p>
          <a href="${referralLink}" style="color:#CA922B;font-size:15px;word-break:break-all;display:block;margin-bottom:12px;font-weight:700">${referralLink}</a>
          <p style="color:#F5EBD8;font-size:13px;margin:0;opacity:0.7">Referral code: <span style="color:#CA922B;font-weight:700;letter-spacing:3px">${referralCode}</span></p>
        </div>

        <a href="${referralLink}" style="display:inline-block;background:#CA922B;color:#fff;font-weight:700;font-size:16px;padding:14px 32px;border-radius:50px;text-decoration:none;margin-bottom:24px">
          Share Your Link →
        </a>

        <p style="color:#3A1F0E;font-size:14px;line-height:1.6;margin:0 0 8px;opacity:0.7">
          We're building something special and we're grateful you're part of the journey from the beginning.
        </p>

        <p style="color:#2B1507;font-size:15px;font-weight:700;font-style:italic;margin:16px 0 4px">Map Your Life. Connect Deeper.™</p>
        <p style="color:#3A1F0E;font-size:14px;margin:0 0 4px">The Mapping with Melanin™ Team</p>
        <p style="color:#3A1F0E;font-size:13px;opacity:0.5;margin:0">Melanin Maps LLC</p>
      </div>
    `,
  });
}

export async function sendBusinessOutreach(to: string, businessName: string, claimLink: string) {
  if (!resend) { log("business outreach"); return; }
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your business was recommended on Mapping with Melanin™ — Claim Your Profile`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping with Melanin" style="height:40px;margin-bottom:32px" />

        <p style="color:#2B1507;font-size:16px;line-height:1.6;margin:0 0 16px">Hello ${businessName},</p>

        <p style="color:#CA922B;font-size:18px;font-weight:700;line-height:1.4;margin:0 0 20px">Great news!</p>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 16px">
          Your business was recently recommended by a member of the Mapping with Melanin™ community and has been identified as a place that others may want to discover, support, and learn more about.
        </p>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 16px">
          Mapping with Melanin™ is a community-powered platform that helps people discover businesses, events, neighborhoods, employers, and opportunities through shared experiences and trusted recommendations.
        </p>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 24px">
          We've created a listing for your business so community members can find you, but we'd love for you to claim your profile and become an active part of the platform.
        </p>

        <div style="background:#2B1507;border-radius:12px;padding:28px;margin:0 0 28px">
          <p style="color:#F5EBD8;font-size:15px;font-weight:700;margin:0 0 16px">By joining, you'll be able to:</p>
          <ul style="color:#F5EBD8;font-size:15px;line-height:2;margin:0;padding-left:20px">
            <li>Verify and manage your business information</li>
            <li>Add photos, products, services, and events</li>
            <li>Respond to reviews and community feedback</li>
            <li>Connect directly with potential customers</li>
            <li>Access business insights and engagement metrics</li>
            <li>Participate in future promotional opportunities</li>
          </ul>
        </div>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 28px">
          Most importantly, you'll help us build a stronger network of businesses and community resources for people seeking meaningful connections and trusted recommendations.
        </p>

        <p style="color:#2B1507;font-size:16px;font-weight:700;margin:0 0 16px">Claim your profile today:</p>

        <a href="${claimLink}" style="display:inline-block;background:#CA922B;color:#fff;font-weight:700;font-size:16px;padding:16px 36px;border-radius:50px;text-decoration:none;margin-bottom:32px">
          Claim Business Profile →
        </a>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 24px">
          Thank you for everything you do for your community. We look forward to welcoming you to Mapping with Melanin™.
        </p>

        <p style="color:#2B1507;font-size:16px;font-weight:700;font-style:italic;margin:0 0 4px">Map Your Life. Connect Deeper.™</p>
        <p style="color:#3A1F0E;font-size:15px;margin:0 0 4px">The Mapping with Melanin™ Team</p>
        <p style="color:#3A1F0E;font-size:14px;opacity:0.6;margin:0">Melanin Maps LLC</p>
      </div>
    `,
  });
}

export async function sendApprovalNotification(to: string, firstName: string | null) {
  if (!resend) { log("approval notification"); return; }
  const name = firstName ?? "there";
  await resend.emails.send({
    from: FROM,
    to,
    subject: "You're approved — Welcome to Mapping With Melanin™ 🗺️",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping With Melanin" style="height:40px;margin-bottom:32px" />
        <h1 style="font-size:28px;color:#2B1507;margin:0 0 12px">You're in, ${name}! 🎉</h1>
        <p style="color:#3A1F0E;opacity:0.7;font-size:16px;line-height:1.6;margin:0 0 28px">
          Your early access to <strong>Mapping With Melanin™</strong> has been approved. Sign in now to start discovering Black-owned businesses, community events, and safety intel in your area.
        </p>
        <a href="https://mappingwithmelanin.com/login" style="display:inline-block;background:#CA922B;color:#fff;font-weight:700;font-size:16px;padding:14px 32px;border-radius:50px;text-decoration:none;margin-bottom:28px">
          Sign In Now →
        </a>
        <p style="color:#3A1F0E;opacity:0.5;font-size:13px;margin:0">
          Questions? Reach us at <a href="mailto:hello@mappingwithmelanin.com" style="color:#CA922B">hello@mappingwithmelanin.com</a>
        </p>
      </div>
    `,
  });
}
