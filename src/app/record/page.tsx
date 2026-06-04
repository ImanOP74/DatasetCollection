'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { AudioVisualizer } from '@/components/AudioVisualizer';
import {
  Mic,
  Square,
  Play,
  RotateCcw,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import Link from 'next/link';

const PHRASES = [
  { text: 'Iris', type: 'positive', id: 'iris_1' },
  { text: 'Iris', type: 'positive', id: 'iris_2' },
  { text: 'Iris', type: 'positive', id: 'iris_3' },
  { text: 'Hey Iris', type: 'positive', id: 'hey_iris' },
  { text: 'Hello Iris', type: 'positive', id: 'hello_iris' },
  { text: 'Okay Iris', type: 'positive', id: 'okay_iris' },
  { text: 'Wake up Iris', type: 'positive', id: 'wake_up_iris' },
  { text: 'Irish', type: 'negative', id: 'irish' },
  { text: 'Paris', type: 'negative', id: 'paris' },
  { text: 'Virus', type: 'negative', id: 'virus' }
];

export default function RecordPage() {
  const router = useRouter();

  // Participant State
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [participantCode, setParticipantCode] = useState<string | null>(null);

  // Workflow States
  const [showInstructions, setShowInstructions] = useState(true);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // Audio Recorder Hook
  const {
    recordingState,
    audioBlob,
    audioUrl,
    duration,
    error: micError,
    startRecording,
    stopRecording,
    playRecording,
    resetRecording
  } = useAudioRecorder();

  // Load participant cache
  useEffect(() => {
    const storedId = localStorage.getItem('participant_id');
    const storedCode = localStorage.getItem('participant_code');

    if (!storedId || !storedCode) {
      router.push('/info');
    } else {
      setParticipantId(storedId);
      setParticipantCode(storedCode);
    }
  }, [router]);

  const currentPhrase = PHRASES[currentPhraseIndex];

  // Validation checks
  const isTooShort = duration > 0 && duration < 0.3;
  const isTooLong = duration > 5.0;
  const isValid = duration >= 0.3 && duration <= 5.0 && audioBlob !== null;

  const getValidationMessage = () => {
    if (isTooShort) {
      return {
        text: `Recording is too short (${duration.toFixed(2)}s). Speak the phrase clearly. Min: 0.3s.`,
        type: 'error'
      };
    }
    if (isTooLong) {
      return {
        text: `Recording is too long (${duration.toFixed(2)}s). Keep it under 5.0s.`,
        type: 'error'
      };
    }
    if (isValid) {
      return {
        text: `Audio verified (${duration.toFixed(2)}s). Ready to submit.`,
        type: 'success'
      };
    }
    return null;
  };

  const validation = getValidationMessage();

  // Submit audio upload handler
  const handleSubmitRecording = async () => {
    if (!isValid || !participantId || !currentPhrase) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('participantId', participantId);
      formData.append('phrase', currentPhrase.text);
      formData.append('duration', duration.toString());

      const response = await fetch('/api/recordings/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed.');
      }

      // Proceed to next phrase
      if (currentPhraseIndex < PHRASES.length - 1) {
        setCurrentPhraseIndex(prev => prev + 1);
        resetRecording();
      } else {
        setIsCompleted(true);
      }
    } catch (err: any) {
      console.error('Upload recording error:', err);
      setUploadError(err.message || 'Failed to upload recording. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Completion reset
  const handleStartNewSession = () => {
    localStorage.removeItem('participant_id');
    localStorage.removeItem('participant_code');
    localStorage.removeItem('participant_name');
    router.push('/');
  };

  // 1. Render Instructions / Demo Modal
  const [tutorialStep, setTutorialStep] = useState(1);
  const practiceRecorder = useAudioRecorder();

  // Practice validation checks
  const isPracticeTooShort = practiceRecorder.duration > 0 && practiceRecorder.duration < 0.3;
  const isPracticeTooLong = practiceRecorder.duration > 5.0;
  const isPracticeValid = practiceRecorder.duration >= 0.3 && practiceRecorder.duration <= 5.0 && practiceRecorder.audioBlob !== null;

  const handleStartRealSession = () => {
    // Reset practice recorder to release stream
    practiceRecorder.resetRecording();
    setShowInstructions(false);
  };

  if (showInstructions) {
    return (
      <main className="flex-1 flex flex-col justify-center items-center px-4 py-16 relative">
        <div className="max-w-md w-full glass p-8 rounded-3xl space-y-6 shadow-2xl z-10 border-indigo-500/20">
          
          {/* Stepper Header */}
          <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
              Tutorial Step {tutorialStep} of 3
            </span>
            <div className="flex gap-1">
              <div className={`h-1.5 w-4 rounded-full transition-all duration-300 ${tutorialStep === 1 ? 'bg-indigo-500' : 'bg-slate-800'}`} />
              <div className={`h-1.5 w-4 rounded-full transition-all duration-300 ${tutorialStep === 2 ? 'bg-indigo-500' : 'bg-slate-800'}`} />
              <div className={`h-1.5 w-4 rounded-full transition-all duration-300 ${tutorialStep === 3 ? 'bg-indigo-500' : 'bg-slate-800'}`} />
            </div>
          </div>

          {tutorialStep === 1 ? (
            /* STEP 1: RULES & GUIDELINES */
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-100">1. Speak Varied</h2>
              </div>

              <div className="space-y-4 text-slate-300 leading-relaxed text-sm">
                <p className="font-semibold text-slate-200">
                  Neural networks need to hear the wake word spoken in different ways. Please vary your recordings:
                </p>
                <ul className="space-y-3 list-none pl-1 text-xs sm:text-sm">
                  <li className="flex items-start gap-2.5">
                    <div className="h-5 w-5 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-xs text-purple-300 mt-0.5 flex-shrink-0">✓</div>
                    <span>Speak **naturally** (don't sound like a robot).</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="h-5 w-5 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-xs text-purple-300 mt-0.5 flex-shrink-0">✓</div>
                    <span>Vary your **speed** (some fast, some slower).</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="h-5 w-5 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-xs text-purple-300 mt-0.5 flex-shrink-0">✓</div>
                    <span>Vary your **volume** (whispered, normal, louder).</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="h-5 w-5 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-xs text-purple-300 mt-0.5 flex-shrink-0">✓</div>
                    <span>Record **close** to the mic, then **farther away** (arm's length).</span>
                  </li>
                </ul>
              </div>

              <Button
                className="w-full py-3.5 text-sm font-semibold rounded-xl"
                onClick={() => setTutorialStep(2)}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Next: Interface Walkthrough
              </Button>
            </div>
          ) : tutorialStep === 2 ? (
            /* STEP 2: INTERACTIVE WALKTHROUGH */
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400">
                  <Mic className="h-5 w-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-100">2. How to Record</h2>
              </div>

              {/* Visual mini-mockup of recording layout */}
              <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/50 space-y-4">
                <div className="text-center font-bold text-lg text-slate-100">"Iris"</div>
                
                {/* Visualizer mock */}
                <div className="h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center gap-1">
                  <div className="w-1.5 h-3 bg-purple-500/40 rounded-full" />
                  <div className="w-1.5 h-5 bg-purple-500/60 rounded-full" />
                  <div className="w-1.5 h-7 bg-purple-500/80 rounded-full animate-pulse" />
                  <div className="w-1.5 h-5 bg-purple-500/60 rounded-full" />
                  <div className="w-1.5 h-3 bg-purple-500/40 rounded-full" />
                </div>

                {/* Steps flowchart */}
                <div className="space-y-3 text-xs leading-relaxed text-slate-400">
                  <div className="flex gap-2">
                    <span className="font-bold text-purple-400">Step A:</span>
                    <span>Tap the **Microphone** button to start recording and speak the phrase.</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-purple-400">Step B:</span>
                    <span>Tap **Stop** (square icon) as soon as you finish speaking.</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-purple-400">Step C:</span>
                    <span>Click **Listen** to check your audio, or **Retake** to record it again.</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-purple-400">Step D:</span>
                    <span>Click **Submit** to upload. Clips must be between **0.3s and 5.0s** to pass.</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1 py-3"
                  onClick={() => setTutorialStep(1)}
                >
                  Back
                </Button>
                <Button
                  className="flex-2 py-3.5 text-sm font-semibold rounded-xl"
                  onClick={() => setTutorialStep(3)}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Next: Try Practice Run
                </Button>
              </div>
            </div>
          ) : (
            /* STEP 3: PRACTICE RECORDING RUN */
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20 text-pink-400">
                  <Mic className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-100">3. Practice Run</h2>
                  <p className="text-[10px] text-slate-400">Test your mic by recording the phrase below.</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/60 space-y-4">
                <div className="text-center py-2">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Test Phrase</div>
                  <div className="text-xl font-extrabold text-white">"Hello Iris"</div>
                </div>

                {/* Animated wave visualizer */}
                <AudioVisualizer
                  isRecording={practiceRecorder.recordingState === 'recording'}
                  isPlaying={practiceRecorder.recordingState === 'playing'}
                />

                {/* Duration & Validation text */}
                <div className="min-h-[36px] flex flex-col items-center justify-center text-center">
                  {practiceRecorder.error && (
                    <span className="text-xs text-rose-400">{practiceRecorder.error}</span>
                  )}
                  {isPracticeTooShort && (
                    <span className="text-xs text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Too short ({practiceRecorder.duration.toFixed(2)}s). Keep it &gt; 0.3s.
                    </span>
                  )}
                  {isPracticeTooLong && (
                    <span className="text-xs text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Too long ({practiceRecorder.duration.toFixed(2)}s). Keep it &lt; 5.0s.
                    </span>
                  )}
                  {isPracticeValid && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="h-3 w-3" /> Perfect! ({practiceRecorder.duration.toFixed(2)}s). Click Start below.
                    </span>
                  )}
                  {!practiceRecorder.error && !isPracticeTooShort && !isPracticeTooLong && !isPracticeValid && practiceRecorder.recordingState === 'idle' && (
                    <span className="text-xs text-slate-500">Tap mic to speak</span>
                  )}
                  {practiceRecorder.recordingState === 'recording' && (
                    <span className="text-xs text-pink-400 font-semibold animate-pulse">Recording... {practiceRecorder.duration.toFixed(1)}s</span>
                  )}
                </div>

                {/* Controller Buttons */}
                <div className="flex justify-center gap-3">
                  {practiceRecorder.recordingState === 'idle' && (
                    <Button
                      size="sm"
                      className="h-12 w-12 rounded-full bg-pink-600 hover:bg-pink-500 border-0 flex items-center justify-center scale-100 hover:scale-105 active:scale-95"
                      onClick={practiceRecorder.startRecording}
                    >
                      <Mic className="h-5 w-5 text-white" />
                    </Button>
                  )}

                  {practiceRecorder.recordingState === 'recording' && (
                    <Button
                      size="sm"
                      className="h-12 w-12 rounded-full bg-slate-900 border border-pink-500/40 flex items-center justify-center hover:bg-slate-800"
                      onClick={practiceRecorder.stopRecording}
                    >
                      <Square className="h-4 w-4 text-pink-500 fill-pink-500" />
                    </Button>
                  )}

                  {(practiceRecorder.recordingState === 'stopped' || practiceRecorder.recordingState === 'playing') && (
                    <div className="flex gap-2 w-full">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        leftIcon={<Play className="h-3 w-3 text-purple-400 fill-purple-400" />}
                        onClick={practiceRecorder.playRecording}
                      >
                        Play
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-slate-400 hover:text-slate-200 border border-slate-800 bg-slate-900/10"
                        leftIcon={<RotateCcw className="h-3 w-3" />}
                        onClick={practiceRecorder.resetRecording}
                      >
                        Retake
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1 py-3"
                  onClick={() => setTutorialStep(2)}
                  disabled={practiceRecorder.recordingState === 'recording'}
                >
                  Back
                </Button>
                <Button
                  className="flex-2 py-3.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 border-0 disabled:opacity-50"
                  disabled={!isPracticeValid || practiceRecorder.recordingState === 'recording'}
                  onClick={handleStartRealSession}
                >
                  Start Real Session
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  // 2. Render Completion Screen
  if (isCompleted) {
    return (
      <main className="flex-1 flex flex-col justify-center items-center px-4 py-16 relative">
        <div className="max-w-md w-full glass p-8 rounded-3xl space-y-6 text-center shadow-2xl z-10 border-emerald-500/20">
          <div className="flex justify-center">
            <div className="h-14 w-14 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-8 w-8 animate-bounce" />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-100">Contribution Complete!</h2>

            <div className="text-slate-300 text-xs sm:text-sm leading-relaxed space-y-3 text-left bg-slate-950/45 p-6 rounded-2xl border border-slate-800/80">
              <p className="font-semibold text-slate-100">Dear Contributor,</p>
              <p>
                Thank you so much for taking the time to record these phrases. Building a voice assistant that is truly local, offline, and private requires diverse training voices, and your contribution has brought us one step closer to making **Iris** responsive and accurate.
              </p>
              <p>
                We know recording can get tedious, which is why we shortened the list. We are deeply grateful for your support! Your data has been securely saved and will go directly towards refining our wake-word engine.
              </p>
              <p className="text-xs text-slate-400 italic">
                With sincere gratitude,<br />
                — The IRIS Assistant Team
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-sm space-y-1">
            <div className="text-xs text-slate-500">Your Anonymous Contributor Code</div>
            <div className="text-xl font-extrabold tracking-widest text-slate-200">{participantCode}</div>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              className="w-full py-3"
              onClick={handleStartNewSession}
            >
              Contribute Again
            </Button>
            <Link href="/" className="block">
              <Button
                variant="secondary"
                className="w-full py-3 text-slate-400"
              >
                Go back to home
              </Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 3. Render Recording Session Wizard
  return (
    <main className="flex-1 flex flex-col justify-center items-center px-4 py-8 relative">
      <div className="max-w-lg w-full z-10 space-y-6">

        {/* Session Top Header */}
        <div className="flex justify-between items-center px-2">
          <div className="space-y-0.5">
            <div className="text-xs text-slate-500">Contributor</div>
            <div className="text-sm font-semibold text-indigo-400">{participantCode}</div>
          </div>
          <div className="text-right space-y-0.5">
            <div className="text-xs text-slate-500">Progress</div>
            <div className="text-sm font-semibold text-slate-300">
              Phrase {currentPhraseIndex + 1} of {PHRASES.length}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800/40">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${((currentPhraseIndex) / PHRASES.length) * 100}%` }}
          />
        </div>

        {/* Recording Card */}
        <div className="glass p-8 rounded-3xl space-y-8 shadow-2xl border-slate-800 relative">

          {/* Label Type */}
          <div className="flex justify-center">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${currentPhrase?.type === 'positive'
                ? 'bg-purple-950/30 border-purple-500/25 text-purple-300'
                : 'bg-rose-950/30 border-rose-500/25 text-rose-300'
              }`}>
              {currentPhrase?.type === 'positive' ? 'Wake Word Phrase' : 'Hard Negative Distractor'}
            </span>
          </div>

          {/* Phrase Text */}
          <div className="text-center py-4">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm select-none">
              "{currentPhrase?.text}"
            </h1>
          </div>

          {/* Audio Visualizer */}
          <AudioVisualizer
            isRecording={recordingState === 'recording'}
            isPlaying={recordingState === 'playing'}
          />

          {/* Live / Final Duration and Validation Message */}
          <div className="min-h-[50px] flex flex-col items-center justify-center text-center space-y-2">

            {/* Show error states */}
            {micError && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/25">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>{micError}</span>
              </div>
            )}

            {uploadError && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/25">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Validation Message Display */}
            {!micError && !uploadError && validation && (
              <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border ${validation.type === 'error'
                  ? 'text-rose-400 bg-rose-500/10 border-rose-500/25'
                  : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
                }`}>
                {validation.type === 'error' ? (
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                )}
                <span>{validation.text}</span>
              </div>
            )}

            {/* Default prompt when idle */}
            {!micError && !uploadError && !validation && recordingState === 'idle' && (
              <p className="text-xs text-slate-500">Tap record to speak the phrase</p>
            )}

            {/* Live Recording indicator */}
            {recordingState === 'recording' && (
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-pink-500 animate-ping" />
                <span className="text-xs font-semibold text-pink-400 tracking-wider">
                  RECORDING • {duration.toFixed(1)}s
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons Section */}
          <div className="flex flex-col items-center gap-4">

            {/* Record / Stop Toggle */}
            {recordingState === 'idle' && (
              <Button
                size="lg"
                className="h-16 w-16 rounded-full bg-gradient-to-tr from-pink-600 to-purple-600 shadow-xl shadow-purple-600/30 flex items-center justify-center scale-100 hover:scale-105 active:scale-95 border-0"
                onClick={startRecording}
              >
                <Mic className="h-6 w-6 text-white" />
              </Button>
            )}

            {recordingState === 'recording' && (
              <Button
                size="lg"
                className="h-16 w-16 rounded-full bg-slate-900 border border-pink-500/40 shadow-xl shadow-pink-500/10 flex items-center justify-center hover:bg-slate-800"
                onClick={stopRecording}
              >
                <Square className="h-5 w-5 text-pink-500 fill-pink-500" />
              </Button>
            )}

            {/* Recorded Controls (Playback, Retake, Submit) */}
            {(recordingState === 'stopped' || recordingState === 'playing' || recordingState === 'paused') && (
              <div className="w-full space-y-4">
                <div className="flex justify-center gap-4">
                  {/* Play Button */}
                  <Button
                    variant="secondary"
                    className="flex-1 py-3 rounded-xl border border-slate-700 bg-slate-800/40"
                    leftIcon={<Play className="h-4 w-4 text-purple-400 fill-purple-400" />}
                    onClick={playRecording}
                  >
                    Listen
                  </Button>

                  {/* Retake Button */}
                  <Button
                    variant="ghost"
                    className="flex-1 py-3 rounded-xl border border-slate-800 bg-slate-900/20 text-slate-400"
                    leftIcon={<RotateCcw className="h-4 w-4" />}
                    onClick={resetRecording}
                  >
                    Retake
                  </Button>
                </div>

                {/* Submit Recording Button */}
                <Button
                  className="w-full py-4 text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 border-0 shadow-lg shadow-emerald-500/15"
                  disabled={!isValid}
                  isLoading={isUploading}
                  leftIcon={<UploadCloud className="h-4 w-4" />}
                  onClick={handleSubmitRecording}
                >
                  Submit & Next
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Small Tips Section */}
        <div className="flex gap-2.5 p-4 rounded-2xl glass bg-slate-950/20 border-slate-800 text-xs text-slate-400 leading-normal">
          <Info className="h-4.5 w-4.5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-slate-300 block">Variation Tip:</span>
            <span>
              {currentPhraseIndex % 3 === 0
                ? "Try saying this phrase normally and naturally."
                : currentPhraseIndex % 3 === 1
                  ? "Try speaking slightly faster or slower than normal."
                  : "Try speaking from a different distance or slightly louder."}
            </span>
          </div>
        </div>

      </div>
    </main>
  );
}
