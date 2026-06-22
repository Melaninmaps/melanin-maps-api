import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = "Mapping With Melanin™ <hello@mappingwithmelanin.com>";

function log(_msg: string) {
  // RESEND_API_KEY not configured — email silently skipped in this environment
}

export async function sendWelcomeEmail(to: string, firstName: string | null) {
  if (!resend) { log("welcome email"); return; }
  const name = firstName ?? "there";
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Welcome to Mapping With Melanin™ 🗺️✊🏾",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping With Melanin" style="height:40px;margin-bottom:32px" />

        <h1 style="font-size:28px;color:#2B1507;font-weight:700;margin:0 0 12px;line-height:1.3">
          Welcome, ${name}. You're in. 🎉
        </h1>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 16px">
          Your account has been created. You're now part of a growing community of travelers, entrepreneurs, and explorers who believe finding connection, safety, and belonging should be easier — wherever life takes you.
        </p>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 24px">
          Here's what you can start doing right now:
        </p>

        <div style="background:#2B1507;border-radius:12px;padding:28px;margin-bottom:28px">
          <p style="color:#F5EBD8;font-size:14px;font-weight:700;margin:0 0 16px;letter-spacing:1px;text-transform:uppercase">Your platform at a glance</p>
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(245,235,216,0.1);vertical-align:top;width:32px">
                <span style="font-size:20px">🏪</span>
              </td>
              <td style="padding:10px 0 10px 12px;border-bottom:1px solid rgba(245,235,216,0.1)">
                <p style="color:#F5EBD8;font-size:15px;font-weight:700;margin:0 0 2px">Discover Black-Owned Businesses</p>
                <p style="color:#F5EBD8;font-size:13px;margin:0;opacity:0.7">Browse hundreds of verified businesses across every category and city.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(245,235,216,0.1);vertical-align:top;width:32px">
                <span style="font-size:20px">🛡️</span>
              </td>
              <td style="padding:10px 0 10px 12px;border-bottom:1px solid rgba(245,235,216,0.1)">
                <p style="color:#F5EBD8;font-size:15px;font-weight:700;margin:0 0 2px">Community Safety Intel</p>
                <p style="color:#F5EBD8;font-size:13px;margin:0;opacity:0.7">Read and submit neighborhood safety reports from real community members.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(245,235,216,0.1);vertical-align:top;width:32px">
                <span style="font-size:20px">🗺️</span>
              </td>
              <td style="padding:10px 0 10px 12px;border-bottom:1px solid rgba(245,235,216,0.1)">
                <p style="color:#F5EBD8;font-size:15px;font-weight:700;margin:0 0 2px">Map View</p>
                <p style="color:#F5EBD8;font-size:13px;margin:0;opacity:0.7">See businesses pinned on a full map with safety overlays for any area.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;vertical-align:top;width:32px">
                <span style="font-size:20px">✨</span>
              </td>
              <td style="padding:10px 0 10px 12px">
                <p style="color:#F5EBD8;font-size:15px;font-weight:700;margin:0 0 2px">KinfolkAI Travel Planning</p>
                <p style="color:#F5EBD8;font-size:13px;margin:0;opacity:0.7">Plan journeys that center culture, community, and comfort with AI assistance.</p>
              </td>
            </tr>
          </table>
        </div>

        <div style="text-align:center;margin-bottom:32px">
          <a href="https://mappingwithmelanin.com/discover" style="display:inline-block;background:#CA922B;color:#fff;font-weight:700;font-size:16px;padding:16px 40px;border-radius:50px;text-decoration:none">
            Start Exploring →
          </a>
        </div>

        <p style="color:#3A1F0E;font-size:15px;line-height:1.6;margin:0 0 8px">
          Have a question or want to submit a business? Reply to this email — a real person will read it.
        </p>

        <p style="color:#2B1507;font-size:16px;font-weight:700;font-style:italic;margin:24px 0 4px">Map Your Life. Connect Deeper.™</p>
        <p style="color:#3A1F0E;font-size:15px;margin:0 0 4px">The Mapping With Melanin™ Team</p>
        <p style="color:#3A1F0E;font-size:13px;opacity:0.6;margin:0">Melanin Maps LLC · <a href="mailto:hello@mappingwithmelanin.com" style="color:#CA922B">hello@mappingwithmelanin.com</a></p>
      </div>
    `,
  });
}

export async function sendWaitlistConfirmation(to: string, position: number, referralCode: string, firstName: string) {
  if (!resend) { log("waitlist confirmation"); return; }
  const referralLink = `https://mappingwithmelanin.com/?ref=${referralCode}`;
  await resend.emails.send({
    from: FROM,
    to,
    subject: "You're in — Welcome to the Mapping with Melanin™ Waitlist",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping with Melanin" style="height:40px;margin-bottom:32px" />

        <p style="color:#2B1507;font-size:16px;line-height:1.6;margin:0 0 8px">Hello ${firstName},</p>

        <h1 style="font-size:28px;color:#2B1507;font-weight:700;margin:0 0 24px;line-height:1.3">You're in!</h1>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 16px">
          Thank you for joining the Mapping with Melanin™ waitlist and becoming one of the founding members of our growing community.
        </p>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 16px">
          We're building more than an app. We're creating a community-powered platform designed to help people discover businesses, neighborhoods, employers, events, and meaningful connections through trusted experiences and shared insights.
        </p>

        <p style="color:#2B1507;font-size:16px;font-weight:700;margin:0 0 8px">Our mission is simple:</p>
        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 24px;font-style:italic">
          To help people navigate the world with greater confidence, connection, opportunity, and belonging.
        </p>

        <p style="color:#2B1507;font-size:16px;font-weight:700;margin:0 0 12px">As a waitlist member, you'll receive:</p>
        <ul style="color:#3A1F0E;font-size:16px;line-height:2;margin:0 0 24px;padding-left:20px">
          <li>Early access to the platform before public launch</li>
          <li>Opportunities to participate in beta testing</li>
          <li>Exclusive product updates and behind-the-scenes previews</li>
          <li>The ability to shape future features through your feedback</li>
          <li>Priority access to special launch promotions and rewards</li>
        </ul>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 16px">
          What makes Mapping with Melanin™ different is that the platform is powered by the community it serves.
        </p>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 24px">
          Every recommendation, review, business listing, neighborhood insight, event submission, and safety observation helps create a resource that becomes more valuable for everyone.
        </p>

        <p style="color:#2B1507;font-size:16px;font-weight:700;margin:0 0 24px">
          Your waitlist position: <span style="color:#CA922B">#${position}</span>
        </p>

        <div style="background:#2B1507;border-radius:12px;padding:28px;margin-bottom:28px">
          <p style="color:#F5EBD8;font-size:16px;font-weight:700;margin:0 0 12px">Want to move up the list?</p>
          <p style="color:#F5EBD8;font-size:15px;line-height:1.6;margin:0 0 20px">
            Share Mapping with Melanin™ with your friends, family, and community. The more people you refer, the closer you move toward early access.
          </p>
          <p style="color:#F5EBD8;font-size:14px;font-weight:700;margin:0 0 8px">Your referral link:</p>
          <a href="${referralLink}" style="color:#CA922B;font-size:15px;font-weight:700;word-break:break-all;display:block;margin-bottom:20px">${referralLink}</a>
          <a href="${referralLink}" style="display:inline-block;background:#CA922B;color:#fff;font-weight:700;font-size:15px;padding:12px 28px;border-radius:50px;text-decoration:none">
            Share Your Link →
          </a>
        </div>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 16px">
          We're honored to have you with us from the beginning and can't wait to show you what we're building.
        </p>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 24px">
          Together, we're creating a new way to discover, connect, and belong.
        </p>

        <p style="color:#2B1507;font-size:16px;font-weight:700;font-style:italic;margin:0 0 4px">Map Your Life. Connect Deeper.™</p>
        <p style="color:#3A1F0E;font-size:15px;margin:0 0 4px">The Mapping with Melanin™ Team</p>
        <p style="color:#3A1F0E;font-size:14px;opacity:0.6;margin:0 0 4px">Melanin Maps LLC</p>
        <a href="https://mappingwithmelanin.com" style="color:#CA922B;font-size:14px;">www.mappingwithmelanin.com</a>
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
          Your early access to <strong>Mapping With Melanin™</strong> has been approved. Sign in now to start discovering Minority-owned businesses, community events, and safety intel in your area.
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

const PLAN_LABELS: Record<string, string> = {
  individual: "Explorer",
  business: "Business Starter",
  founding: "Founding Member",
  beta: "Beta Tester",
  business_referral: "Business Referral Partner",
};

const PLAN_PRICES: Record<string, string> = {
  individual: "$9.99/month or $79/year",
  business: "$29.99/month or $249/year",
  founding: "locked-in introductory rate",
  beta: "standard monthly rate",
  business_referral: "$29.99/month",
};

export async function sendTrialStarted(
  to: string,
  firstName: string | null,
  planType: string,
  trialDays: number,
  trialEndsAt: Date,
) {
  if (!resend) { log("trial started"); return; }
  const name = firstName ?? "there";
  const planLabel = PLAN_LABELS[planType] ?? "Premium";
  const endDate = trialEndsAt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const renewalPrice = PLAN_PRICES[planType] ?? "$9.99/month";

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your ${trialDays}-day free trial has started — welcome to Mapping with Melanin™ 🎉`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping with Melanin" style="height:40px;margin-bottom:32px" />

        <p style="color:#2B1507;font-size:16px;line-height:1.6;margin:0 0 8px">Hello ${name},</p>

        <h1 style="font-size:28px;color:#2B1507;font-weight:700;margin:0 0 16px;line-height:1.3">
          Your free trial is officially underway. 🗺️
        </h1>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 24px">
          Your <strong>${planLabel}</strong> free trial has started. You have full Premium access for the next <strong>${trialDays} days</strong> — explore everything without restriction.
        </p>

        <div style="background:#2B1507;border-radius:12px;padding:24px;margin-bottom:28px">
          <p style="color:#F5EBD8;font-size:14px;font-weight:700;margin:0 0 12px;letter-spacing:1px;text-transform:uppercase">Your trial details</p>
          <p style="color:#F5EBD8;font-size:15px;margin:0 0 8px">
            <strong>Plan:</strong> <span style="color:#CA922B">${planLabel}</span>
          </p>
          <p style="color:#F5EBD8;font-size:15px;margin:0 0 8px">
            <strong>Trial length:</strong> <span style="color:#CA922B">${trialDays} days free</span>
          </p>
          <p style="color:#F5EBD8;font-size:15px;margin:0">
            <strong>Trial ends:</strong> <span style="color:#CA922B">${endDate}</span>
          </p>
        </div>

        <p style="color:#2B1507;font-size:16px;font-weight:700;margin:0 0 12px">Here's what you can do right now:</p>
        <ul style="color:#3A1F0E;font-size:15px;line-height:2;margin:0 0 24px;padding-left:20px">
          <li>Explore Minority-owned businesses and cultural gems in your city</li>
          <li>Check community safety scores for neighborhoods</li>
          <li>Save your favorite businesses and build collections</li>
          <li>Submit reviews and safety reports to help the community</li>
          <li>Plan your next trip with KinfolkAI</li>
        </ul>

        <a href="https://mappingwithmelanin.com/discover" style="display:inline-block;background:#CA922B;color:#fff;font-weight:700;font-size:16px;padding:16px 36px;border-radius:50px;text-decoration:none;margin-bottom:32px">
          Start Exploring →
        </a>

        <div style="background:#fff;border:1px solid rgba(58,31,14,0.1);border-radius:12px;padding:20px;margin-bottom:24px">
          <p style="color:#2B1507;font-size:14px;font-weight:700;margin:0 0 8px">💡 What happens when my trial ends?</p>
          <p style="color:#3A1F0E;font-size:14px;line-height:1.6;margin:0">
            We'll send you a reminder email <strong>3 days before your trial ends</strong> on ${endDate}. If you choose to continue, your membership renews at <strong>${renewalPrice}</strong>. If you cancel before then, you owe nothing and your account reverts to our free Community plan — you'll never lose directory access entirely.
          </p>
        </div>

        <p style="color:#2B1507;font-size:16px;font-weight:700;font-style:italic;margin:0 0 4px">Map Your Life. Connect Deeper.™</p>
        <p style="color:#3A1F0E;font-size:15px;margin:0 0 4px">The Mapping with Melanin™ Team</p>
        <p style="color:#3A1F0E;font-size:13px;opacity:0.5;margin:0">Melanin Maps LLC</p>
      </div>
    `,
  });
}

export async function sendTrialEndingSoon(
  to: string,
  firstName: string | null,
  planType: string,
  trialEndsAt: Date,
  daysLeft: number,
) {
  if (!resend) { log("trial ending soon"); return; }
  const name = firstName ?? "there";
  const planLabel = PLAN_LABELS[planType] ?? "Premium";
  const renewalPrice = PLAN_PRICES[planType] ?? "$9.99/month";
  const endDate = trialEndsAt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your free trial ends in ${daysLeft} day${daysLeft !== 1 ? "s" : ""} — keep your access to Mapping with Melanin™`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping with Melanin" style="height:40px;margin-bottom:32px" />

        <p style="color:#2B1507;font-size:16px;line-height:1.6;margin:0 0 8px">Hello ${name},</p>

        <h1 style="font-size:26px;color:#2B1507;font-weight:700;margin:0 0 16px;line-height:1.3">
          Your free trial ends in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}. ⏳
        </h1>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 24px">
          Your <strong>${planLabel}</strong> trial expires on <strong>${endDate}</strong>. To keep full access to everything you've been enjoying, continue your membership now.
        </p>

        <div style="background:#2B1507;border-radius:12px;padding:28px;margin-bottom:28px;text-align:center">
          <p style="color:#F5EBD8;font-size:14px;font-weight:700;margin:0 0 8px;letter-spacing:1px;text-transform:uppercase">Continue Your Membership</p>
          <p style="color:#CA922B;font-size:32px;font-weight:700;margin:0 0 4px">${renewalPrice}</p>
          <p style="color:#F5EBD8;opacity:0.5;font-size:13px;margin:0 0 20px">Cancel anytime — no long-term commitment</p>
          <a href="https://mappingwithmelanin.com/membership" style="display:inline-block;background:#CA922B;color:#fff;font-weight:700;font-size:16px;padding:14px 36px;border-radius:50px;text-decoration:none">
            Keep My Access →
          </a>
        </div>

        <p style="color:#2B1507;font-size:15px;font-weight:700;margin:0 0 12px">What you'll keep with a paid membership:</p>
        <ul style="color:#3A1F0E;font-size:15px;line-height:2;margin:0 0 24px;padding-left:20px">
          <li>Unlimited business listings & full profiles</li>
          <li>Complete neighborhood safety scores</li>
          <li>Submit reviews, reports & community content</li>
          <li>KinfolkAI travel planning</li>
          <li>Save businesses & build personal collections</li>
          <li>Priority customer support</li>
        </ul>

        <p style="color:#3A1F0E;font-size:14px;line-height:1.6;margin:0 0 24px;opacity:0.7">
          If you choose not to renew, your account will automatically move to our free Community plan on ${endDate}. You'll still have access to the directory — just without the Premium features.
        </p>

        <p style="color:#2B1507;font-size:16px;font-weight:700;font-style:italic;margin:0 0 4px">Map Your Life. Connect Deeper.™</p>
        <p style="color:#3A1F0E;font-size:15px;margin:0 0 4px">The Mapping with Melanin™ Team</p>
        <p style="color:#3A1F0E;font-size:13px;opacity:0.5;margin:0">Melanin Maps LLC · <a href="https://mappingwithmelanin.com/membership" style="color:#CA922B">Manage membership</a></p>
      </div>
    `,
  });
}

