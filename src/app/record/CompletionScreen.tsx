'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/Button';
import {
  Mic,
  Brain,
  Rocket,
  Users,
  Share2,
  Copy,
  Check,
  RotateCcw,
  Home,
  Sparkles,
  Heart
} from 'lucide-react';
import Link from 'next/link';

interface CompletionScreenProps {
  participantCode: string;
  onStartNewSession: () => void;
}

// 1. Hook for incrementing counters from 0 to target
function useAnimatedCounter(target: number, duration: number = 1500, trigger: boolean = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!trigger) return;
    let start = 0;
    const end = target;
    if (start === end) {
      setCount(end);
      return;
    }

    const stepTime = Math.max(Math.floor(duration / end), 15);
    const timer = setInterval(() => {
      start += Math.ceil(end / 100) || 1;
      if (start >= end) {
        start = end;
        clearInterval(timer);
      }
      setCount(start);
    }, stepTime);

    return () => clearInterval(timer);
  }, [target, duration, trigger]);

  return count;
}

// 2. Typewriter Effect Component
function Typewriter({
  text,
  delay = 55,
  startTrigger = true,
  onComplete
}: {
  text: string;
  delay?: number;
  startTrigger?: boolean;
  onComplete?: () => void;
}) {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    if (!startTrigger) return;
    let index = 0;
    setDisplayText('');
    const timer = setInterval(() => {
      setDisplayText((prev) => prev + text.charAt(index));
      index++;
      if (index >= text.length) {
        clearInterval(timer);
        if (onComplete) onComplete();
      }
    }, delay);
    return () => clearInterval(timer);
  }, [text, delay, startTrigger]);

  return <span>{displayText}</span>;
}

