import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const BASE = import.meta.env.BASE_URL;

export default function Login() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6EF]">
      {/* Minimal nav header so users aren't trapped */}
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
      
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_20px_60px_rgba(43,21,7,0.08)] border border-[#2B1507]/5 p-10 relative z-10 text-center">
        <div className="mx-auto w-20 h-20 bg-[#FAF6EF] border border-[#CA922B]/20 flex items-center justify-center rounded-full mb-8 text-[#CA922B]">
          <Shield size={40} />
        </div>
        
        <h1 className="text-4xl font-serif font-bold text-[#3A1F0E] mb-4">Welcome Back</h1>
        <p className="text-[#3A1F0E]/60 text-base leading-relaxed mb-10 font-light">
          Sign in to save trusted places, review businesses, and connect with the community.
        </p>
        
        <a href="/api/login" className="block w-full">
          <Button className="w-full h-14 text-lg rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white shadow-lg">
            Sign In to Continue
          </Button>
        </a>
        
        <p className="text-xs text-[#3A1F0E]/40 mt-8 font-light">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
      </div>
    </div>
  );
}
