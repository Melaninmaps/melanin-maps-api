import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, KeyRound, Eye, EyeOff, CheckCircle, AlertCircle, Smartphone } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

function getQueryParam(name: string): string {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) ?? "";
}

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [missingParams, setMissingParams] = useState(false);

  useEffect(() => {
    const e = getQueryParam("email");
    const c = getQueryParam("code");
    setEmail(e);
    setCode(c);
    if (!e || !c) setMissingParams(true);
  }, []);

  const valid = newPw.length >= 8 && newPw === confirmPw;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPw.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (newPw !== confirmPw) { setError("Passwords don't match."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword: newPw }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setError(data.error ?? "Reset failed. The link may have expired — please request a new one from the app.");
        return;
      }
      setDone(true);
    } catch {
      setError("Could not connect. Please check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const appDeepLink = `mappingwithmelanin://reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6EF]">
      {/* Header */}
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

      {/* Body */}
      <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-[#2B1507]/5"
          style={{ backgroundImage: "radial-gradient(circle at center, #CA922B 1px, transparent 1px)", backgroundSize: "24px 24px" }}
        />

        <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_20px_60px_rgba(43,21,7,0.08)] border border-[#2B1507]/5 overflow-hidden relative z-10">
          {/* Card header band */}
          <div className="bg-[#2B1507] px-10 py-8 text-center">
            <div className="mx-auto w-16 h-16 bg-white/10 border border-white/20 flex items-center justify-center rounded-2xl mb-5 text-[#CA922B]">
              <KeyRound size={32} />
            </div>
            <h1 className="text-3xl font-serif font-bold text-white mb-2">
              {done ? "Password Updated" : "Set New Password"}
            </h1>
            <p className="text-[#F5EBD8]/60 text-sm font-light">
              {done
                ? "You can now sign in with your new password."
                : missingParams
                ? "This link is missing required information."
                : "Choose a strong password for your account."}
            </p>
          </div>

          <div className="px-10 py-8">
            {/* ── Success state ── */}
            {done ? (
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <CheckCircle size={56} className="text-green-500" />
                </div>
                <p className="text-[#3A1F0E]/70 text-sm leading-relaxed">
                  Your password has been updated. Open the app and sign in with your new password.
                </p>
                <a
                  href={appDeepLink}
                  className="flex items-center justify-center gap-2 w-full bg-[#CA922B] text-white font-bold py-4 rounded-2xl hover:bg-[#B87E25] transition-colors"
                >
                  <Smartphone size={18} />
                  Open the App
                </a>
                <Link href="/login">
                  <button className="w-full border border-[#2B1507]/15 text-[#3A1F0E]/60 font-medium py-3 rounded-2xl hover:bg-[#FAF6EF] transition-colors text-sm">
                    Sign in on Web
                  </button>
                </Link>
              </div>
            ) : missingParams ? (
              /* ── Missing params state ── */
              <div className="text-center space-y-5">
                <div className="flex justify-center">
                  <AlertCircle size={48} className="text-red-500" />
                </div>
                <p className="text-[#3A1F0E]/70 text-sm leading-relaxed">
                  This link is missing required information. Please open the Mapping With Melanin app, go to <strong>Forgot Password</strong>, and request a new reset code.
                </p>
                <a
                  href="mappingwithmelanin://forgot-password"
                  className="flex items-center justify-center gap-2 w-full bg-[#CA922B] text-white font-bold py-4 rounded-2xl hover:bg-[#B87E25] transition-colors"
                >
                  <Smartphone size={18} />
                  Open the App
                </a>
              </div>
            ) : (
              /* ── Main reset form ── */
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email read-only */}
                <div>
                  <label className="block text-xs font-bold text-[#3A1F0E]/40 uppercase tracking-wider mb-2">
                    Account email
                  </label>
                  <div className="bg-[#FAF6EF] border border-[#2B1507]/10 rounded-xl px-4 py-3 text-sm text-[#3A1F0E]/60 font-medium">
                    {email}
                  </div>
                </div>

                {/* New password */}
                <div>
                  <label className="block text-xs font-bold text-[#3A1F0E]/40 uppercase tracking-wider mb-2">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full border border-[#2B1507]/15 rounded-xl px-4 py-3 text-sm text-[#3A1F0E] placeholder-[#3A1F0E]/30 focus:outline-none focus:border-[#CA922B] pr-12 bg-white"
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3A1F0E]/30 hover:text-[#3A1F0E]/60"
                    >
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-xs font-bold text-[#3A1F0E]/40 uppercase tracking-wider mb-2">
                    Confirm password
                  </label>
                  <input
                    type={showPw ? "text" : "password"}
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full border border-[#2B1507]/15 rounded-xl px-4 py-3 text-sm text-[#3A1F0E] placeholder-[#3A1F0E]/30 focus:outline-none focus:border-[#CA922B] bg-white"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  {confirmPw && newPw !== confirmPw && (
                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                      <AlertCircle size={12} /> Passwords don't match
                    </p>
                  )}
                  {confirmPw && newPw === confirmPw && newPw.length >= 8 && (
                    <p className="text-green-600 text-xs mt-1.5 flex items-center gap-1">
                      <CheckCircle size={12} /> Looks good
                    </p>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
                    <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!valid || loading}
                  className="w-full bg-[#CA922B] text-white font-bold py-4 rounded-2xl hover:bg-[#B87E25] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <KeyRound size={18} />
                      Set New Password
                    </>
                  )}
                </button>

                {/* Open in app instead */}
                <div className="pt-2 border-t border-[#2B1507]/8">
                  <p className="text-xs text-center text-[#3A1F0E]/40 mb-3">Have the app installed?</p>
                  <a
                    href={appDeepLink}
                    className="flex items-center justify-center gap-2 w-full border border-[#CA922B]/40 text-[#CA922B] font-semibold py-3 rounded-2xl hover:bg-[#CA922B]/5 transition-colors text-sm"
                  >
                    <Smartphone size={16} />
                    Reset in the app instead
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