export function CompletionScreen({ participantCode, onStartNewSession }: CompletionScreenProps) {
  // Staging state for choreographed entries
  const [stage, setStage] = useState(0);
  const [headlineStage, setHeadlineStage] = useState(1);

  // Link copy status
  const [isCopied, setIsCopied] = useState(false);

  // Typewriter step tracker
  const [typewriterStep, setTypewriterStep] = useState(0); // 0: idle, 1: text1, 2: pause, 3: text2, 4: complete

  // Live Stats
  const [stats, setStats] = useState({ contributors: 15, recordings: 150 });

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animated counters
  const mainRecordingsCount = useAnimatedCounter(10, 1500, stage >= 2);
  const impactRecordingsCount = useAnimatedCounter(10, 1500, stage >= 4);
  const impactSamplesCount = useAnimatedCounter(10, 1500, stage >= 4);
  const globalContributorsCount = useAnimatedCounter(stats.contributors, 2000, stage >= 4);
  const globalRecordingsCount = useAnimatedCounter(stats.recordings, 2000, stage >= 4);

  // Fetch stats from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        if (response.ok) {
          const data = await response.json();
          setStats({
            contributors: data.contributors || 15,
            recordings: data.recordings || 150
          });
        }
      } catch (e) {
        console.error('Failed to load stats', e);
      }
    };
    fetchStats();
  }, []);

  // Progression sequence
  useEffect(() => {
    // Fade in orb and headline
    const timers = [
      setTimeout(() => setStage(1), 100),   // Orb and title reveal
      setTimeout(() => setStage(2), 800),   // Start main count up
      setTimeout(() => setHeadlineStage(2), 2200), // Morph headline
      setTimeout(() => setStage(3), 3200),  // Stagger reveal personal letter
      setTimeout(() => setStage(4), 5000),  // Impact stats + Global stats
      setTimeout(() => setStage(5), 7200),  // Start Typewriter
      setTimeout(() => setStage(6), 11000)  // Share card + buttons
    ];

    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  // Typewriter control flow
  useEffect(() => {
    if (stage === 5) {
      setTypewriterStep(1);
    }
  }, [stage]);

  // Particle background animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      color: string;
    }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // Create particles with cyan and indigo hues
    const particleColors = ['rgba(129, 140, 248, ', 'rgba(34, 211, 238, ', 'rgba(168, 85, 247, '];
    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.5 + 0.8,
        speedX: (Math.random() - 0.5) * 0.25,
        speedY: (Math.random() - 0.5) * 0.3 - 0.15, // float up
        opacity: Math.random() * 0.4 + 0.1,
        color: particleColors[Math.floor(Math.random() * particleColors.length)]
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        // Reset positions
        if (p.y < 0) p.y = canvas.height;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.opacity})`;
        ctx.fill();
      });
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleCopyLink = () => {
    const link = typeof window !== 'undefined' ? window.location.origin : 'https://iris.assistant.com';
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.origin : 'https://iris.assistant.com';
    const shareData = {
      title: 'IRIS Wake Word Collector',
      text: 'I just contributed my voice to help build IRIS, an offline private voice assistant. Help train IRIS by recording a few short phrases!',
      url
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (e) {
        console.log('Share error or cancel', e);
      }
    } else {
      handleCopyLink();
    }
  };

  // Personal message lines
  const personalLines = [
    "IRIS started as a personal project and a simple idea:",
    "What if I could build my own voice assistant from scratch?",
    "Today, because of people like you, that idea is becoming a little more real.",
    "Your recordings will help IRIS understand different voices, accents, microphones, and environments.",
    "Every single contribution matters.",
    "Thank you for being part of the journey."
  ];

  return (
    <main className="flex-1 w-full min-h-screen relative overflow-hidden flex flex-col items-center justify-start py-12 px-4 z-10 text-slate-100 bg-[#02040a]">
      {/* 1. Cinematic Black Screen Overlay (fade out on load) */}
      <div className="fixed inset-0 bg-black z-50 pointer-events-none transition-opacity duration-1500 opacity-0" style={{ animation: 'fade-out-overlay 1.5s forwards' }} />
      <style jsx global>{`
        @keyframes fade-out-overlay {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>

      {/* 2. Floating Star Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* 3. Ambient Aurora Background */}
      <div className="aurora-bg" />

      {/* Main Content Layout */}
      <div className="max-w-2xl w-full z-10 space-y-12 pb-16">
        
        {/* ORB + HEADLINE SECTION */}
        <div className={`space-y-6 text-center transition-all duration-1000 ${stage >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Futuristic glowing Orb (The Core of IRIS coming to life) */}
          <div className="relative h-28 w-28 mx-auto flex items-center justify-center">
            {/* Outer rings */}
            <div className="absolute inset-0 rounded-full border border-indigo-500/20 animate-ping" style={{ animationDuration: '3.5s' }} />
            <div className="absolute inset-2 rounded-full border border-dashed border-cyan-400/40 animate-spin" style={{ animationDuration: '20s' }} />
            <div className="absolute inset-3 rounded-full border border-purple-500/25 animate-spin" style={{ animationDuration: '10s', animationDirection: 'reverse' }} />
            
            {/* Ambient core light */}
            <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 glow-orb flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-cyan-200 animate-pulse" />
            </div>
          </div>

          {/* Morphing Headline Container */}
          <div className="h-14 relative flex items-center justify-center">
            <h1 className={`absolute text-2xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-200 via-purple-300 to-pink-200 bg-clip-text text-transparent transition-all duration-1000 ${
              headlineStage === 1 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-8 scale-95 pointer-events-none'
            }`}>
              Thank You.
            </h1>
            <h1 className={`absolute text-2xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-200 via-indigo-300 to-purple-200 bg-clip-text text-transparent transition-all duration-1000 ${
              headlineStage === 2 ? 'opacity-100 translate-y-0 scale-100 font-mono tracking-wide' : 'opacity-0 translate-y-8 scale-95 pointer-events-none'
            }`}>
              You just helped train IRIS.
            </h1>
          </div>

          {/* Small animated recordings counter banner */}
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-950/20 text-indigo-300 text-xs font-semibold tracking-wider uppercase transition-all duration-1000 ${
            stage >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}>
            <Mic className="h-4.5 w-4.5 text-cyan-400 animate-pulse" />
            <span>🎙️ +{mainRecordingsCount} Recordings Added</span>
          </div>
        </div>

        {/* PERSONAL MESSAGE SECTION */}
        <div className={`glass p-8 rounded-3xl space-y-5 border-slate-800/80 shadow-2xl relative glow-indigo transition-all duration-1000 ${
          stage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          {/* Subtle decoration lines */}
          <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
          <div className="absolute bottom-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent" />

          {/* Staggered message lines */}
          <div className="space-y-4 text-slate-300 font-light text-center leading-relaxed text-[13px] sm:text-[15px]">
            {personalLines.map((line, idx) => (
              <p
                key={idx}
                className={`transition-all duration-700 ${
                  stage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                } ${
                  idx === 1 ? 'font-semibold text-cyan-300 italic' :
                  idx === 4 || idx === 5 ? 'font-bold text-slate-200' : ''
                }`}
                style={{ transitionDelay: `${idx * 280}ms` }}
              >
                {line}
              </p>
            ))}
          </div>

          {/* Student signature */}
          <div className={`flex justify-center items-center gap-1.5 pt-4 transition-all duration-700 delay-2000 ${
            stage >= 3 ? 'opacity-70 scale-100' : 'opacity-0 scale-95'
          }`}>
            <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500 animate-pulse" />
            <span className="text-xs text-slate-400 font-mono">IRIS Voice Assistant project</span>
          </div>
        </div>

        {/* STATS & IMPACT SECTION */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Stat Card 1 */}
            <div className={`glass p-5 rounded-2xl flex flex-col justify-center items-center text-center gap-1.5 border-slate-800 glow-indigo glass-interactive transition-all duration-1000 ${
              stage >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <div className="h-8 w-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Mic className="h-4 w-4" />
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Recordings Contributed</div>
              <div className="text-3xl font-extrabold tracking-tight text-white">{impactRecordingsCount}</div>
            </div>

            {/* Stat Card 2 */}
            <div className={`glass p-5 rounded-2xl flex flex-col justify-center items-center text-center gap-1.5 border-slate-800 glow-indigo glass-interactive transition-all duration-1000 delay-150 ${
              stage >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <div className="h-8 w-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Brain className="h-4 w-4" />
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Training Samples Added</div>
              <div className="text-3xl font-extrabold tracking-tight text-white">{impactSamplesCount}</div>
            </div>

            {/* Stat Card 3 */}
            <div className={`glass p-5 rounded-2xl flex flex-col justify-center items-center text-center gap-1.5 border-slate-800 glow-indigo glass-interactive transition-all duration-1000 delay-300 ${
              stage >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <div className="h-8 w-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Rocket className="h-4 w-4" />
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Status</div>
              <div className="text-sm font-extrabold tracking-wider uppercase text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/20 border border-cyan-500/20">Helping Build IRIS</div>
            </div>
          </div>

          {/* GLOBAL COMMUNITY DATA PANEL */}
          <div className={`glass p-6 rounded-2xl border-slate-800/60 shadow-xl transition-all duration-1000 delay-400 ${
            stage >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="flex flex-col sm:flex-row items-center sm:justify-around gap-6">
              
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Contributors</div>
                  <div className="text-xl font-extrabold text-slate-200">{globalContributorsCount}</div>
                </div>
              </div>

              <div className="h-[1px] w-full sm:h-8 sm:w-[1px] bg-slate-800/80" />

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-400">
                  <Mic className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total Recordings</div>
                  <div className="text-xl font-extrabold text-slate-200">{globalRecordingsCount}</div>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-slate-500 mt-4 leading-relaxed font-light">
              "You are one of the early contributors helping shape IRIS."
            </p>
          </div>
        </div>

        {/* SPECIAL TYPEWRITER MOMENT */}
        <div className="min-h-[50px] flex flex-col items-center justify-center text-center">
          {typewriterStep >= 1 && (
            <p className="text-base sm:text-lg font-mono text-cyan-400 typewriter-cursor">
              <Typewriter
                text="Your voice is now part of IRIS."
                startTrigger={typewriterStep === 1}
                onComplete={() => {
                  setTimeout(() => setTypewriterStep(3), 1200);
                }}
              />
            </p>
          )}
          {typewriterStep >= 3 && (
            <p className="text-sm font-light text-slate-400 mt-1">
              <Typewriter
                text="Thank you."
                startTrigger={typewriterStep === 3}
                onComplete={() => setTypewriterStep(4)}
              />
            </p>
          )}
        </div>

        {/* SHARE SECTION & NAVIGATION */}
        <div className={`space-y-6 transition-all duration-1000 ${stage >= 6 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Share Project Card */}
          <div className="glass p-6 rounded-2xl border-slate-800/60 shadow-xl glow-indigo text-center space-y-4">
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-100">Want to help IRIS grow faster?</h3>
              <p className="text-xs text-slate-400">
                "If every contributor shares with one friend, IRIS learns twice as fast."
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button
                variant="primary"
                onClick={handleShare}
                leftIcon={<Share2 className="h-4 w-4" />}
                className="py-3 px-6 text-xs sm:text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 border-0"
              >
                Share Project
              </Button>
              <Button
                variant="secondary"
                onClick={handleCopyLink}
                leftIcon={isCopied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                className="py-3 px-6 text-xs sm:text-sm font-semibold rounded-xl border border-slate-850 bg-slate-900/30 hover:bg-slate-900/60"
              >
                {isCopied ? 'Link Copied!' : 'Copy Link'}
              </Button>
            </div>
          </div>

          {/* Action Navigation Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <Button
              className="py-3.5 px-8 text-xs sm:text-sm font-semibold rounded-xl border-0 bg-indigo-600 hover:bg-indigo-500"
              onClick={onStartNewSession}
              leftIcon={<RotateCcw className="h-4 w-4" />}
            >
              Contribute Again
            </Button>
            <Link href="/" className="block">
              <Button
                variant="secondary"
                className="w-full sm:w-auto py-3.5 px-8 text-xs sm:text-sm font-semibold rounded-xl border border-slate-850 bg-slate-900/30 hover:bg-slate-900/60 text-slate-400 hover:text-slate-200"
                leftIcon={<Home className="h-4 w-4" />}
              >
                Go back to home
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}
