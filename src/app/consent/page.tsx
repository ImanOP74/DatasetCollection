'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { ShieldCheck, ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ConsentPage() {
  const [isChecked, setIsChecked] = useState(false);
  const router = useRouter();

  const handleContinue = () => {
    if (isChecked) {
      router.push('/info');
    }
  };

  return (
    <main className="flex-1 flex flex-col justify-center items-center px-4 py-16 relative">
      <div className="max-w-md w-full z-10">
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-6 group">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Home
        </Link>

        {/* Consent Card */}
        <div className="glass p-8 rounded-2xl space-y-6 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100">Consent Agreement</h2>
          </div>

          <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
            <p>
              Before we begin, we need your consent to record and store your voice.
            </p>
            <p>
              Your recordings will be stored securely in the cloud and used solely by our team to train and refine the custom offline **IRIS** wake-word machine learning model.
            </p>
            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-400">
              Note: This collection is fully anonymous. No personal names, locations, or account registrations are tied to your recordings unless explicitly provided in the next steps.
            </div>
          </div>

          {/* Consent Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group p-4 rounded-xl border border-slate-800 bg-slate-950/20 hover:bg-slate-950/40 transition-colors">
            <input
              type="checkbox"
              id="consent-checkbox"
              className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500/50 cursor-pointer accent-purple-500"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
            />
            <span className="text-xs sm:text-sm text-slate-300 select-none leading-relaxed">
              I agree that my recordings may be used for training and improving the IRIS wake-word model.
            </span>
          </label>

          {/* Action Button */}
          <Button
            id="continue-button"
            className="w-full py-3.5 text-sm font-semibold rounded-xl"
            disabled={!isChecked}
            onClick={handleContinue}
            rightIcon={<ChevronRight className="h-4 w-4" />}
          >
            Agree & Continue
          </Button>
        </div>
      </div>
    </main>
  );
}
