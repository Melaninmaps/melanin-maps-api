import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, LockKeyhole, UserPlus } from "lucide-react";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { setWebToken } from "@/lib/webAuth";

interface ApiError {
  error?: string;
}

function safeReturnTo(raw: string | null): string {
  if (!raw) return "/profile";
  try {
    const decoded = decodeURIComponent(raw);
    if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.includes("://")) return "/profile";
  } catch {
    return "/profile";
  }
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) return "/profile";
  return raw;
}

function validateDateOfBirth(value: string): string | null {
  if (!value) return "Date of birth is required to create an account.";

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return "Please enter a valid date of birth.";

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const dob = new Date(Date.UTC(year, month - 1, day));
  const now = new Date();

  if (
    year < 1900 ||
    month < 1 || month > 12 ||
    day < 1 || day > 31 ||
    dob.getUTCFullYear() !== year ||
    dob.getUTCMonth() !== month - 1 ||
    dob.getUTCDate() !== day ||
    dob > now
  ) {
    return "Please enter a valid date of birth.";
  }

  const thisYear = now.getUTCFullYear();
  const thisMonth = now.getUTCMonth();
  const thisDay = now.getUTCDate();
  let age = thisYear - year;
  if (thisMonth < month - 1 || (thisMonth === month - 1 && thisDay < day)) age--;

  if (age > 120) return "Please enter a valid date of birth.";
  if (age < 13) return "You must be at least 13 years old to use this platform.";
  return null;
}

