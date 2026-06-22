import { Button } from "@/components/ui/button";
import { Mail, ArrowLeft, Zap } from "lucide-react";
import { Link } from "wouter";

const BASE = import.meta.env.BASE_URL;

export default function Login() {
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
        <div className="absolute inset-0 bg-[#2B1507]/5" style={{ backgroundImage: 'radial-gradient(circle at center, #CA922B 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_20px_60px_rgba(43,21,7,0.08)] border border-[#2B1507]/5 overflow-hidden relative z-10">
          {/* Header band */}
          <div className="bg-[#2B1507] px-10 py-8 text-center">
            <div className="mx-auto w-16 h-16 bg-white/10 border border-white/20 flex items-center justify-center rounded-2xl mb-5 text-[#CA922B]">
              <Mail size={32} />
            </div>
            <h1 className="text-3xl font-serif font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-[#F5EBD8]/60 text-sm font-light">No password needed — we'll email you a sign-in link.</p>
          </div>

          <div className="px-10 py-8">
            {/* How it works */}
            <div className="bg-[#FAF6EF] rounded-2xl p-5 mb-8 space-y-3">
              <p className="text-xs font-bold text-[#3A1F0E]/40 uppercase tracking-wider mb-3">How it works</p>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#CA922B] text-white flex items-center justify-center shrink-0 text-xs font-bold">1</div>
                <p className="text-sm text-[#3A1F0E]/70">Enter your email address on the next screen.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#CA922B] text-white flex items-center justify-center shrink-0 text-xs font-bold">2</div>
                <p className="text-sm text-[#3A1F0E]/70">We'll send a 6-digit code to that address instantly.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#CA922B] text-white flex items-center justify-center shrink-0 text-xs font-bold">3</div>
                <p className="text-sm text-[#3A1F0E]/70">Enter the code and you're in — no password ever required.</p>
              </div>
            </div>

            {/* Why no password callout */}
            <div className="flex items-start gap-3 bg-[#CA922B]/8 border border-[#CA922B]/20 rounded-xl px-4 py-3 mb-8">
              <Zap size={16} className="text-[#CA922B] shrink-0 mt-0.5" />
              <p className="text-xs text-[#3A1F0E]/60 leading-relaxed">
                <strong className="text-[#3A1F0E]/80">Why no password?</strong> Email codes are faster, more secure, and mean you'll never get locked out.
              </p>
            </div>

            <a href="/api/login" className="block w-full">
              <Button className="w-full h-14 text-base rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white font-bold shadow-[0_4px_14px_rgba(202,146,43,0.35)]">
                Continue with Email →
              </Button>
            </a>

            <p className="text-xs text-center text-[#3A1F0E]/35 mt-6 font-light">
              By signing in, you agree to our{" "}
              <Link href="/terms"><span className="underline cursor-pointer">Terms of Service</span></Link>
              {" "}and{" "}
              <Link href="/privacy-policy"><span className="underline cursor-pointer">Privacy Policy</span></Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
