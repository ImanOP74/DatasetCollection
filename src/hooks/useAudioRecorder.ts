import { useState, useRef, useEffect } from 'react';

export type RecordingState = 'idle' | 'recording' | 'playing' | 'paused' | 'stopped';

export function useAudioRecorder() {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [liveDuration, setLiveDuration] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isPermissionGranted, setIsPermissionGranted] = useState<boolean | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number>(0);

  // Request microphone permissions
  const requestPermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setIsPermissionGranted(true);
      setError(null);
      return true;
    } catch (err: any) {
      console.error('Error getting audio stream:', err);
      setIsPermissionGranted(false);
      setError('Microphone access denied. Please enable permissions in your browser settings.');
      return false;
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (audioPlaybackRef.current) {
        audioPlaybackRef.current.pause();
      }
    };
  }, []);

  const startRecording = async () => {
    setError(null);
    setAudioUrl(null);
    setAudioBlob(null);
    setDuration(0);
    setLiveDuration(0);
    chunksRef.current = [];

    // Check if permission is already granted or request it
    let stream = streamRef.current;
    if (!stream) {
      const granted = await requestPermission();
      if (!granted) return;
      stream = streamRef.current;
    }

    try {
      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : undefined;
      
      const mediaRecorder = new MediaRecorder(stream!, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mime = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mime });
        setAudioBlob(blob);
        
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Precise duration calculation
        const tempAudio = new Audio(url);
        tempAudio.addEventListener('loadedmetadata', () => {
          setDuration(tempAudio.duration);
          setLiveDuration(tempAudio.duration);
        });
      };

      startTimeRef.current = Date.now();
      mediaRecorder.start();
      setRecordingState('recording');

      // Update live duration timer
      timerIntervalRef.current = setInterval(() => {
        setLiveDuration((Date.now() - startTimeRef.current) / 1000);
      }, 100);

    } catch (err: any) {
      console.error('Failed to start recording:', err);
      setError('Could not start recording. Please try again.');
      setRecordingState('idle');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      setRecordingState('stopped');
    }
  };

  const playRecording = () => {
    if (!audioUrl) return;

    if (audioPlaybackRef.current) {
      audioPlaybackRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    audioPlaybackRef.current = audio;

    audio.addEventListener('ended', () => {
      setRecordingState('stopped');
    });

    audio.play().catch((err) => {
      console.error('Audio playback error:', err);
      setError('Audio playback failed.');
      setRecordingState('stopped');
    });

    setRecordingState('playing');
  };

  const pauseRecording = () => {
    if (audioPlaybackRef.current && recordingState === 'playing') {
      audioPlaybackRef.current.pause();
      setRecordingState('paused');
    }
  };

  const resetRecording = () => {
    if (audioPlaybackRef.current) {
      audioPlaybackRef.current.pause();
    }
    setAudioUrl(null);
    setAudioBlob(null);
    setDuration(0);
    setLiveDuration(0);
    setRecordingState('idle');
    setError(null);
  };

  return {
    recordingState,
    isPermissionGranted,
    audioUrl,
    audioBlob,
    duration: recordingState === 'recording' ? liveDuration : duration,
    error,
    requestPermission,
    startRecording,
    stopRecording,
    playRecording,
    pauseRecording,
    resetRecording,
  };
}

function getSupportedMimeType(): string {
  if (typeof window === 'undefined') return '';
  const types = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/aac'];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return '';
}
