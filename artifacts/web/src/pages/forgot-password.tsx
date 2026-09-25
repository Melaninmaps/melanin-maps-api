import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, KeyRound, Mail, Phone, AlertCircle, CheckCircle } from "lucide-react";

const BASE = import.meta.env.BASE_URL;
const RESET_CONTEXT_KEY = "mwm_password_reset_context_v1";

type Step = "email" | "code" | "done";
type RecoveryMethod = "email" | "phone";

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>("email");
  const [method, setMethod] = useState<RecoveryMethod>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [, navigate] = useLocation();

  const inputClass =
    "w-full border border-[#2B1507]/15 rounded-xl px-4 py-3 text-sm text-[#3A1F0E] placeholder-[#3A1F0E]/30 focus:outline-none focus:border-[#CA922B] bg-white";

  async function handleRecoveryRequest(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (method === "email" && !email.trim()) { setError("Email is required."); return; }
    if (method === "phone" && !phone.trim()) { setError("Phone number is required."); return; }
    setLoading(true);
    try {
      const res = await fetch(
        method === "email" ? "/api/auth/forgot-password" : "/api/auth/phone/forgot-password/send",
        {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(method === "email" ? { email: email.trim() } : { phone: phone.trim() }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setStep("code");
    } catch {
      setError("Could not connect. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmed = code.trim();
    if (!trimmed || trimmed.length !== 6 || !/^\d{6}$/.test(trimmed)) {
      setError(`Please enter the 6-digit code from your ${method === "email" ? "email" : "phone"}.`);
      return;
    }
    // A one-time reset code is a credential. Keep it in browser-session memory
    // rather than in a URL where it can be copied into history, referrer logs,
    // analytics, screenshots, or a shared link.
    try {
      sessionStorage.setItem(
        RESET_CONTEXT_KEY,
        JSON.stringify({
          method,
          email: method === "email" ? email.trim() : "",
          phone: method === "phone" ? phone.trim() : "",
          code: trimmed,
        }),
      );
      navigate("/reset-password");
    } catch {
      setError("Could not securely continue the reset. Please try again in a regular browser window.");
    }
  }

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
        <Link href="/login" className="ml-auto">
          <button className="inline-flex items-center gap-1.5 text-sm text-[#F5EBD8]/70 hover:text-[#CA922B] transition-colors">
            <ArrowLeft size={16} />
            Back to Sign In
          </button>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#2B1507]/5" style={{ backgroundImage: "radial-gradient(circle at center, #CA922B 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

        <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_20px_60px_rgba(43,21,7,0.08)] border border-[#2B1507]/5 overflow-hidden relative z-10">
          <div className="bg-[#2B1507] px-10 py-8 text-center">
            <div className="mx-auto w-16 h-16 bg-white/10 border border-white/20 flex items-center justify-center rounded-2xl mb-5 text-[#CA922B]">
              <KeyRound size={32} />
            </div>
            <h1 className="text-3xl font-serif font-bold text-white mb-2">
              {step === "email" ? "Forgot Password?" : step === "code" ? `Check Your ${method === "email" ? "Email" : "Phone"}` : "All Set"}
            </h1>
            <p className="text-[#F5EBD8]/60 text-sm font-light">
              {step === "email"
                ? "Choose email or a verified phone number and we'll send a reset code."
                : step === "code"
                ? `We sent a 6-digit code to ${method === "email" ? email : phone}`
                : "Your password has been reset."}
            </p>
          </div>

          <div className="px-10 py-8">
            {step === "email" && (
              <form onSubmit={handleRecoveryRequest} className="space-y-5" noValidate>
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#FAF6EF] p-1">
                  <button type="button" onClick={() => { setMethod("email"); setError(""); }} className={`rounded-lg px-3 py-2 text-sm font-bold ${method === "email" ? "bg-white text-[#2B1507] shadow-sm" : "text-[#3A1F0E]/50"}`}>
                    <Mail size={14} className="mr-1 inline" /> Email
                  </button>
                  <button type="button" onClick={() => { setMethod("phone"); setError(""); }} className={`rounded-lg px-3 py-2 text-sm font-bold ${method === "phone" ? "bg-white text-[#2B1507] shadow-sm" : "text-[#3A1F0E]/50"}`}>
                    <Phone size={14} className="mr-1 inline" /> Verified phone
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#3A1F0E]/40 uppercase tracking-wider mb-1.5">{method === "email" ? "Email Address" : "Verified Phone Number"}</label>
                  <div className="relative">
                    {method === "email" ? <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3A1F0E]/30" /> : <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3A1F0E]/30" />}
                    <input
                      type={method === "email" ? "email" : "tel"}
                      value={method === "email" ? email : phone}
                      onChange={(e) => method === "email" ? setEmail(e.target.value) : setPhone(e.target.value)}
                      placeholder={method === "email" ? "you@example.com" : "+1 202 555 0123"}
                      className={`${inputClass} pl-10`}
                      autoComplete={method === "email" ? "email" : "tel"}
                      required
                    />
                  </div>
                  {method === "phone" && <p className="mt-2 text-xs text-[#3A1F0E]/45">Use a number already verified on this account, including country code.</p>}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
                    <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-[#CA922B] hover:bg-[#B38024] text-white font-bold rounded-full text-sm shadow-[0_4px_14px_rgba(202,146,43,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Send Reset Code"
                  )}
                </button>

                <p className="text-xs text-center text-[#3A1F0E]/35">
                  Remembered it?{" "}
                  <Link href="/login"><span className="text-[#CA922B] hover:underline cursor-pointer">Sign in</span></Link>
                </p>
              </form>
            )}

            {step === "code" && (
              <form onSubmit={handleCodeSubmit} className="space-y-5" noValidate>
                <div className="bg-[#FAF6EF] rounded-2xl p-4 flex items-start gap-3">
                  <CheckCircle size={18} className="text-green-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-[#3A1F0E]/70 leading-relaxed">
                    A 6-digit code was sent to <strong>{method === "email" ? email : phone}</strong>. {method === "email" ? "Check your inbox (and spam folder)" : "Check your text messages"} and enter the code below.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3A1F0E]/40 uppercase tracking-wider mb-1.5">6-Digit Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    className={`${inputClass} text-center text-2xl tracking-[0.4em] font-bold`}
                    maxLength={6}
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
                    <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={code.length !== 6}
                  className="w-full h-12 bg-[#CA922B] hover:bg-[#B38024] text-white font-bold rounded-full text-sm shadow-[0_4px_14px_rgba(202,146,43,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                >
                  Continue to Set Password
                </button>

                <button
                  type="button"
                  onClick={() => { setCode(""); setError(""); setStep("email"); }}
                  className="w-full text-xs text-[#3A1F0E]/40 hover:text-[#3A1F0E]/70 transition-colors"
                >
                  Try a different email or phone number
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
