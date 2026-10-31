import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Project, SubtitleCue } from '../types';
import { formatTimeWithMillis, toNepaliNumerals } from '../utils/formatters';
import { generateSrtContent, generateVttContent } from '../utils/audioHelper';
import {
  Subtitles,
  Play,
  Pause,
  Plus,
  Trash2,
  Split,
  Merge,
  Save,
  Download,
  Search,
  Check,
  FileText,
  Sparkles,
  Wand2,
} from 'lucide-react';

interface SubtitleEditorViewProps {
  project: Project;
  onUpdateSubtitles: (subtitles: SubtitleCue[]) => void;
  onEditWithAi?: (text: string, title: string, instruction: string) => void;
}

export const SubtitleEditorView: React.FC<SubtitleEditorViewProps> = ({
  project,
  onUpdateSubtitles,
  onEditWithAi,
}) => {
  const { language, t } = useLanguage();
  const { token } = useAuth();

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [subtitles, setSubtitles] = useState<SubtitleCue[]>(project.subtitles);
  const [activeCueId, setActiveCueId] = useState<string | null>(subtitles[0]?.id || null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [displayMode, setDisplayMode] = useState<'both' | 'ne' | 'en' | 'none'>('both');
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setSubtitles(project.subtitles);
  }, [project.subtitles]);

  const currentVideoCue = subtitles.find(
    (c) => currentTime >= c.startTime && currentTime <= c.endTime
  );

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handlePlayToggle = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeekToCue = (cue: SubtitleCue) => {
    if (videoRef.current) {
      videoRef.current.currentTime = cue.startTime;
      videoRef.current.play();
      setIsPlaying(true);
      setActiveCueId(cue.id);
    }
  };

  const handleUpdateCueText = (id: string, field: 'nepaliText' | 'englishText', value: string) => {
    setSubtitles((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleAdjustTiming = (id: string, field: 'startTime' | 'endTime', delta: number) => {
    setSubtitles((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const newVal = Math.max(0, parseFloat((c[field] + delta).toFixed(2)));
        return { ...c, [field]: newVal };
      })
    );
  };

  const handleAddCue = () => {
    const lastCue = subtitles[subtitles.length - 1];
    const startTime = lastCue ? parseFloat((lastCue.endTime + 0.5).toFixed(2)) : parseFloat(currentTime.toFixed(2));
    const endTime = parseFloat((startTime + 4.0).toFixed(2));

    const newCue: SubtitleCue = {
      id: `cue-${Date.now()}`,
      index: subtitles.length + 1,
      startTime,
      endTime,
      nepaliText: language === 'ne' ? 'नयाँ उपशीर्षक पाठ यहाँ लेख्नुहोस्...' : 'New subtitle caption...',
      englishText: 'Enter English translation here...',
    };

    const updated = [...subtitles, newCue];
    setSubtitles(updated);
    setActiveCueId(newCue.id);
  };

  const handleSplitCue = (cue: SubtitleCue) => {
    const splitPoint = parseFloat(currentTime.toFixed(2));
    if (splitPoint <= cue.startTime || splitPoint >= cue.endTime) {
      alert(language === 'ne' ? 'भिडियोलाई क्याप्सनको बिचमा रोकेर मात्र टुक्र्याउन सकिन्छ।' : 'Pause the video inside this cue duration to split it.');
      return;
    }

    const firstHalf: SubtitleCue = {
      ...cue,
      endTime: splitPoint,
    };
    const secondHalf: SubtitleCue = {
      id: `cue-${Date.now()}`,
      index: cue.index + 1,
      startTime: splitPoint,
      endTime: cue.endTime,
      nepaliText: `${cue.nepaliText} (भाग २)`,
      englishText: `${cue.englishText} (Part 2)`,
    };

    const cueIndex = subtitles.findIndex((c) => c.id === cue.id);
    const updated = [
      ...subtitles.slice(0, cueIndex),
      firstHalf,
      secondHalf,
      ...subtitles.slice(cueIndex + 1),
    ].map((c, idx) => ({ ...c, index: idx + 1 }));

    setSubtitles(updated);
    setActiveCueId(secondHalf.id);
  };

  const handleMergeCue = (cueIndex: number) => {
    if (cueIndex >= subtitles.length - 1) return;
    const current = subtitles[cueIndex];
    const next = subtitles[cueIndex + 1];

    const mergedCue: SubtitleCue = {
      id: current.id,
      index: current.index,
      startTime: current.startTime,
      endTime: next.endTime,
      nepaliText: `${current.nepaliText} ${next.nepaliText}`.trim(),
      englishText: `${current.englishText} ${next.englishText}`.trim(),
    };

    const updated = [
      ...subtitles.slice(0, cueIndex),
      mergedCue,
      ...subtitles.slice(cueIndex + 2),
    ].map((c, idx) => ({ ...c, index: idx + 1 }));

    setSubtitles(updated);
  };

  const handleDeleteCue = (id: string) => {
    if (subtitles.length <= 1) return;
    const updated = subtitles
      .filter((c) => c.id !== id)
      .map((c, idx) => ({ ...c, index: idx + 1 }));
    setSubtitles(updated);
  };

  const handleSaveToServer = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/subtitles`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subtitles }),
      });
      if (res.ok) {
        onUpdateSubtitles(subtitles);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (err) {
      console.error('Failed to save subtitles:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadFile = (type: 'srt_ne' | 'srt_en' | 'vtt') => {
    let content = '';
    let filename = '';
    let mime = 'text/plain;charset=utf-8';

    if (type === 'srt_ne') {
      content = generateSrtContent(subtitles, 'ne');
      filename = `${project.title}_Nepali.srt`;
    } else if (type === 'srt_en') {
      content = generateSrtContent(subtitles, 'en');
      filename = `${project.title}_English.srt`;
    } else {
      content = generateVttContent(subtitles);
      filename = `${project.title}_Subtitles.vtt`;
      mime = 'text/vtt;charset=utf-8';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenAiEditor = () => {
    const fullTranscript = subtitles
      .map((c) => c.nepaliText || c.englishText)
      .filter(Boolean)
      .join(' ');

    const defaultInstruction =
      language === 'ne'
        ? 'व्याकरण, हिज्जे, र विराम चिन्हहरू सच्याउनुहोस्। बोलेका अनावश्यक थेगो (उम्म्, अँ, uh, um) हटाएर सफा शैक्षिक अनुच्छेद बनाउनुहोस् तर वक्ताको मूल अर्थ परिवर्तन नगर्नुहोस्।'
        : 'Clean verbal filler words, correct grammar and punctuation, improve sentence flow, and format into structured educational paragraphs while strictly preserving the speaker\'s original meaning.';

    if (onEditWithAi) {
      onEditWithAi(fullTranscript, `${project.title} - Lecture Transcript`, defaultInstruction);
    }
  };

  const filteredCues = subtitles.filter(
    (c) =>
      c.nepaliText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.englishText.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 font-bilingual">
      {/* Top Action Header */}
      <div className="p-5 rounded-3xl bg-white border border-[#dde9ff] shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-[#0f1c2d] flex items-center gap-2 font-heading">
            <Subtitles className="w-5 h-5 text-[#b6152e]" />
            <span>{t('subEditorTitle')}</span>
          </h3>
          <p className="text-xs text-[#45464e] leading-relaxed">
            {t('subEditorSub')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-heading">
          {/* Subtitle preview mode selector */}
          <div className="flex items-center gap-1 bg-[#eff4ff] p-1 rounded-xl border border-[#dde9ff] text-xs">
            <span className="text-[11px] text-[#45464e] px-2 hidden sm:inline font-medium">
              {t('subDisplayMode')}
            </span>
            <button
              onClick={() => setDisplayMode('both')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                displayMode === 'both' ? 'bg-[#1b2a4a] text-white shadow-sm' : 'text-[#45464e] hover:text-[#0f1c2d]'
              }`}
            >
              {language === 'ne' ? 'दुवै' : 'Dual'}
            </button>
            <button
              onClick={() => setDisplayMode('ne')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                displayMode === 'ne' ? 'bg-[#1b2a4a] text-white shadow-sm' : 'text-[#45464e] hover:text-[#0f1c2d]'
              }`}
            >
              नेपाली
            </button>
            <button
              onClick={() => setDisplayMode('en')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                displayMode === 'en' ? 'bg-[#1b2a4a] text-white shadow-sm' : 'text-[#45464e] hover:text-[#0f1c2d]'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setDisplayMode('none')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                displayMode === 'none' ? 'bg-[#1b2a4a] text-white shadow-sm' : 'text-[#45464e] hover:text-[#0f1c2d]'
              }`}
            >
              Off
            </button>
          </div>

          {/* Edit with AI Button */}
          {onEditWithAi && (
            <button
              onClick={handleOpenAiEditor}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#1b2a4a] to-[#243143] hover:from-[#243143] hover:to-[#1b2a4a] text-white text-xs font-semibold shadow-md border border-[#cddbf2]/30 active:scale-95 transition-all"
              title="Edit lecture transcript with Gemini AI"
            >
              <Sparkles className="w-4 h-4 text-[#ffdcc5]" />
              <span>{language === 'ne' ? 'AI सम्पादन (Edit with AI)' : 'Edit with AI'}</span>
            </button>
          )}

          {/* Save Subtitles */}
          <button
            onClick={handleSaveToServer}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#b6152e] hover:bg-[#92001f] text-white text-xs font-semibold shadow-md shadow-[#b6152e]/30 active:scale-95 disabled:opacity-50"
          >
            {saveSuccess ? <Check className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
            <span>{saveSuccess ? (language === 'ne' ? 'सुरक्षित गरियो!' : 'Saved!') : t('saveSubtitlesBtn')}</span>
          </button>
        </div>
      </div>


      {/* Main 2-Column Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Video Preview with Subtitles Overlay */}
        <div className="lg:col-span-5 space-y-4 sticky top-20">
          <div className="relative rounded-3xl overflow-hidden bg-[#041534] aspect-video border border-[#1b2a4a] shadow-xl flex items-center justify-center group">
            <video
              ref={videoRef}
              src={project.mediaFileUrl}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              className="w-full h-full object-contain"
            />

            {/* Subtitle Overlay rendered on video */}
            {displayMode !== 'none' && currentVideoCue && (
              <div className="absolute bottom-5 inset-x-4 pointer-events-none flex flex-col items-center justify-center text-center">
                <div className="bg-[#041534]/90 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/20 shadow-2xl max-w-[92%] transition-all">
                  {(displayMode === 'both' || displayMode === 'ne') && (
                    <p className={`font-semibold text-white drop-shadow-md leading-relaxed ${
                      fontSize === 'lg' ? 'text-base sm:text-lg' : fontSize === 'sm' ? 'text-xs' : 'text-sm sm:text-base'
                    }`}>
                      {currentVideoCue.nepaliText}
                    </p>
                  )}
                  {(displayMode === 'both' || displayMode === 'en') && (
                    <p className={`text-[#ffdcc5] font-medium drop-shadow-md mt-0.5 ${
                      fontSize === 'lg' ? 'text-xs sm:text-sm' : fontSize === 'sm' ? 'text-[10px]' : 'text-xs'
                    }`}>
                      {currentVideoCue.englishText}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Hover Play/Pause Overlay Button */}
            <button
              onClick={handlePlayToggle}
              className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <div className="w-14 h-14 rounded-full bg-[#b6152e] text-white flex items-center justify-center shadow-xl transform hover:scale-110 transition-transform">
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
              </div>
            </button>
          </div>

          {/* Video Controls Bar */}
          <div className="p-4 rounded-2xl bg-white border border-[#dde9ff] shadow-sm flex items-center justify-between text-xs text-[#0f1c2d]">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePlayToggle}
                className="w-8 h-8 rounded-lg bg-[#eff4ff] text-[#1b2a4a] hover:bg-[#1b2a4a] hover:text-white transition-colors flex items-center justify-center font-bold"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <span className="font-mono text-xs font-bold text-[#0f1c2d]">
                {formatTimeWithMillis(currentTime)}
              </span>
            </div>

            {/* Quick Export Subtitle Files */}
            <div className="flex items-center gap-1.5 font-heading">
              <button
                onClick={() => handleDownloadFile('srt_ne')}
                title="Download Nepali SRT"
                className="px-2.5 py-1.5 rounded-lg bg-[#eff4ff] hover:bg-[#dde9ff] text-[#b6152e] text-[11px] font-bold border border-[#cddbf2] flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                <span>नेपाली .SRT</span>
              </button>
              <button
                onClick={() => handleDownloadFile('srt_en')}
                title="Download English SRT"
                className="px-2.5 py-1.5 rounded-lg bg-[#eff4ff] hover:bg-[#dde9ff] text-[#1b2a4a] text-[11px] font-bold border border-[#cddbf2] flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                <span>English .SRT</span>
              </button>
              <button
                onClick={() => handleDownloadFile('vtt')}
                title="Download WebVTT"
                className="px-2.5 py-1.5 rounded-lg bg-[#eff4ff] hover:bg-[#dde9ff] text-emerald-800 text-[11px] font-bold border border-[#cddbf2] flex items-center gap-1"
              >
                <FileText className="w-3 h-3" />
                <span>.VTT</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Cue List */}
        <div className="lg:col-span-7 space-y-4">
          {/* List Search & Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#75777f]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'ne' ? 'क्याप्सन शब्द खोज्नुहोस्...' : 'Search subtitles...'}
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#c5c6cf] rounded-xl text-xs text-[#0f1c2d] placeholder-[#75777f] focus:outline-none focus:ring-1 focus:ring-[#1b2a4a]"
              />
            </div>

            <button
              onClick={handleAddCue}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1b2a4a] hover:bg-[#041534] text-white text-xs font-semibold transition-colors shadow-sm font-heading"
            >
              <Plus className="w-4 h-4" />
              <span>{t('addCueBtn')}</span>
            </button>
          </div>

          {/* Subtitle Cue Cards */}
          <div className="space-y-3.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredCues.map((cue, idx) => {
              const isCurrent = currentVideoCue?.id === cue.id;
              const isSelected = activeCueId === cue.id;

              return (
                <div
                  key={cue.id}
                  onClick={() => setActiveCueId(cue.id)}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-[#eff4ff] border-[#1b2a4a] shadow-md ring-1 ring-[#1b2a4a]/40'
                      : isSelected
                      ? 'bg-white border-[#1b2a4a] shadow-sm'
                      : 'bg-white border-[#dde9ff] hover:border-[#cddbf2]'
                  }`}
                >
                  {/* Card Top: Timing & Segment Control */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-[#e2e8f0] text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#eff4ff] text-[#1b2a4a] text-[11px] font-bold flex items-center justify-center font-mono border border-[#cddbf2]">
                        {language === 'ne' ? toNepaliNumerals(cue.index) : cue.index}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSeekToCue(cue);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#ffdad9]/60 hover:bg-[#ffdad9] text-[#b6152e] text-xs font-mono font-bold border border-[#ffb3b2]"
                      >
                        <Play className="w-3 h-3" />
                        <span>{formatTimeWithMillis(cue.startTime)} ➔ {formatTimeWithMillis(cue.endTime)}</span>
                      </button>
                    </div>

                    {/* Timestamp Micro-Adjusters & Split/Merge Actions */}
                    <div className="flex items-center gap-1 font-heading">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAdjustTiming(cue.id, 'startTime', -0.2);
                        }}
                        title="-0.2s Start"
                        className="px-1.5 py-0.5 rounded bg-[#eff4ff] hover:bg-[#dde9ff] text-[#45464e] text-[10px] font-mono border border-[#cddbf2]"
                      >
                        -0.2
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAdjustTiming(cue.id, 'endTime', 0.2);
                        }}
                        title="+0.2s End"
                        className="px-1.5 py-0.5 rounded bg-[#eff4ff] hover:bg-[#dde9ff] text-[#45464e] text-[10px] font-mono border border-[#cddbf2]"
                      >
                        +0.2
                      </button>

                      {/* Split Cue */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSplitCue(cue);
                        }}
                        title={t('splitCueBtn')}
                        className="p-1 rounded bg-[#eff4ff] hover:bg-[#dde9ff] text-[#703700] border border-[#ffb783] ml-1"
                      >
                        <Split className="w-3.5 h-3.5 text-[#e07a1e]" />
                      </button>

                      {/* Merge with next */}
                      {idx < subtitles.length - 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMergeCue(idx);
                          }}
                          title={t('mergeCueBtn')}
                          className="p-1 rounded bg-[#eff4ff] hover:bg-[#dde9ff] text-[#1b2a4a] border border-[#cddbf2]"
                        >
                          <Merge className="w-3.5 h-3.5 text-[#1b2a4a]" />
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCue(cue.id);
                        }}
                        title={t('deleteCueBtn')}
                        className="p-1 rounded bg-[#eff4ff] hover:bg-[#ffdad9] text-[#75777f] hover:text-[#b6152e] border border-[#cddbf2]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Bilingual Input Fields */}
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-[#b6152e] tracking-wider block mb-1">
                        🇳🇵 {t('nepaliSubtitle')}
                      </label>
                      <textarea
                        rows={2}
                        value={cue.nepaliText}
                        onChange={(e) => handleUpdateCueText(cue.id, 'nepaliText', e.target.value)}
                        className="w-full p-2.5 bg-[#f8f9ff] border border-[#c5c6cf] rounded-xl text-xs text-[#0f1c2d] focus:outline-none focus:ring-2 focus:ring-[#1b2a4a]/20 leading-relaxed font-bilingual"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-[#45464e] tracking-wider block mb-1">
                        🇬🇧 {t('englishSubtitle')}
                      </label>
                      <textarea
                        rows={2}
                        value={cue.englishText}
                        onChange={(e) => handleUpdateCueText(cue.id, 'englishText', e.target.value)}
                        className="w-full p-2.5 bg-[#f8f9ff] border border-[#c5c6cf] rounded-xl text-xs text-[#0f1c2d] focus:outline-none focus:ring-2 focus:ring-[#1b2a4a]/20 leading-relaxed font-bilingual"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
