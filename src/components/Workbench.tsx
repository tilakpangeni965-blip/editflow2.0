import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Project, SubtitleCue, ExamLessonPack } from '../types';
import { formatTime, formatFileSize, toNepaliNumerals } from '../utils/formatters';
import { AudioProcessorView } from './AudioProcessorView';
import { SubtitleEditorView } from './SubtitleEditorView';
import { ExamLessonPackView } from './ExamLessonPackView';
import { DownloadManagerView } from './DownloadManagerView';
import {
  ArrowLeft,
  Scissors,
  Subtitles,
  BookOpen,
  Download,
  GraduationCap,
  Clock,
  Sparkles,
  Video,
} from 'lucide-react';

interface WorkbenchProps {
  project: Project;
  onBack: () => void;
  onUpdateProject: (updated: Partial<Project>) => void;
  onOpenAiEditor?: (text: string, title: string, instruction: string) => void;
}

export const Workbench: React.FC<WorkbenchProps> = ({
  project,
  onBack,
  onUpdateProject,
  onOpenAiEditor,
}) => {

  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'audio' | 'subtitles' | 'exam' | 'downloads'>('audio');

  const getExamBadge = (exam: Project['targetExam']) => {
    switch (exam) {
      case 'SEE':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ffdad9] text-[#b6152e] border border-[#ffb3b2]">SEE (कक्षा १०)</span>;
      case 'NEB_11_12':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#d9e2ff] text-[#1b2a4a] border border-[#b7c6ee]">NEB (+२)</span>;
      case 'LOK_SEWA':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ffdcc5] text-[#703700] border border-[#ffb783]">लोक सेवा (Lok Sewa)</span>;
      case 'IOE_ENTRANCE':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#e6eeff] text-[#1b2a4a] border border-[#cddbf2]">IOE Engineering</span>;
      case 'CEE_MEDICAL':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">CEE Medical</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-[#45464e] border border-slate-200">Academic</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Project Top Bar */}
      <div className="p-6 rounded-3xl bg-white border border-[#dde9ff] shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              onClick={onBack}
              className="mt-1 p-2 rounded-xl bg-[#eff4ff] hover:bg-[#dde9ff] text-[#1b2a4a] border border-[#cddbf2] transition-colors"
              title={t('back')}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                {getExamBadge(project.targetExam)}
                <span className="text-xs text-[#b6152e] font-semibold px-2 py-0.5 rounded bg-[#ffdad9]/40 border border-[#ffb3b2]">
                  {project.subject}
                </span>
                <span className="text-xs text-[#45464e]">
                  {formatFileSize(project.fileSizeBytes, language)}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#0f1c2d] tracking-tight font-heading">
                {project.title}
              </h1>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="bg-[#f8f9ff] px-3.5 py-2 rounded-xl border border-[#dde9ff] text-[#0f1c2d]">
              <span className="text-[#75777f] block text-[10px] font-sans font-medium">{t('probeDuration')}</span>
              <span className="font-bold text-[#0f1c2d]">{formatTime(project.mediaDuration, language)}</span>
            </div>
            <div className="bg-[#f8f9ff] px-3.5 py-2 rounded-xl border border-[#dde9ff] text-[#0f1c2d]">
              <span className="text-[#75777f] block text-[10px] font-sans font-medium">{t('savedTime')}</span>
              <span className="font-bold text-[#b6152e]">
                -{language === 'ne' ? toNepaliNumerals(project.trimmedPauseSeconds) : project.trimmedPauseSeconds}s
              </span>
            </div>
            <div className="bg-[#f8f9ff] px-3.5 py-2 rounded-xl border border-[#dde9ff] text-[#0f1c2d]">
              <span className="text-[#75777f] block text-[10px] font-sans font-medium">Subtitles</span>
              <span className="font-bold text-[#e07a1e]">
                {language === 'ne' ? toNepaliNumerals(project.subtitles.length) : project.subtitles.length} cues
              </span>
            </div>
          </div>
        </div>

        {/* 4 Main Action Tabs */}
        <div className="flex items-center gap-2 border-t border-[#e2e8f0] pt-4 overflow-x-auto pb-1 scrollbar-none font-heading">
          <button
            onClick={() => setActiveTab('audio')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'audio'
                ? 'bg-[#1b2a4a] text-white shadow-md shadow-[#1b2a4a]/20'
                : 'bg-[#eff4ff] text-[#45464e] hover:text-[#0f1c2d] hover:bg-[#dde9ff] border border-[#cddbf2]'
            }`}
          >
            <Scissors className="w-4 h-4 text-[#ffdcc5]" />
            <span>{t('tabAudioClean')}</span>
          </button>

          <button
            onClick={() => setActiveTab('subtitles')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'subtitles'
                ? 'bg-[#1b2a4a] text-white shadow-md shadow-[#1b2a4a]/20'
                : 'bg-[#eff4ff] text-[#45464e] hover:text-[#0f1c2d] hover:bg-[#dde9ff] border border-[#cddbf2]'
            }`}
          >
            <Subtitles className="w-4 h-4 text-[#ffdad9]" />
            <span>{t('tabSubtitles')}</span>
          </button>

          <button
            onClick={() => setActiveTab('exam')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'exam'
                ? 'bg-[#1b2a4a] text-white shadow-md shadow-[#1b2a4a]/20'
                : 'bg-[#eff4ff] text-[#45464e] hover:text-[#0f1c2d] hover:bg-[#dde9ff] border border-[#cddbf2]'
            }`}
          >
            <BookOpen className="w-4 h-4 text-[#b7c6ee]" />
            <span>{t('tabExamPrep')}</span>
          </button>

          <button
            onClick={() => setActiveTab('downloads')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'downloads'
                ? 'bg-[#1b2a4a] text-white shadow-md shadow-[#1b2a4a]/20'
                : 'bg-[#eff4ff] text-[#45464e] hover:text-[#0f1c2d] hover:bg-[#dde9ff] border border-[#cddbf2]'
            }`}
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{t('tabDownloads')}</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'audio' && (
        <AudioProcessorView
          project={project}
          onUpdateProject={onUpdateProject}
        />
      )}

      {activeTab === 'subtitles' && (
        <SubtitleEditorView
          project={project}
          onUpdateSubtitles={(subtitles: SubtitleCue[]) => onUpdateProject({ subtitles })}
          onEditWithAi={onOpenAiEditor}
        />
      )}

      {activeTab === 'exam' && (
        <ExamLessonPackView
          project={project}
          onUpdateLessonPack={(lessonPack: ExamLessonPack) => onUpdateProject({ lessonPack })}
        />
      )}

      {activeTab === 'downloads' && (
        <DownloadManagerView project={project} />
      )}
    </div>
  );
};