export async function sendTrialExpired(
  to: string,
  firstName: string | null,
  planType: string,
) {
  if (!resend) { log("trial expired"); return; }
  const name = firstName ?? "there";
  const planLabel = PLAN_LABELS[planType] ?? "Premium";
  const renewalPrice = PLAN_PRICES[planType] ?? "$9.99/month";

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your Mapping with Melanin™ trial has ended — here's how to continue`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping with Melanin" style="height:40px;margin-bottom:32px" />

        <p style="color:#2B1507;font-size:16px;line-height:1.6;margin:0 0 8px">Hello ${name},</p>

        <h1 style="font-size:26px;color:#2B1507;font-weight:700;margin:0 0 16px;line-height:1.3">
          Your free trial has ended.
        </h1>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 16px">
          Your <strong>${planLabel}</strong> trial period has come to a close. Your account has moved to our free Community plan — you still have access to the directory, but Premium features are no longer available.
        </p>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 28px">
          We hope you experienced the value of being connected to a community built around trust, culture, and shared discovery. We'd love to have you stay.
        </p>

        <div style="background:#2B1507;border-radius:12px;padding:28px;margin-bottom:28px;text-align:center">
          <p style="color:#F5EBD8;font-size:14px;font-weight:700;margin:0 0 8px;letter-spacing:1px;text-transform:uppercase">Reactivate Your ${planLabel} Membership</p>
          <p style="color:#CA922B;font-size:32px;font-weight:700;margin:0 0 4px">${renewalPrice}</p>
          <p style="color:#F5EBD8;opacity:0.6;font-size:14px;margin:0 0 20px">Cancel anytime. No long-term commitment.</p>
          <a href="https://mappingwithmelanin.com/membership" style="display:inline-block;background:#CA922B;color:#fff;font-weight:700;font-size:16px;padding:16px 40px;border-radius:50px;text-decoration:none">
            Reactivate My Membership →
          </a>
        </div>

        <p style="color:#2B1507;font-size:15px;font-weight:700;margin:0 0 12px">What you'll get back:</p>
        <ul style="color:#3A1F0E;font-size:15px;line-height:2;margin:0 0 28px;padding-left:20px">
          <li>Unlimited business listings & full profiles</li>
          <li>Complete neighborhood safety scores</li>
          <li>Submit reviews, reports & community content</li>
          <li>KinfolkAI travel planning assistance</li>
          <li>Save businesses & build personal collections</li>
          <li>Priority customer support</li>
        </ul>

        <p style="color:#3A1F0E;font-size:14px;line-height:1.6;margin:0 0 24px;opacity:0.7">
          Questions or feedback about your experience? We genuinely want to hear from you. Reply to this email or reach us at <a href="mailto:hello@mappingwithmelanin.com" style="color:#CA922B">hello@mappingwithmelanin.com</a>.
        </p>

        <p style="color:#2B1507;font-size:16px;font-weight:700;font-style:italic;margin:0 0 4px">Map Your Life. Connect Deeper.™</p>
        <p style="color:#3A1F0E;font-size:15px;margin:0 0 4px">The Mapping with Melanin™ Team</p>
        <p style="color:#3A1F0E;font-size:13px;opacity:0.5;margin:0">Melanin Maps LLC · <a href="https://mappingwithmelanin.com/membership" style="color:#CA922B">View plans</a></p>
      </div>
    `,
  });
}

export async function sendMembershipCancelled(
  to: string,
  firstName: string | null,
  planType: string,
) {
  if (!resend) { log("membership cancelled"); return; }
  const name = firstName ?? "there";
  const planLabel = PLAN_LABELS[planType] ?? "Premium";
  const renewalPrice = PLAN_PRICES[planType] ?? "$9.99/month";

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your Mapping with Melanin™ membership has been cancelled`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping with Melanin" style="height:40px;margin-bottom:32px" />

        <p style="color:#2B1507;font-size:16px;line-height:1.6;margin:0 0 8px">Hello ${name},</p>

        <h1 style="font-size:24px;color:#2B1507;font-weight:700;margin:0 0 16px;line-height:1.3">
          Your ${planLabel} membership has been cancelled.
        </h1>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 16px">
          We've processed your cancellation request. Your account has moved to our free Community plan — you'll keep access to the business directory, but Premium features are no longer available.
        </p>

        <p style="color:#3A1F0E;font-size:16px;line-height:1.6;margin:0 0 28px">
          We're sorry to see you go. If there's anything we could have done better, we genuinely want to hear it — reply to this email and a real person will read it.
        </p>

        <div style="background:#2B1507;border-radius:12px;padding:28px;margin-bottom:28px;text-align:center">
          <p style="color:#F5EBD8;font-size:14px;font-weight:700;margin:0 0 8px;letter-spacing:1px;text-transform:uppercase">Changed your mind? Come back anytime.</p>
          <p style="color:#CA922B;font-size:28px;font-weight:700;margin:0 0 4px">${renewalPrice}</p>
          <p style="color:#F5EBD8;opacity:0.6;font-size:14px;margin:0 0 20px">No long-term commitment. Cancel anytime.</p>
          <a href="https://mappingwithmelanin.com/membership" style="display:inline-block;background:#CA922B;color:#fff;font-weight:700;font-size:16px;padding:14px 36px;border-radius:50px;text-decoration:none">
            Reactivate Membership →
          </a>
        </div>

        <p style="color:#3A1F0E;font-size:14px;line-height:1.6;margin:0 0 24px;opacity:0.7">
          Your data is safe and your account remains active on the free plan. If you ever come back, everything will be right where you left it.
        </p>

        <p style="color:#2B1507;font-size:16px;font-weight:700;font-style:italic;margin:0 0 4px">Map Your Life. Connect Deeper.™</p>
        <p style="color:#3A1F0E;font-size:15px;margin:0 0 4px">The Mapping with Melanin™ Team</p>
        <p style="color:#3A1F0E;font-size:13px;opacity:0.5;margin:0">Melanin Maps LLC · <a href="mailto:hello@mappingwithmelanin.com" style="color:#CA922B">hello@mappingwithmelanin.com</a></p>
      </div>
    `,
  });
}

export async function sendWeeklyDigest(
  to: string,
  firstName: string | null,
  businesses: Array<{ name: string; category: string; city: string; state: string; id: string }>,
  weekLabel: string,
) {
  if (!resend) { log("weekly digest"); return; }
  const name = firstName ?? "there";

  const bizCards = businesses.slice(0, 6).map(b => `
    <a href="https://mappingwithmelanin.com/business/${b.id}" style="display:block;text-decoration:none;margin-bottom:16px">
      <div style="background:#fff;border-radius:12px;padding:16px 20px;border:1px solid rgba(43,21,7,0.08)">
        <p style="color:#2B1507;font-size:15px;font-weight:700;margin:0 0 4px">${b.name}</p>
        <p style="color:#CA922B;font-size:12px;font-weight:600;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.5px">${b.category}</p>
        <p style="color:#3A1F0E;font-size:13px;margin:0;opacity:0.6">${b.city}, ${b.state}</p>
      </div>
    </a>
  `).join("");

  const noBizMessage = `
    <p style="color:#3A1F0E;font-size:15px;line-height:1.6;margin:0 0 24px">
      No new businesses were added this week, but our community is growing. Explore the full directory and you might discover something you haven't seen yet.
    </p>
  `;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your weekly Black-owned business digest — ${weekLabel}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#FAF6EF;padding:40px 32px;border-radius:16px">
        <img src="https://mappingwithmelanin.com/images/brand/logo.png" alt="Mapping with Melanin" style="height:40px;margin-bottom:32px" />

        <p style="color:#2B1507;font-size:16px;line-height:1.6;margin:0 0 8px">Hey ${name} 👋🏾</p>

        <h1 style="font-size:26px;color:#2B1507;font-weight:700;margin:0 0 8px;line-height:1.3;font-style:italic">
          This Week in Black Excellence
        </h1>
        <p style="color:#3A1F0E;font-size:14px;margin:0 0 28px;opacity:0.6">${weekLabel}</p>

        <p style="color:#3A1F0E;font-size:15px;line-height:1.6;margin:0 0 20px">
          Here are the newest Black-owned businesses added to the Mapping with Melanin™ directory this week. Every discovery, share, and check-in helps our community grow stronger.
        </p>

        ${businesses.length > 0 ? bizCards : noBizMessage}

        <div style="text-align:center;margin:28px 0">
          <a href="https://mappingwithmelanin.com/discover" style="display:inline-block;background:#CA922B;color:#fff;font-weight:700;font-size:16px;padding:14px 36px;border-radius:50px;text-decoration:none">
            Explore the Full Directory →
          </a>
        </div>

        <div style="background:#2B1507;border-radius:12px;padding:24px;margin-bottom:28px;text-align:center">
          <p style="color:#F5EBD8;font-size:13px;font-weight:700;margin:0 0 6px;letter-spacing:1px;text-transform:uppercase">Know a Black-owned business?</p>
          <p style="color:#F5EBD8;font-size:14px;margin:0 0 16px;opacity:0.7">Help us grow the most comprehensive directory of Black-owned businesses in the country.</p>
          <a href="https://mappingwithmelanin.com/submit-business" style="display:inline-block;background:#CA922B;color:#fff;font-weight:700;font-size:14px;padding:10px 24px;border-radius:50px;text-decoration:none">
            Submit a Business
          </a>
        </div>

        <p style="color:#2B1507;font-size:16px;font-weight:700;font-style:italic;margin:0 0 4px">Map Your Life. Connect Deeper.™</p>
        <p style="color:#3A1F0E;font-size:15px;margin:0 0 4px">The Mapping with Melanin™ Team</p>
        <p style="color:#3A1F0E;font-size:13px;opacity:0.5;margin:0">Melanin Maps LLC · <a href="mailto:hello@mappingwithmelanin.com" style="color:#CA922B">hello@mappingwithmelanin.com</a> · <a href="https://mappingwithmelanin.com/unsubscribe" style="color:#CA922B">Unsubscribe</a></p>
      </div>
    `,
  });
}