export default function Signup() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { data: authData, isLoading: authLoading } = useGetCurrentAuthUser();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activationToken] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("invite")?.trim() ?? "";
  });

  useEffect(() => {
    if (!activationToken) return;
    // Keep the one-time capability out of browser history after it is captured
    // for the in-memory registration request.
    const params = new URLSearchParams(window.location.search);
    params.delete("invite");
    const query = params.toString();
    window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  }, [activationToken]);

  useEffect(() => {
    if (!authLoading && authData?.user) {
      const params = new URLSearchParams(window.location.search);
      navigate(safeReturnTo(params.get("returnTo")), { replace: true });
    }
  }, [authData?.user, authLoading, navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const cleanUsername = username.trim().toLowerCase();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !cleanUsername || !password) {
      setError("First name, last name, email, username, and password are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!/^[a-z0-9_]{3,30}$/.test(cleanUsername)) {
      setError("Username must be 3–30 characters: letters, numbers, and underscores only.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    const dateOfBirthError = validateDateOfBirth(dateOfBirth);
    if (dateOfBirthError) {
      setError(dateOfBirthError);
      return;
    }
    if (!agreeToTerms) {
      setError("You must agree to the Terms of Service to create an account.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          username: cleanUsername,
          password,
          dateOfBirth,
          agreeToTerms,
          activationToken: activationToken || undefined,
        }),
      });
      const data = await response.json() as { token?: string } & ApiError;

      if (!response.ok || !data.token) {
        setError(data.error ?? "Registration failed. Please try again.");
        return;
      }

      // The registration contract returns the server-created session ID. Keep the
      // existing web token/cookie bridge so all authenticated browser requests work.
      setWebToken(data.token);
      await queryClient.invalidateQueries();
      const params = new URLSearchParams(window.location.search);
      navigate(safeReturnTo(params.get("returnTo")), { replace: true });
    } catch {
      setError("Could not connect. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full border border-[#2B1507]/15 rounded-xl px-4 py-3 text-sm text-[#3A1F0E] placeholder-[#3A1F0E]/35 focus:outline-none focus:border-[#CA922B] focus:ring-2 focus:ring-[#CA922B]/15 bg-white";

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6EF]">
      <header className="w-full bg-[#2B1507] text-[#F5EBD8] h-16 flex items-center px-6 shrink-0">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#FAF6EF] border-2 border-[#CA922B] overflow-hidden">
            <img src="/images/logo-transparent.png" alt="Mapping with Melanin" className="w-full h-full object-cover object-top scale-110" />
          </div>
          <span className="font-serif font-bold text-lg text-white">Mapping with Melanin™</span>
        </Link>
        <Link href="/" className="ml-auto inline-flex items-center gap-1.5 text-sm text-[#F5EBD8]/70 hover:text-[#CA922B] transition-colors">
          <ArrowLeft size={16} />
          Back to site
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl shadow-[#2B1507]/10 border border-[#2B1507]/5 overflow-hidden">
          <div className="bg-[#2B1507] px-7 py-8 text-center sm:px-10">
            <div className="w-12 h-12 rounded-full bg-[#CA922B] flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-serif text-3xl font-bold text-white">Create your account</h1>
            <p className="mt-2 text-sm leading-6 text-[#F5EBD8]/75">
              Approved members and pre-approved testers can finish registration here.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="px-6 py-7 space-y-5 sm:px-10 sm:py-8">
            <div className="rounded-xl border border-[#CA922B]/25 bg-[#FFF8E8] px-4 py-3 text-sm text-[#5C3A12] leading-5">
              <span className="font-semibold">Invite-only access:</span> {activationToken ? "your secure activation link will be verified when you submit." : "eligibility is verified securely when you submit."} If you have not been approved yet, please join the waitlist.
            </div>

            {error && (
              <div role="alert" className="flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <p className="leading-5">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="mb-1.5 block text-sm font-semibold text-[#3A1F0E]">First name</label>
                <input id="firstName" autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} className={inputClass} placeholder="Teianna" />
              </div>
              <div>
                <label htmlFor="lastName" className="mb-1.5 block text-sm font-semibold text-[#3A1F0E]">Last name</label>
                <input id="lastName" autoComplete="family-name" value={lastName} onChange={(event) => setLastName(event.target.value)} className={inputClass} placeholder="Smith" />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-[#3A1F0E]">Email address</label>
              <input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} placeholder="you@example.com" />
            </div>

            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-semibold text-[#3A1F0E]">Username</label>
              <input id="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} className={inputClass} placeholder="yourhandle" maxLength={30} />
              <p className="mt-1.5 text-xs leading-5 text-[#3A1F0E]/55">Letters, numbers, and underscores only. Your handle is visible to other members.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-[#3A1F0E]">Password</label>
                <div className="relative">
                  <input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className={`${inputClass} pr-11`} placeholder="8+ characters" />
                  <button type="button" onClick={() => setShowPassword((shown) => !shown)} className="absolute inset-y-0 right-0 px-3 text-[#3A1F0E]/50 hover:text-[#CA922B]" aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-semibold text-[#3A1F0E]">Confirm password</label>
                <input id="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={inputClass} placeholder="Repeat password" />
              </div>
            </div>

            <div>
              <label htmlFor="dateOfBirth" className="mb-1.5 block text-sm font-semibold text-[#3A1F0E]">Date of birth</label>
              <input id="dateOfBirth" type="date" autoComplete="bday" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} className={inputClass} aria-describedby="dateOfBirthHint" />
              <p id="dateOfBirthHint" className="mt-1.5 text-xs leading-5 text-[#3A1F0E]/55">Required to confirm that you are at least 13. It is kept private and is never shown publicly.</p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-[#2B1507]/10 px-4 py-3 hover:border-[#CA922B]/50 transition-colors">
              <input type="checkbox" checked={agreeToTerms} onChange={(event) => setAgreeToTerms(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-[#2B1507]/30 text-[#CA922B] focus:ring-[#CA922B]" />
              <span className="text-sm leading-5 text-[#3A1F0E]">
                I agree to the <Link href="/terms" className="font-semibold text-[#9B6A14] hover:underline">Terms of Service</Link> and <Link href="/privacy-policy" className="font-semibold text-[#9B6A14] hover:underline">Privacy Policy</Link>.
              </span>
            </label>

            <button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#CA922B] px-4 py-3.5 font-semibold text-white shadow-sm hover:bg-[#B7831F] focus:outline-none focus:ring-2 focus:ring-[#CA922B] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 transition-colors">
              {loading ? "Creating account…" : <><CheckCircle2 size={19} /> Create account</>}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-sm text-[#3A1F0E]/65">
              <LockKeyhole size={14} aria-hidden="true" />
              <span>Already have an account?</span>
              <Link href="/login" className="font-semibold text-[#9B6A14] hover:underline">Sign in</Link>
            </div>
            <p className="text-center text-sm text-[#3A1F0E]/60">
              Not approved yet? <Link href="/waitlist" className="font-semibold text-[#9B6A14] hover:underline">Join the waitlist</Link>.
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
