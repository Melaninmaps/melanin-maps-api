import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { Link } from "wouter";

export default function Signup() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF6EF] p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[#2B1507]/5" style={{ backgroundImage: 'radial-gradient(circle at center, #CA922B 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_20px_60px_rgba(43,21,7,0.08)] border border-[#2B1507]/5 p-10 relative z-10 text-center">
        <div className="mx-auto w-20 h-20 bg-[#FAF6EF] border border-[#CA922B]/20 flex items-center justify-center rounded-full mb-8 text-[#CA922B]">
          <Users size={40} />
        </div>

        <h1 className="text-4xl font-serif font-bold text-[#3A1F0E] mb-4">Join the Community</h1>
        <p className="text-[#3A1F0E]/60 text-base leading-relaxed mb-10 font-light">
          Create your free account to discover trusted businesses, contribute safety insights, and connect with a global community.
        </p>

        <a href="/api/login" className="block w-full">
          <Button className="w-full h-14 text-lg rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white shadow-lg">
            Sign Up with Replit
          </Button>
        </a>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-[#3A1F0E]/10" />
          <span className="text-xs text-[#3A1F0E]/40 uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-[#3A1F0E]/10" />
        </div>

        <p className="mt-6 text-sm text-[#3A1F0E]/60">
          Already have an account?{" "}
          <Link href="/login">
            <span className="text-[#CA922B] font-semibold hover:underline cursor-pointer">Sign In</span>
          </Link>
        </p>

        <p className="text-xs text-[#3A1F0E]/40 mt-8 font-light">
          By signing up, you agree to our{" "}
          <Link href="/terms"><span className="underline cursor-pointer">Terms of Service</span></Link>
          {" "}and{" "}
          <Link href="/privacy-policy"><span className="underline cursor-pointer">Privacy Policy</span></Link>.
        </p>
      </div>
    </div>
  );
}
