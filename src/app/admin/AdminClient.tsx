'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { RecordingWithParticipant } from '@/types';
import {
  Lock,
  Search,
  Filter,
  Download,
  Trash2,
  LogOut,
  Database,
  Users,
  Mic,
  Clock,
  Volume2,
  RefreshCw,
  X,
  Play,
  FileSpreadsheet
} from 'lucide-react';
import JSZip from 'jszip';

interface AdminClientProps {
  initialAuth: boolean;
}

export function AdminClient({ initialAuth }: AdminClientProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuth);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard Data State
  const [recordings, setRecordings] = useState<RecordingWithParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPhrase, setFilterPhrase] = useState('All');
  const [filterDevice, setFilterDevice] = useState('All');
  const [filterEnvironment, setFilterEnvironment] = useState('All');
  const [filterAccent, setFilterAccent] = useState('All');

  // Export Progress State
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });

  const router = useRouter();

  // Load recordings if authenticated
  const fetchDashboardData = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await fetch('/api/recordings');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch recordings.');
      }
      setRecordings(data);
    } catch (err: any) {
      console.error('Error fetching recordings:', err);
      setFetchError(err.message || 'Error fetching records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  // Handle Password Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setIsAuthenticated(true);
    } catch (err: any) {
      setLoginError(err.message || 'Invalid credentials');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      setIsAuthenticated(false);
      setPassword('');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Delete Individual Recording
  const handleDeleteRecording = async (recordingId: string) => {
    if (!confirm('Are you sure you want to delete this recording? This will permanently remove the audio file from storage.')) {
      return;
    }

    try {
      const response = await fetch(`/api/recordings/${recordingId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete recording.');
      }

      // Update state
      setRecordings(prev => prev.filter(r => r.id !== recordingId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete recording.');
    }
  };

  // Delete Entire Participant
  const handleDeleteParticipant = async (participantId: string, participantCode: string) => {
    if (!confirm(`WARNING: Are you sure you want to delete participant ${participantCode}? This will permanently delete the participant metadata AND all associated voice recordings.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/participants/${participantId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete participant.');
      }

      // Update state
      setRecordings(prev => prev.filter(r => r.participant_id !== participantId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete participant.');
    }
  };

  // Filtered recordings selector
  const filteredRecordings = useMemo(() => {
    return recordings.filter(rec => {
      const participant = rec.participant || {};
      const matchSearch =
        (participant.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (participant.participant_code || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchPhrase = filterPhrase === 'All' || rec.phrase === filterPhrase;
      const matchDevice = filterDevice === 'All' || participant.device_type === filterDevice;
      const matchEnv = filterEnvironment === 'All' || participant.environment === filterEnvironment;
      const matchAccent = filterAccent === 'All' || participant.accent === filterAccent;

      return matchSearch && matchPhrase && matchDevice && matchEnv && matchAccent;
    });
  }, [recordings, searchTerm, filterPhrase, filterDevice, filterEnvironment, filterAccent]);

  // Statistics Computations
  const stats = useMemo(() => {
    const totalCount = recordings.length;
    const uniqueParticipants = new Set(recordings.map(r => r.participant_id)).size;
    const durations = recordings.map(r => Number(r.duration)).filter(d => !isNaN(d));
    const avgDuration = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    
    return {
      totalRecordings: totalCount,
      totalParticipants: uniqueParticipants,
      avgDuration: avgDuration.toFixed(2),
    };
  }, [recordings]);

  // Export Dataset to client-side ZIP
  const handleExportDataset = async () => {
    if (filteredRecordings.length === 0) {
      alert('No recordings found with the current filters to export.');
      return;
    }

    setIsExporting(true);
    setExportProgress({ current: 0, total: filteredRecordings.length });

    try {
      const zip = new JSZip();
      
      // Header for CSV metadata
      let csvContent = 'participant_id,phrase,label,accent,native_language,device_type,environment,audio_file,duration,timestamp\n';
      
      // Fetch all audios concurrently in batches of 10 to avoid overloading network/memory
      const batchSize = 10;
      for (let i = 0; i < filteredRecordings.length; i += batchSize) {
        const batch = filteredRecordings.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (rec, index) => {
            const pCode = rec.participant?.participant_code || 'unknown';
            const cleanPhrase = rec.phrase.toLowerCase().replace(/[^a-z0-9]/g, '_');
            const timestamp = new Date(rec.created_at).getTime();
            const ext = rec.file_format || 'webm';
            
            // Categorize into positive/negative folders
            const label = ['irish', 'paris', 'virus', 'alice', 'aries'].includes(rec.phrase.trim().toLowerCase()) ? 'negative' : 'positive';
            const relativePath = `${label}/participant_${pCode}_${cleanPhrase}_${timestamp}.${ext}`;
            
            try {
              // Fetch file blob from Vercel Blob URL
              const res = await fetch(rec.audio_url);
              if (!res.ok) throw new Error('File download failed');
              const buffer = await res.arrayBuffer();
              
              // Add to ZIP
              zip.file(relativePath, buffer);
              
              // Append to CSV metadata
              const accent = rec.participant?.accent || 'Unknown';
              const nativeLang = rec.participant?.native_language || 'N/A';
              const device = rec.participant?.device_type || 'Unknown';
              const environment = rec.participant?.environment || 'Unknown';
              
              csvContent += `"${pCode}","${rec.phrase}","${label}","${accent}","${nativeLang}","${device}","${environment}","${relativePath}",${rec.duration},"${rec.created_at}"\n`;
            } catch (err) {
              console.error(`Failed to add audio: ${rec.audio_url}`, err);
            }

            // Update Progress
            setExportProgress(prev => ({
              ...prev,
              current: prev.current + 1
            }));
          })
        );
      }

      // Add CSV to ZIP
      zip.file('metadata.csv', csvContent);

      // Generate Zip Blob
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Download
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'dataset.zip';
      link.click();
      URL.revokeObjectURL(url);

    } catch (err: any) {
      console.error('ZIP generation failed:', err);
      alert('Failed to generate dataset zip file.');
    } finally {
      setIsExporting(false);
    }
  };

  // Phrases lists computed dynamically to ensure all custom / new phrases show up
  const phraseOptions = useMemo(() => {
    const set = new Set<string>();
    recordings.forEach(r => {
      if (r.phrase) {
        set.add(r.phrase.trim());
      }
    });
    const defaults = [
      'Iris', 'Hey Iris', 'Hello Iris', 'Hi Iris', 'Okay Iris', 'Wake up Iris',
      'Good morning Iris', 'Good evening Iris', 'Iris open Chrome', 'Iris play music',
      'Iris what\'s the weather', 'Iris tell me the time', 'Iris open YouTube',
      'Iris search Google', 'Iris turn on the lights', 'Iris pause music',
      'Iris open settings', 'Iris start assistant', 'Can you hear me Iris',
      'Are you there Iris', 'Thanks Iris', 'Please help Iris', 'Listen Iris',
      'Irish', 'Paris', 'Virus', 'Alice', 'Aries'
    ];
    defaults.forEach(d => set.add(d));
    return Array.from(set).sort();
  }, [recordings]);

  const deviceOptions = ['Phone', 'Laptop', 'Headset', 'External Microphone'];
  const envOptions = ['Quiet Room', 'Fan Running', 'TV Background', 'Outside', 'Classroom / Office', 'Other'];

  // 1. RENDER LOGIN SCREEN IF NOT AUTHENTICATED
  if (!isAuthenticated) {
    return (
      <main className="flex-1 flex flex-col justify-center items-center px-4 py-16">
        <div className="max-w-md w-full glass p-8 rounded-2xl space-y-6 shadow-2xl border-purple-500/20">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100">Admin Authentication</h2>
            <p className="text-xs text-slate-400">Enter the administration passcode to view the recordings dashboard.</p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs sm:text-sm text-red-400">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-2">
              <input
                type="password"
                required
                placeholder="Passcode"
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/40 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="w-full py-3 text-sm font-semibold rounded-xl"
              isLoading={isLoggingIn}
            >
              Verify Passcode
            </Button>
          </form>
        </div>
      </main>
    );
  }

  // 2. RENDER ADMIN DASHBOARD IF AUTHENTICATED
  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Export Loader Overlay */}
      {isExporting && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex flex-col justify-center items-center p-4">
          <div className="max-w-sm w-full glass p-6 rounded-2xl text-center space-y-4 border-indigo-500/20 shadow-2xl">
            <RefreshCw className="h-10 w-10 text-indigo-400 animate-spin mx-auto" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-200">Zipping Dataset...</h3>
              <p className="text-xs text-slate-400">Downloading raw audio files and constructing metadata.csv.</p>
            </div>
            {/* ProgressBar */}
            <div className="space-y-1">
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-300"
                  style={{ width: `${(exportProgress.current / exportProgress.total) * 100}%` }}
                />
              </div>
              <div className="text-xs font-semibold text-indigo-400 text-right">
                {exportProgress.current} / {exportProgress.total} files
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-800/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Database className="h-6 w-6 text-purple-400" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              IRIS Dataset Collector
            </h1>
          </div>
          <p className="text-sm text-slate-400">Manage audio samples, inspect metadata, and export dataset archives.</p>
        </div>
        
        {/* Top Control Buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchDashboardData}
            leftIcon={<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={handleLogout}
            leftIcon={<LogOut className="h-4 w-4" />}
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        
        {/* Card 1 */}
        <div className="glass p-5 rounded-2xl flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500">Total Participants</div>
            <div className="text-2xl font-extrabold text-slate-200">{stats.totalParticipants}</div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="glass p-5 rounded-2xl flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
            <Mic className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500">Total Recordings</div>
            <div className="text-2xl font-extrabold text-slate-200">{stats.totalRecordings}</div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass p-5 rounded-2xl flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20 text-pink-400">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500">Avg. Clip Duration</div>
            <div className="text-2xl font-extrabold text-slate-200">{stats.avgDuration}s</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="glass p-6 rounded-2xl space-y-4 shadow-xl border-slate-800">
        
        <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
            <Filter className="h-4 w-4 text-purple-400" />
            <span>Filter Recordings</span>
          </div>

          {/* Export Action */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleExportDataset}
            leftIcon={<Download className="h-4 w-4" />}
            className="w-full md:w-auto shadow-md"
          >
            Export Dataset (ZIP)
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by Code/Name..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/40 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 text-xs sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Phrase filter */}
          <div>
            <select
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950/40 text-slate-300 focus:outline-none focus:border-purple-500 text-xs sm:text-sm cursor-pointer"
              value={filterPhrase}
              onChange={(e) => setFilterPhrase(e.target.value)}
            >
              <option value="All">All Phrases</option>
              {phraseOptions.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Accent filter */}
          <div>
            <select
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950/40 text-slate-300 focus:outline-none focus:border-purple-500 text-xs sm:text-sm cursor-pointer"
              value={filterAccent}
              onChange={(e) => setFilterAccent(e.target.value)}
            >
              <option value="All">All Accents</option>
              {['Indian', 'American', 'British', 'Australian', 'Canadian', 'Other'].map(acc => (
                <option key={acc} value={acc}>{acc}</option>
              ))}
            </select>
          </div>

          {/* Device filter */}
          <div>
            <select
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950/40 text-slate-300 focus:outline-none focus:border-purple-500 text-xs sm:text-sm cursor-pointer"
              value={filterDevice}
              onChange={(e) => setFilterDevice(e.target.value)}
            >
              <option value="All">All Devices</option>
              {deviceOptions.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Environment filter */}
          <div>
            <select
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950/40 text-slate-300 focus:outline-none focus:border-purple-500 text-xs sm:text-sm cursor-pointer"
              value={filterEnvironment}
              onChange={(e) => setFilterEnvironment(e.target.value)}
            >
              <option value="All">All Environments</option>
              {envOptions.map(env => (
                <option key={env} value={env}>{env}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="glass rounded-2xl overflow-hidden shadow-xl border-slate-800">
        
        {isLoading && (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="h-8 w-8 text-purple-400 animate-spin mx-auto" />
            <p className="text-sm text-slate-400">Loading samples...</p>
          </div>
        )}

        {fetchError && (
          <div className="py-16 text-center space-y-4 px-4">
            <div className="text-red-400 text-sm font-semibold">{fetchError}</div>
            <Button size="sm" variant="secondary" onClick={fetchDashboardData}>
              Try Again
            </Button>
          </div>
        )}

        {!isLoading && !fetchError && recordings.length === 0 && (
          <div className="py-20 text-center space-y-2 px-4">
            <Database className="h-10 w-10 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-400 font-semibold">No recordings collected yet.</p>
            <p className="text-xs text-slate-500">When participants submit recordings, they will list here.</p>
          </div>
        )}

        {!isLoading && !fetchError && recordings.length > 0 && filteredRecordings.length === 0 && (
          <div className="py-20 text-center space-y-1 px-4">
            <Filter className="h-8 w-8 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-400 font-semibold">No matches found.</p>
            <p className="text-xs text-slate-500">Try adjusting your search criteria or resetting filters.</p>
          </div>
        )}

        {/* Table of records */}
        {!isLoading && !fetchError && filteredRecordings.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Participant</th>
                  <th className="py-4 px-6">Phrase</th>
                  <th className="py-4 px-6">Env & Device</th>
                  <th className="py-4 px-6">Duration</th>
                  <th className="py-4 px-6">Audio Playback</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs sm:text-sm">
                {filteredRecordings.map((rec) => {
                  const p = rec.participant || { name: 'Unknown', participant_code: 'Unknown', environment: 'Unknown', device_type: 'Unknown' };
                  
                  return (
                    <tr key={rec.id} className="hover:bg-slate-900/20 transition-colors">
                      
                      {/* Participant Code and Name */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-200">{p.participant_code}</div>
                        <div className="text-[10px] text-slate-500">{p.name}</div>
                      </td>

                      {/* Phrase and Type Label */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-300">"{rec.phrase}"</div>
                        <div className="text-[9px] mt-0.5">
                          {!['irish', 'paris', 'virus', 'alice', 'aries'].includes(rec.phrase.trim().toLowerCase()) ? (
                            <span className="text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded">Positive</span>
                          ) : (
                            <span className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded">Negative</span>
                          )}
                        </div>
                      </td>

                      {/* Env, Device & Accent */}
                      <td className="py-4 px-6">
                        <div className="text-slate-300">{p.environment} • {p.device_type}</div>
                        <div className="text-[10px] text-slate-500">
                          {p.accent} {p.native_language ? `(${p.native_language})` : ''}
                        </div>
                      </td>

                      {/* Duration & Format */}
                      <td className="py-4 px-6">
                        <div className="text-slate-300 font-mono">{Number(rec.duration).toFixed(2)}s</div>
                        <div className="text-[9px] text-slate-500 uppercase font-bold">{rec.file_format || 'webm'}</div>
                      </td>

                      {/* Audio Playback Player */}
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <audio
                            src={rec.audio_url}
                            controls
                            preload="none"
                            className="h-7 w-40 filter invert brightness-90 bg-slate-950 rounded border border-slate-800"
                          />
                        </div>
                      </td>

                      {/* Actions (Delete single or Delete user) */}
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-3">
                          {/* Delete recording */}
                          <button
                            title="Delete this recording"
                            className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                            onClick={() => handleDeleteRecording(rec.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

                          {/* Delete participant */}
                          <button
                            title={`Delete participant ${p.participant_code} and all recordings`}
                            className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-600/10 border border-transparent hover:border-red-600/25 transition-all cursor-pointer"
                            onClick={() => handleDeleteParticipant(rec.participant_id, p.participant_code)}
                          >
                            <Users className="h-4 w-4 text-slate-500 hover:text-red-400" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
