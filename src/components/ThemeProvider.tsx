'use client';

import React from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-slate-100 bg-[#030712] selection:bg-purple-500/30 selection:text-purple-200">
      {children}
    </div>
  );
}
