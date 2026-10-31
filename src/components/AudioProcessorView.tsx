import React, { useState, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Project, SilenceSegment } from '../types';
import { formatTime, toNepaliNumerals } from '../utils/formatters';
import {
  Volume2,
  Scissors,
  Play,
  Pause,
  Check,
  Sparkles,
  AudioWaveform,
} from 'lucide-react';

interface AudioProcessorViewProps {
  project: Project;
  onUpdateProject: (updated: Partial<Project>) => void;
}

export const AudioProcessorView: React.FC<AudioProcessorViewProps> = ({
  project,
  onUpdateProject,
}) => {
  const { language, t } = useLanguage();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [pauseRemovalEnabled, setPauseRemovalEnabled] = useState(
    project.audioSettings.pauseRemovalEnabled ?? true
  );
  const [minSilenceDuration, setMinSilenceDuration] = useState(
    project.audioSettings.minSilenceDuration ?? 2.0
  );
  const [silenceThresholdDb, setSilenceThresholdDb] = useState(
    project.audioSettings.silenceThresholdDb ?? -40
  );
  const [normalizationEnabled, setNormalizationEnabled] = useState(
    project.audioSettings.soundNormalizationEnabled ?? true
  );
  const [targetLufs, setTargetLufs] = useState(
    project.audioSettings.targetLufs ?? -14
  );
  const [isSaved, setIsSaved] = useState(false);

  // Recalculate dynamic statistics based on threshold
  const detectedSilences: SilenceSegment[] = project.detectedSilences.filter(
    (s) => s.duration >= minSilenceDuration
  );
  const trimmedSeconds = detectedSilences.reduce((acc, s) => acc + s.duration, 0);

  const handlePlayToggle = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleApplyChanges = () => {
    onUpdateProject({
      audioSettings: {
        pauseRemovalEnabled,
        minSilenceDuration,
        silenceThresholdDb,
        soundNormalizationEnabled: normalizationEnabled,
        targetLufs,
        gainAdjustmentDb: Math.abs(targetLufs - project.originalLoudnessDb),
      },
      trimmedPauseSeconds: pauseRemovalEnabled ? parseFloat(trimmedSeconds.toFixed(1)) : 0,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-6 font-bilingual">
      {/* Hidden audio element for preview */}
      <audio
        ref={audioRef}
        src={project.mediaFileUrl}
        onTimeUpdate={(e) => setCurrentTime((e.target as HTMLAudioElement).currentTime)}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Top Banner Overview */}
      <div className="p-6 rounded-3xl bg-white border border-[#dde9ff] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-xl bg-[#ffdcc5] text-[#703700] border border-[#ffb783] flex items-center justify-center">
              <Scissors className="w-4 h-4" />
            </span>
            <h3 className="text-lg font-bold text-[#0f1c2d] font-heading">
              {t('audioCleanTitle')}
            </h3>
          </div>
          <p className="text-xs text-[#45464e] max-w-xl leading-relaxed">
            {t('audioCleanSub')}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto font-heading">
          <button
            onClick={handlePlayToggle}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#eff4ff] hover:bg-[#dde9ff] text-[#1b2a4a] text-xs font-semibold border border-[#cddbf2] transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4 text-[#b6152e]" /> : <Play className="w-4 h-4 text-emerald-600" />}
            <span>{isPlaying ? 'पज गर्नुहोस् (Pause)' : 'अडियो सुन्नुहोस् (Listen)'}</span>
          </button>
          <button
            onClick={handleApplyChanges}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#b6152e] hover:bg-[#92001f] text-white text-xs font-semibold shadow-md shadow-[#b6152e]/30 transition-all active:scale-95"
          >
            {isSaved ? <Check className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4" />}
            <span>{isSaved ? t('audioFixedSuccess') : t('applyAudioFixes')}</span>
          </button>
        </div>
      </div>

      {/* Visual Waveform & Silence Detection Bar */}
      <div className="p-6 rounded-3xl bg-white border border-[#dde9ff] shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AudioWaveform className="w-4 h-4 text-[#1b2a4a]" />
            <span className="text-sm font-bold text-[#0f1c2d] font-heading">
              {language === 'ne' ? 'अडियो वेभफर्म तथा मौनता म्याप' : 'Audio Waveform & Pause Detection Map'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500" />
              <span className="text-[#45464e]">{t('speechSegments')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#b6152e]" />
              <span className="text-[#45464e]">{t('silenceSegments')}</span>
            </div>
            <span className="text-[#0f1c2d] font-mono font-bold bg-[#eff4ff] px-2.5 py-0.5 rounded-lg border border-[#dde9ff]">
              {formatTime(currentTime, language)} / {formatTime(project.mediaDuration, language)}
            </span>
          </div>
        </div>

        {/* High-Contrast Waveform Visualizer */}
        <div className="relative h-28 bg-[#041534] rounded-2xl p-3 border border-[#1b2a4a] flex items-end gap-[2px] overflow-hidden select-none shadow-inner">
          {Array.from({ length: 90 }).map((_, idx) => {
            const timeAtBar = (idx / 90) * project.mediaDuration;
            const isSilence = detectedSilences.some(
              (s) => timeAtBar >= s.start && timeAtBar <= s.end
            );
            const baseHeight = isSilence
              ? 8
              : Math.max(18, Math.min(95, Math.floor(25 + 65 * Math.abs(Math.sin(idx * 0.4) * Math.cos(idx * 0.15)))));

            const isCurrent = Math.abs(currentTime - timeAtBar) < 3;

            return (
              <div
                key={idx}
                title={`${formatTime(timeAtBar, language)} - ${isSilence ? 'Silence' : 'Speech'}`}
                onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.currentTime = timeAtBar;
                    setCurrentTime(timeAtBar);
                  }
                }}
                className={`flex-1 rounded-full cursor-pointer transition-all duration-150 ${
                  isSilence
                    ? 'bg-[#b6152e] hover:bg-[#d93343]'
                    : isCurrent
                    ? 'bg-white shadow-[0_0_8px_#ffffff]'
                    : 'bg-emerald-400 hover:bg-emerald-300'
                }`}
                style={{ height: `${baseHeight}%` }}
              />
            );
          })}

          {/* Current playhead line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-[#ffdcc5] shadow-[0_0_6px_#ffdcc5] pointer-events-none transition-all duration-100"
            style={{
              left: `${Math.min(100, (currentTime / (project.mediaDuration || 1)) * 100)}%`,
            }}
          />
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-[#eff4ff] border border-[#dde9ff]">
            <span className="text-[11px] text-[#45464e] block mb-0.5 font-medium">{t('detectedPauses')}</span>
            <span className="text-lg font-bold text-[#e07a1e] font-mono">
              {language === 'ne' ? toNepaliNumerals(detectedSilences.length) : detectedSilences.length}{' '}
              <span className="text-xs text-[#75777f] font-normal">{language === 'ne' ? 'स्थान' : 'pauses'}</span>
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#eff4ff] border border-[#dde9ff]">
            <span className="text-[11px] text-[#45464e] block mb-0.5 font-medium">{t('savedTime')}</span>
            <span className="text-lg font-bold text-emerald-600 font-mono">
              -{language === 'ne' ? toNepaliNumerals(trimmedSeconds.toFixed(1)) : trimmedSeconds.toFixed(1)}{' '}
              <span className="text-xs text-[#75777f] font-normal">{t('seconds')}</span>
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#eff4ff] border border-[#dde9ff]">
            <span className="text-[11px] text-[#45464e] block mb-0.5 font-medium">{t('originalLoudness')}</span>
            <span className="text-lg font-bold text-[#0f1c2d] font-mono">
              {project.originalLoudnessDb} dB RMS
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#eff4ff] border border-[#dde9ff]">
            <span className="text-[11px] text-[#45464e] block mb-0.5 font-medium">{t('normalizedLoudness')}</span>
            <span className="text-lg font-bold text-[#1b2a4a] font-mono">
              {targetLufs} LUFS
            </span>
          </div>
        </div>
      </div>

      {/* Adjustments & Fine-Tuning Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Silence Removal Sliders */}
        <div className="p-6 rounded-3xl bg-white border border-[#dde9ff] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#0f1c2d] flex items-center gap-2 font-heading">
              <Scissors className="w-4 h-4 text-[#e07a1e]" />
              <span>{t('pauseCutLabel')}</span>
            </h4>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={pauseRemovalEnabled}
                onChange={(e) => setPauseRemovalEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-[#c5c6cf] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#b6152e]"></div>
            </label>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs text-[#0f1c2d] mb-1.5 font-medium">
                <span>{t('minPauseThreshold')}</span>
                <span className="font-mono text-[#b6152e] font-bold">
                  {minSilenceDuration} {t('seconds')}
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="4.0"
                step="0.2"
                value={minSilenceDuration}
                onChange={(e) => setMinSilenceDuration(parseFloat(e.target.value))}
                className="w-full accent-[#b6152e] h-2 bg-[#eff4ff] rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-[#75777f] mt-1.5 leading-relaxed">
                {language === 'ne'
                  ? 'शिक्षकले बोर्डमा लेख्दा वा सोच्दा भएको २ सेकेन्ड भन्दा लामो मौनता स्वतः हट्छ।'
                  : 'Trims awkward dead classroom air longer than this duration.'}
              </p>
            </div>

            <div>
              <div className="flex justify-between text-xs text-[#0f1c2d] mb-1.5 font-medium">
                <span>{language === 'ne' ? 'आवाजको मौनता सीमा (Silence Threshold):' : 'Silence dB Threshold:'}</span>
                <span className="font-mono text-[#1b2a4a] font-bold">{silenceThresholdDb} dB</span>
              </div>
              <input
                type="range"
                min="-50"
                max="-30"
                step="1"
                value={silenceThresholdDb}
                onChange={(e) => setSilenceThresholdDb(parseInt(e.target.value, 10))}
                className="w-full accent-[#1b2a4a] h-2 bg-[#eff4ff] rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Loudness Normalization Sliders */}
        <div className="p-6 rounded-3xl bg-white border border-[#dde9ff] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#0f1c2d] flex items-center gap-2 font-heading">
              <Volume2 className="w-4 h-4 text-emerald-600" />
              <span>{t('normalizationLabel')}</span>
            </h4>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={normalizationEnabled}
                onChange={(e) => setNormalizationEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-[#c5c6cf] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs text-[#0f1c2d] mb-1.5 font-medium">
                <span>{t('targetLufsLabel')}</span>
                <span className="font-mono text-emerald-700 font-bold">{targetLufs} LUFS</span>
              </div>
              <input
                type="range"
                min="-20"
                max="-12"
                step="1"
                value={targetLufs}
                onChange={(e) => setTargetLufs(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-600 h-2 bg-[#eff4ff] rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-[#75777f] mt-1.5 leading-relaxed">
                {language === 'ne'
                  ? 'युट्युब, जुम तथा अनलाइन कक्षाका लागि -१४ LUFS अन्तर्राष्ट्रिय मानक हो।'
                  : '-14 LUFS is the global broadcast standard for educational YouTube & mobile listening.'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#eff4ff] border border-[#dde9ff] text-xs flex items-center justify-between">
              <span className="text-[#45464e] font-medium">{t('gainBoost')}</span>
              <span className="font-mono font-bold text-[#b6152e]">
                +{Math.abs(targetLufs - project.originalLoudnessDb).toFixed(1)} dB
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
