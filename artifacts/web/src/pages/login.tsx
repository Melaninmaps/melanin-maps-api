import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF6EF] p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 mix-blend-overlay z-0 pointer-events-none"
           style={{ backgroundImage: 'radial-gradient(circle at center, #CA922B 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-[0_20px_60px_rgba(43,21,7,0.08)] border border-[#2B1507]/5 p-10 relative z-10 text-center">
        <div className="mx-auto w-20 h-20 bg-[#FAF6EF] border border-[#CA922B]/20 flex items-center justify-center rounded-full mb-8 text-[#CA922B]">
          <Compass size={40} />
        </div>
        
        <h1 className="text-4xl font-serif font-bold text-[#3A1F0E] mb-4">Welcome</h1>
        <p className="text-[#3A1F0E]/60 text-base leading-relaxed mb-10 font-light">
          Sign in to save trusted places, RSVP to local events, and join the community conversation.
        </p>
        
        <a href="/api/login" className="block w-full">
          <Button className="w-full h-14 text-lg rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white shadow-lg">
            Sign in with Replit
          </Button>
        </a>
        
        <p className="text-xs text-[#3A1F0E]/40 mt-8 font-light">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
