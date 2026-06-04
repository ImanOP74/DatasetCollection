import Link from 'next/link';
import { Button } from '@/components/Button';
import { Mic, ShieldCheck, Zap, BarChart } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="flex-1 flex flex-col justify-center items-center px-4 py-16 relative overflow-hidden">
      {/* Decorative background grid/elements */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e1b4b_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

      <div className="max-w-3xl w-full text-center space-y-10 z-10">
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border-purple-500/30 bg-purple-950/20 text-purple-300 text-xs font-semibold animate-pulse-slow">
          <Mic className="h-3.5 w-3.5" />
          <span>IRIS Wake Word Dataset</span>
        </div>

        {/* Hero Title */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-200 via-purple-300 to-pink-200 bg-clip-text text-transparent">
            Help Train IRIS
          </h1>
          <p className="text-base sm:text-xl text-slate-400 max-w-xl mx-auto leading-relaxed">
            Contribute voice recordings of positive wake-words and hard negative phrases. Your recordings will help train a robust, custom offline wake-word engine.
          </p>
        </div>

        {/* Start Button */}
        <div className="flex justify-center pt-4">
          <Link href="/consent" passHref>
            <Button size="lg" className="px-10 py-4 text-base font-semibold group rounded-2xl shadow-xl shadow-purple-500/20 hover:shadow-purple-500/40">
              Start Contributing
              <Zap className="ml-1 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        {/* Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 text-left">
          {/* Card 1 */}
          <div className="glass glass-interactive p-6 rounded-2xl space-y-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-slate-200">15 Quick Phrases</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Read 10 variations of the "Iris" wake word and 5 similar sounding negative distractors.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass glass-interactive p-6 rounded-2xl space-y-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-slate-200">Privacy First</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Recordings are stored anonymously under a random ID. No personal identifiable accounts needed.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass glass-interactive p-6 rounded-2xl space-y-3">
            <div className="h-10 w-10 rounded-xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20 text-pink-400">
              <BarChart className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-slate-200">Duration Limits</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Each recording must be between 0.3 and 5 seconds to ensure premium dataset training quality.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
