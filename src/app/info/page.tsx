'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { User, Laptop, Info, ArrowLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function InfoPage() {
  const [name, setName] = useState('');
  const [accent, setAccent] = useState('');
  const [nativeLanguage, setNativeLanguage] = useState('');
  const [environment, setEnvironment] = useState('');
  const [deviceType, setDeviceType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !accent || !environment || !deviceType) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          accent,
          native_language: nativeLanguage.trim() || undefined,
          environment,
          device_type: deviceType,
          consent: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register participant.');
      }

      // Store ID and auto-generated code in localStorage
      localStorage.setItem('participant_id', data.id);
      localStorage.setItem('participant_code', data.participant_code);
      localStorage.setItem('participant_name', data.name);

      // Redirect to recording page
      router.push('/record');
    } catch (err: any) {
      console.error('Participant registration error:', err);
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col justify-center items-center px-4 py-16 relative">
      <div className="max-w-md w-full z-10">
        {/* Back Link */}
        <Link href="/consent" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-6 group">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Consent
        </Link>

        {/* Info Card */}
        <div className="glass p-8 rounded-2xl space-y-6 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-100">Participant Details</h2>
              <p className="text-xs text-slate-400">Helps analyze model accuracy across accents, environments, and devices.</p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs sm:text-sm text-red-400">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Participant Name */}
            <div className="space-y-2">
              <label htmlFor="participant-name" className="text-xs sm:text-sm font-semibold text-slate-300 block">
                Your Name <span className="text-pink-500">*</span>
              </label>
              <input
                type="text"
                id="participant-name"
                required
                placeholder="e.g. John Doe"
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/40 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Grid for Accent & Native Language */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Accent Dropdown */}
              <div className="space-y-2">
                <label htmlFor="accent" className="text-xs sm:text-sm font-semibold text-slate-300 block">
                  Accent <span className="text-pink-500">*</span>
                </label>
                <select
                  id="accent"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/40 text-slate-355 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all text-sm cursor-pointer text-slate-300"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                >
                  <option value="" disabled className="bg-slate-950">Select accent...</option>
                  <option value="Indian" className="bg-slate-950">Indian</option>
                  <option value="American" className="bg-slate-950">American</option>
                  <option value="British" className="bg-slate-950">British</option>
                  <option value="Australian" className="bg-slate-950">Australian</option>
                  <option value="Canadian" className="bg-slate-950">Canadian</option>
                  <option value="Other" className="bg-slate-950">Other</option>
                </select>
              </div>

              {/* Native Language Optional Input */}
              <div className="space-y-2">
                <label htmlFor="native-lang" className="text-xs sm:text-sm font-semibold text-slate-300 block">
                  Native Language <span className="text-slate-550 text-slate-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  id="native-lang"
                  placeholder="e.g. English, Hindi"
                  className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/40 text-slate-100 placeholder-slate-550 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all text-sm"
                  value={nativeLanguage}
                  onChange={(e) => setNativeLanguage(e.target.value)}
                />
              </div>
            </div>

            {/* Device Type Select */}
            <div className="space-y-2">
              <label htmlFor="device-type" className="text-xs sm:text-sm font-semibold text-slate-300 block">
                Recording Device <span className="text-pink-500">*</span>
              </label>
              <select
                id="device-type"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/40 text-slate-300 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all text-sm cursor-pointer"
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value)}
              >
                <option value="" disabled className="bg-slate-950">Select your device type...</option>
                <option value="Phone" className="bg-slate-950">Phone</option>
                <option value="Laptop" className="bg-slate-950">Laptop</option>
                <option value="Headset" className="bg-slate-950">Headset</option>
                <option value="External Microphone" className="bg-slate-950">External Microphone</option>
              </select>
            </div>

            {/* Recording Environment Select */}
            <div className="space-y-2">
              <label htmlFor="recording-env" className="text-xs sm:text-sm font-semibold text-slate-300 block">
                Recording Environment <span className="text-pink-500">*</span>
              </label>
              <select
                id="recording-env"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/40 text-slate-300 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all text-sm cursor-pointer"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
              >
                <option value="" disabled className="bg-slate-950">Select your environment...</option>
                <option value="Quiet Room" className="bg-slate-950">Quiet Room</option>
                <option value="Fan Running" className="bg-slate-950">Fan Running</option>
                <option value="TV Background" className="bg-slate-950">TV Background</option>
                <option value="Outside" className="bg-slate-950">Outside</option>
                <option value="Classroom / Office" className="bg-slate-950">Classroom / Office</option>
                <option value="Other" className="bg-slate-950">Other</option>
              </select>
            </div>

            {/* Hint message */}
            <div className="flex gap-2 p-3 rounded-xl bg-slate-950/20 border border-slate-800/60 text-xs text-slate-400 leading-normal">
              <Info className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" />
              <span>We will assign you a sequential ID (e.g. P001) for data safety. Only your non-identifiable code is shared during exports.</span>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full py-3.5 text-sm font-semibold rounded-xl mt-2"
              isLoading={isSubmitting}
              rightIcon={<ChevronRight className="h-4 w-4" />}
            >
              Continue to Recorder
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
