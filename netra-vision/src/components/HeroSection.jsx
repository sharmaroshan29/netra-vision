import { ShieldCheck } from "lucide-react";

export default function HeroSection({ totalScans = 0, isAnalyzing = false }) {
  return (
    <header className="relative w-full pt-12 pb-10 px-6 md:px-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 z-10">
      
      {/* Brand & Mission */}
      <div className="space-y-3">
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-white drop-shadow-md">
          Netra <span className="text-amber-400">Vision</span>
        </h1>

        <p className="text-base text-white/80 max-w-xl font-light leading-relaxed drop-shadow-sm">
          Original & Natural. Autonomous plant health analysis translating crop anomilies and Treatment suggestion.
        </p>
      </div>

      {/* Simplified Metric */}
      <div className="flex items-center gap-6 self-end md:self-center bg-white/10 border border-white/20 backdrop-blur-md px-6 py-3 rounded-2xl shadow-lg">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-xs text-amber-300 font-medium tracking-wider uppercase mb-1">
            <ShieldCheck size={14} />
            <span>Total Scans</span>
          </div>
          <span className="text-2xl font-semibold text-white">
            {String(totalScans).padStart(2, "0")}
          </span>
        </div>
      </div>
    </header>
  );
}