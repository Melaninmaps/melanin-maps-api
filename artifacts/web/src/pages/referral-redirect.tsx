import { useEffect } from "react";
import { useParams } from "wouter";

export default function ReferralRedirect() {
  const params = useParams<{ code: string }>();
  const code = params.code?.toUpperCase() ?? "";

  useEffect(() => {
    const dest = code ? `/?ref=${encodeURIComponent(code)}` : "/";
    window.location.replace(dest);
  }, [code]);

  return (
    <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-[#CA922B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#3A1F0E]/60 text-sm">Redirecting…</p>
      </div>
    </div>
  );
}
