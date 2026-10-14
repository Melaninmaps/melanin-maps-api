import { ShieldCheck } from "lucide-react";

/**
 * Legacy location-link route. It intentionally makes no network request and
 * renders no map or coordinate. This prevents old links from disclosing whether
 * a share existed or surfacing current/recent member location.
 */
export default function LocationShareView() {
  document.title = "Safety & Privacy | Mapping With Melanin";

  return (
    <main className="min-h-screen bg-[#FAF6EF] px-4 py-16 flex items-center justify-center">
      <section className="w-full max-w-md rounded-3xl border border-[#3A1F0E]/10 bg-white p-7 text-center shadow-xl">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#2563EB]/10">
          <ShieldCheck className="h-7 w-7 text-[#2563EB]" aria-hidden="true" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-[#2B1507]">Live location sharing is not available</h1>
        <p className="mt-3 text-sm leading-6 text-[#3A1F0E]/65">
          Mapping With Melanin does not provide current or recent member locations, member-activity maps, visit histories, or a “who is here now” feature.
        </p>
        <div className="mt-5 rounded-xl bg-[#3A1F0E]/5 p-4 text-left text-xs leading-5 text-[#3A1F0E]/60">
          Safety Check-Ins are private to the member by default. Any trusted-contact notification is separately authorized and does not include a live location.
        </div>
      </section>
    </main>
  );
}
