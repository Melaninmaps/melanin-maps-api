import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle, UserPlus, LogIn } from "lucide-react";
import { setWebToken } from "@/lib/webAuth";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";

const BASE = import.meta.env.BASE_URL;

/**
 * Validates a returnTo path so we never redirect to an external URL.
 * Accepts only paths that start with a single "/" and contain no "://" or "//".
 * Decodes the raw value first to catch encoded external redirects (%2F%2F, %3A, etc.).
 */
function safeReturnTo(raw: string | null): string {
  if (!raw) return "/";
  try {
    const decoded = decodeURIComponent(raw);
    if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.includes("://")) return "/";
  } catch {
    return "/";
  }
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) return "/";
  return raw;
}

type Tab = "signin" | "register";

interface ApiError { error?: string }

export default function Login() {
  const [tab, setTab] = useState<Tab>("signin");
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { data: authData, isLoading: authLoading } = useGetCurrentAuthUser();

  // If the user is already authenticated, skip the login screen entirely and
  // go straight to their intended destination (or home).  This handles the case
  // where an admin manually visits /login?returnTo=/admin while already signed in.
  useEffect(() => {
    if (!authLoading && authData?.user) {
      const params = new URLSearchParams(window.location.search);
      navigate(safeReturnTo(params.get("returnTo")), { replace: true });
    }
  }, [authLoading, authData?.user, navigate]);

  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");
  const [signinShowPw, setSigninShowPw] = useState(false);
  const [signinLoading, setSigninLoading] = useState(false);
  const [signinError, setSigninError] = useState("");

  const [regFirst, setRegFirst] = useState("");
  const [regLast, setRegLast] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regShowPw, setRegShowPw] = useState(false);
  const [regDob, setRegDob] = useState("");
  const [regTerms, setRegTerms] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");

  async function afterAuth(token: string) {
    setWebToken(token);
    await queryClient.invalidateQueries();
    const params = new URLSearchParams(window.location.search);
    navigate(safeReturnTo(params.get("returnTo")));
  }

  async function handleSignin(e: React.FormEvent) {
    e.preventDefault();
    setSigninError("");
    if (!signinEmail.trim() || !signinPassword) {
      setSigninError("Email and password are required.");
      return;
    }
    setSigninLoading(true);
    try {
      const res = await fetch("/api/auth/login-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: signinEmail.trim(), password: signinPassword }),
      });
      const data = await res.json() as { token?: string } & ApiError;
      if (!res.ok || !data.token) {
        setSigninError(data.error ?? "Sign-in failed. Please try again.");
        return;
      }
      await afterAuth(data.token);
    } catch {
      setSigninError("Could not connect. Please check your connection and try again.");
    } finally {
      setSigninLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegError("");
    // Note: duplicate-account warning is shown in the tab UI below
    if (!regFirst.trim() || !regLast.trim() || !regEmail.trim() || !regUsername.trim() || !regPassword) {
      setRegError("All fields except date of birth are required.");
      return;
    }
    if (!regTerms) {
      setRegError("You must agree to the Terms of Service to create an account.");
      return;
    }
    setRegLoading(true);
    try {
      const body: Record<string, unknown> = {
        firstName: regFirst.trim(),
        lastName: regLast.trim(),
        email: regEmail.trim(),
        username: regUsername.trim(),
        password: regPassword,
        agreeToTerms: true,
      };
      if (regDob) body.dateOfBirth = regDob;

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { token?: string } & ApiError;
      if (!res.ok || !data.token) {
        setRegError(data.error ?? "Registration failed. Please try again.");
        return;
      }
      await afterAuth(data.token);
    } catch {
      setRegError("Could not connect. Please check your connection and try again.");
    } finally {
      setRegLoading(false);
    }
  }

  const inputClass =
    "w-full border border-[#2B1507]/15 rounded-xl px-4 py-3 text-sm text-[#3A1F0E] placeholder-[#3A1F0E]/30 focus:outline-none focus:border-[#CA922B] bg-white";

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6EF]">
      <header className="w-full bg-[#2B1507] text-[#F5EBD8] h-16 flex items-center px-6 shrink-0">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="w-9 h-9 rounded-full bg-[#FAF6EF] border-2 border-[#CA922B] overflow-hidden">
              <img src={`${BASE}images/logo-transparent.png`} alt="logo" className="w-full h-full object-cover object-top scale-110" />
            </div>
            <span className="font-serif font-bold text-lg text-white">Mapping with Melanin™</span>
          </div>
        </Link>
        <Link href="/" className="ml-auto">
          <button className="inline-flex items-center gap-1.5 text-sm text-[#F5EBD8]/70 hover:text-[#CA922B] transition-colors">
            <ArrowLeft size={16} />
            Back to site
          </button>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#2B1507]/5" style={{ backgroundImage: "radial-gradient(circle at center, #CA922B 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

        <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_20px_60px_rgba(43,21,7,0.08)] border border-[#2B1507]/5 overflow-hidden relative z-10">
          <div className="bg-[#2B1507] px-10 py-8 text-center">
            <h1 className="text-3xl font-serif font-bold text-white mb-1">
              {tab === "signin" ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-[#F5EBD8]/60 text-sm font-light">
              {tab === "signin" ? "Sign in to your account." : "Join Mapping with Melanin™."}
            </p>
          </div>

          <div className="flex border-b border-[#2B1507]/10">
            <button
              onClick={() => { setTab("signin"); setSigninError(""); }}
              className={`flex-1 py-3.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${tab === "signin" ? "text-[#CA922B] border-b-2 border-[#CA922B]" : "text-[#3A1F0E]/50 hover:text-[#3A1F0E]/80"}`}
            >
              <LogIn size={15} /> Sign In
            </button>
            <button
              onClick={() => { setTab("register"); setRegError(""); }}
              className={`flex-1 py-3.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${tab === "register" ? "text-[#CA922B] border-b-2 border-[#CA922B]" : "text-[#3A1F0E]/50 hover:text-[#3A1F0E]/80"}`}
            >
              <UserPlus size={15} /> Create Account
            </button>
          </div>

          <div className="px-8 py-7">
            {tab === "signin" ? (
              /* ── Sign In Tab ──────────────────────────────────────────────── */
              <>
                {/* Apple account guidance */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 flex items-start gap-2.5">
                  <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800 leading-relaxed">
                    <p className="font-semibold mb-0.5">Signed up with Apple?</p>
                    <p>
                      If you created your account using <strong>Sign in with Apple</strong> on iPhone or iPad, use{" "}
                      <button type="button" onClick={() => { setTab("register"); }} className="underline font-medium">Forgot password?</button>{" "}
                      below to set a password, then sign in here. This connects you to your existing account — no new account is created.
                    </p>
                  </div>
                </div>
              <form onSubmit={handleSignin} className="space-y-4" noValidate>
                <div>
                  <label className="block text-xs font-bold text-[#3A1F0E]/40 uppercase tracking-wider mb-1.5">Email</label>
                  <input
                    type="email"
                    value={signinEmail}
                    onChange={(e) => setSigninEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={inputClass}
                    autoComplete="email"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-[#3A1F0E]/40 uppercase tracking-wider">Password</label>
                    <Link href="/forgot-password">
                      <span className="text-xs text-[#CA922B] hover:underline cursor-pointer">Forgot password?</span>
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={signinShowPw ? "text" : "password"}
                      value={signinPassword}
                      onChange={(e) => setSigninPassword(e.target.value)}
                      placeholder="Your password"
                      className={`${inputClass} pr-11`}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setSigninShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3A1F0E]/30 hover:text-[#3A1F0E]/60"
                    >
                      {signinShowPw ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {signinError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
                    <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-red-700 text-sm">{signinError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={signinLoading}
                  className="w-full h-12 bg-[#CA922B] hover:bg-[#B38024] text-white font-bold rounded-full text-sm shadow-[0_4px_14px_rgba(202,146,43,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors mt-2"
                >
                  {signinLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn size={16} />
                      Sign In
                    </>
                  )}
                </button>

                <p className="text-xs text-center text-[#3A1F0E]/35 pt-1">
                  Don't have an account?{" "}
                  <button type="button" onClick={() => setTab("register")} className="text-[#CA922B] hover:underline font-medium">
                    Create one
                  </button>
                </p>
              </form>
              </>
            ) : (
              /* ── Create Account Tab ───────────────────────────────────────── */
              <>
                {/* Existing account warning — prevent accidental duplicates */}
                <div className="bg-[#CA922B]/8 border border-[#CA922B]/25 rounded-xl px-4 py-3.5 mb-5">
                  <p className="text-xs font-bold text-[#2B1507] mb-1">Already have a Mapping With Melanin account?</p>
                  <p className="text-xs text-[#3A1F0E]/70 leading-relaxed">
                    Sign in to your existing account so your profile, saves, and activity stay connected.{" "}
                    <button
                      type="button"
                      onClick={() => setTab("signin")}
                      className="text-[#CA922B] font-semibold underline"
                    >
                      Sign In instead →
                    </button>
                  </p>
                  <p className="text-xs text-[#3A1F0E]/55 mt-2 leading-relaxed">
                    If you signed up using <strong>Sign in with Apple</strong>, use{" "}
                    <Link href="/forgot-password">
                      <span className="text-[#CA922B] underline cursor-pointer">Forgot Password</span>
                    </Link>{" "}
                    on the Sign In tab to set a password for your existing account.
                    Creating a new account here will not connect to your Apple account.
                  </p>
                </div>
              <form onSubmit={handleRegister} className="space-y-3.5" noValidate>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#3A1F0E]/40 uppercase tracking-wider mb-1.5">First Name</label>
                    <input type="text" value={regFirst} onChange={(e) => setRegFirst(e.target.value)} placeholder="First" className={inputClass} autoComplete="given-name" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#3A1F0E]/40 uppercase tracking-wider mb-1.5">Last Name</label>
                    <input type="text" value={regLast} onChange={(e) => setRegLast(e.target.value)} placeholder="Last" className={inputClass} autoComplete="family-name" required />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3A1F0E]/40 uppercase tracking-wider mb-1.5">Email</label>
                  <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="you@example.com" className={inputClass} autoComplete="email" required />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3A1F0E]/40 uppercase tracking-wider mb-1.5">Username</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3A1F0E]/30 text-sm font-medium">@</span>
                    <input
                      type="text"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                      placeholder="yourhandle"
                      className={`${inputClass} pl-8`}
                      autoComplete="username"
                      maxLength={30}
                      required
                    />
                  </div>
                  <p className="text-xs text-[#3A1F0E]/35 mt-1">Letters, numbers, and underscores only.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3A1F0E]/40 uppercase tracking-wider mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={regShowPw ? "text" : "password"}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className={`${inputClass} pr-11`}
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                    <button type="button" onClick={() => setRegShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3A1F0E]/30 hover:text-[#3A1F0E]/60">
                      {regShowPw ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {regPassword.length > 0 && regPassword.length < 8 && (
                    <p className="text-xs text-[#3A1F0E]/40 mt-1">Must be at least 8 characters.</p>
                  )}
                  {regPassword.length >= 8 && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle size={11} /> Looks good</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3A1F0E]/40 uppercase tracking-wider mb-1.5">Date of Birth <span className="font-normal normal-case">(optional)</span></label>
                  <input type="date" value={regDob} onChange={(e) => setRegDob(e.target.value)} className={inputClass} autoComplete="bday" />
                </div>

                <label className="flex items-start gap-3 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={regTerms}
                    onChange={(e) => setRegTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-[#CA922B] shrink-0"
                  />
                  <span className="text-xs text-[#3A1F0E]/60 leading-relaxed">
                    I agree to the{" "}
                    <Link href="/terms"><span className="text-[#CA922B] hover:underline">Terms of Service</span></Link>
                    {" "}and{" "}
                    <Link href="/privacy-policy"><span className="text-[#CA922B] hover:underline">Privacy Policy</span></Link>.
                  </span>
                </label>

                {regError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
                    <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-red-700 text-sm">{regError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full h-12 bg-[#CA922B] hover:bg-[#B38024] text-white font-bold rounded-full text-sm shadow-[0_4px_14px_rgba(202,146,43,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors mt-1"
                >
                  {regLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus size={16} />
                      Create Account
                    </>
                  )}
                </button>

                <p className="text-xs text-center text-[#3A1F0E]/35">
                  Already have an account?{" "}
                  <button type="button" onClick={() => setTab("signin")} className="text-[#CA922B] hover:underline font-medium">
                    Sign in
                  </button>
                </p>
              </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
