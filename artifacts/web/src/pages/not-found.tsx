import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-gradient-to-b from-[#2B1507] to-[#4a260d] text-center px-4 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[rgba(202,146,43,0.15)] via-transparent to-transparent z-0" />
      
      <div className="relative z-10">
        <h1 className="text-8xl md:text-[12rem] font-serif font-bold text-white mb-4 leading-none select-none tracking-tighter">
          404
        </h1>
        <h2 className="text-2xl md:text-4xl font-serif font-bold text-[#CA922B] mb-6">Page Not Found</h2>
        <p className="text-[#F5EBD8]/70 text-lg max-w-md mx-auto mb-10 font-light">
          Sorry, the page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/">
            <Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-8 h-14 text-lg w-full sm:w-auto shadow-lg shadow-[#CA922B]/20">
              🏠 Go Home
            </Button>
          </Link>
          <Button 
            variant="outline" 
            onClick={() => window.history.back()} 
            className="rounded-full border-white/20 text-white hover:bg-white/10 px-8 h-14 text-lg bg-transparent backdrop-blur-sm w-full sm:w-auto"
          >
            ← Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
