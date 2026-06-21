import { Button } from "@/components/ui/button";
import { Clock, Mail } from "lucide-react";
import { Link } from "wouter";

export default function PendingApproval() {
  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF6EF] p-4 relative overflow-hidden">
      <div
        className="absolute inset-0 bg-[#2B1507]/5"
        style={{
          backgroundImage: "radial-gradient(circle at center, #CA922B 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_20px_60px_rgba(43,21,7,0.08)] border border-[#2B1507]/5 p-10 relative z-10 text-center">
        <div className="mx-auto w-20 h-20 bg-[#CA922B]/10 border border-[#CA922B]/20 flex items-center justify-center rounded-full mb-8 text-[#CA922B]">
          <Clock size={40} />
        </div>

        <h1 className="text-3xl font-serif font-bold text-[#3A1F0E] mb-4">
          You're on the List
        </h1>
        <p className="text-[#3A1F0E]/60 text-base leading-relaxed mb-6 font-light">
          Your account is pending approval. We're reviewing early access
          applications in batches — you'll get an email as soon as your city
          launches.
        </p>

        <div className="bg-[#FAF6EF] rounded-2xl p-5 mb-8 text-left space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#CA922B] text-white flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">1</div>
            <p className="text-sm text-[#3A1F0E]/70">Your account has been created and is in the review queue.</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#3A1F0E]/20 text-[#3A1F0E]/40 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">2</div>
            <p className="text-sm text-[#3A1F0E]/50">Our team will review and approve your access.</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#3A1F0E]/20 text-[#3A1F0E]/40 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">3</div>
            <p className="text-sm text-[#3A1F0E]/50">You'll receive an email when you're approved.</p>
          </div>
        </div>

        <a href="mailto:hello@mappingwithmelanin.com" className="block w-full mb-4">
          <Button variant="outline" className="w-full h-12 rounded-full border-[#CA922B] text-[#CA922B] hover:bg-[#CA922B] hover:text-white">
            <Mail className="mr-2 h-4 w-4" /> Contact Us
          </Button>
        </a>

        <button
          onClick={handleLogout}
          className="text-sm text-[#3A1F0E]/40 hover:text-[#3A1F0E] transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
