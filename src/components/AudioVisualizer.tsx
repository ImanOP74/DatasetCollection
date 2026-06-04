import React from 'react';

interface AudioVisualizerProps {
  isRecording: boolean;
  isPlaying?: boolean;
}

export function AudioVisualizer({ isRecording, isPlaying = false }: AudioVisualizerProps) {
  const barCount = 15;
  const bars = Array.from({ length: barCount });

  // Generate random heights for static state, and delays for animation state
  const getStyle = (index: number) => {
    if (isRecording) {
      // Create a nice wave delay pattern
      const delay = (Math.abs(index - Math.floor(barCount / 2)) * 0.1).toFixed(2);
      const height = (30 + Math.random() * 50) + '%';
      return {
        animationDelay: `${delay}s`,
        height: '100%',
        animationDuration: '0.6s'
      };
    }

    if (isPlaying) {
      // Faster playback wave
      const delay = (index * 0.05).toFixed(2);
      return {
        animationDelay: `${delay}s`,
        height: '100%',
        animationDuration: '0.4s'
      };
    }

    // Static default state
    const staticHeights = [15, 25, 40, 50, 65, 80, 95, 100, 95, 80, 65, 50, 40, 25, 15];
    return {
      height: `${staticHeights[index] || 20}%`
    };
  };

  return (
    <div className="flex items-center justify-center gap-1.5 h-24 w-full px-4 rounded-2xl glass bg-slate-950/40 relative overflow-hidden">
      {/* Background ambient pulse */}
      {(isRecording || isPlaying) && (
        <div className={`absolute inset-0 bg-gradient-to-r ${isRecording ? 'from-purple-500/5 to-pink-500/5' : 'from-indigo-500/5 to-purple-500/5'} blur-lg animate-pulse-slow`} />
      )}

      {/* Visualizer bars */}
      <div className="flex items-end justify-center gap-[4px] w-full h-12 max-w-xs z-10">
        {bars.map((_, i) => (
          <div
            key={i}
            className={`w-[6px] rounded-full transition-all duration-300 ${
              isRecording
                ? 'bg-gradient-to-t from-pink-500 to-purple-500 wave-bar'
                : isPlaying
                ? 'bg-gradient-to-t from-purple-500 to-indigo-500 wave-bar'
                : 'bg-slate-700'
            }`}
            style={getStyle(i)}
          />
        ))}
      </div>
    </div>
  );
}
