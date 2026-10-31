import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Project } from '../types';
import { formatTime, formatFileSize, toNepaliNumerals } from '../utils/formatters';
import {
  Film,
  Upload,
  Search,
  Filter,
  Scissors,
  Subtitles,
  Trash2,
  Calendar,
  Lock,
  Sparkles,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onOpenUpload: () => void;
  onDeleteProject: (projectId: string) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  onSelectProject,
  onOpenUpload,
  onDeleteProject,
}) => {
  const { language, t } = useLanguage();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedExam, setSelectedExam] = useState<string>('ALL');

  const filtered = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.subject.toLowerCase().includes(search.toLowerCase());
    const matchesExam = selectedExam === 'ALL' || p.targetExam === selectedExam;
    return matchesSearch && matchesExam;
  });

  const getExamBadge = (exam: Project['targetExam']) => {
    switch (exam) {
      case 'SEE':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#ffdad9] text-[#b6152e] border border-[#ffb3b2]/60">
            SEE (कक्षा १०)
          </span>
        );
      case 'NEB_11_12':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#d9e2ff] text-[#1b2a4a] border border-[#b7c6ee]">
            NEB (+२ विज्ञान/व्यवस्थापन)
          </span>
        );
      case 'LOK_SEWA':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#ffdcc5] text-[#703700] border border-[#ffb783]">
            लोक सेवा आयोग (Lok Sewa)
          </span>
        );
      case 'IOE_ENTRANCE':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#e6eeff] text-[#1b2a4a] border border-[#cddbf2]">
            IOE इन्जिनियरिङ प्रवेश
          </span>
        );
      case 'CEE_MEDICAL':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            CEE मेडिकल प्रवेश
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-[#45464e] border border-slate-200">
            शैक्षिक पाठ
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Institutional Overview */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#1b2a4a] text-white shadow-xl border border-[#041534] relative overflow-hidden">
        {/* Subtle decorative mountain-inspired backdrop */}
        <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-[#243143]/40 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-[#b6152e]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 rounded-xl bg-white/10 text-[#ffdad9] border border-white/20 flex items-center justify-center">
                <Film className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-[#b7c6ee] uppercase tracking-wider font-heading">
                {user?.instituteName || 'ShikshyaStudio Nepal'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-heading">
              {t('myLecturesTitle')}
            </h1>
            <p className="text-xs sm:text-sm text-[#cddbf2] mt-1 max-w-xl font-bilingual leading-relaxed">
              {t('myLecturesSub')}
            </p>
          </div>

          <button
            onClick={onOpenUpload}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#b6152e] hover:bg-[#92001f] text-white font-bold text-sm shadow-lg shadow-[#041534]/50 transition-all active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>{t('newLectureBtn')}</span>
          </button>
        </div>

        {/* Private Data Isolation Assurance Note */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-[#cddbf2] font-bilingual">
          <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{t('privacyNotice')}</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#dde9ff] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-[#75777f]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 bg-[#f8f9ff] border border-[#c5c6cf] rounded-xl text-xs text-[#0f1c2d] placeholder-[#75777f] focus:outline-none focus:ring-2 focus:ring-[#1b2a4a]/20"
          />
        </div>

        {/* Exam Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          {['ALL', 'SEE', 'NEB_11_12', 'LOK_SEWA', 'IOE_ENTRANCE', 'CEE_MEDICAL'].map((examKey) => {
            const isSelected = selectedExam === examKey;
            let label = t('filterAll');
            if (examKey === 'SEE') label = 'SEE';
            if (examKey === 'NEB_11_12') label = 'NEB +2';
            if (examKey === 'LOK_SEWA') label = 'Lok Sewa';
            if (examKey === 'IOE_ENTRANCE') label = 'IOE';
            if (examKey === 'CEE_MEDICAL') label = 'CEE';

            return (
              <button
                key={examKey}
                onClick={() => setSelectedExam(examKey)}
                className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-[#1b2a4a] text-white shadow-sm'
                    : 'bg-[#eff4ff] text-[#45464e] hover:text-[#0f1c2d] hover:bg-[#e6eeff]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Projects Grid */}
      {filtered.length === 0 ? (
        <div className="py-16 px-6 text-center rounded-3xl bg-white border-2 border-dashed border-[#dde9ff] space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-[#eff4ff] text-[#1b2a4a] flex items-center justify-center">
            <Film className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0f1c2d]">
              {t('noProjectsYet')}
            </h3>
            <p className="text-xs text-[#45464e] mt-1 max-w-sm mx-auto font-bilingual">
              {t('startFirstLecture')}
            </p>
          </div>
          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#b6152e] hover:bg-[#92001f] text-white text-xs font-semibold shadow-md transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>{t('newLectureBtn')}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((proj) => (
            <div
              key={proj.id}
              onClick={() => onSelectProject(proj)}
              className="p-5 rounded-3xl bg-white border border-[#dde9ff] hover:border-[#1b2a4a] hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Card Top: Badges & Delete */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    {getExamBadge(proj.targetExam)}
                    <span className="text-[11px] font-semibold text-[#45464e] truncate max-w-[120px]">
                      {proj.subject}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(language === 'ne' ? 'के तपाईं यो प्रोजेक्ट हटाउन निश्चित हुनुहुन्छ?' : 'Delete this project?')) {
                        onDeleteProject(proj.id);
                      }
                    }}
                    title={t('delete')}
                    className="p-1.5 rounded-lg text-[#75777f] hover:text-[#b6152e] hover:bg-[#ffdad9]/40 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-[#0f1c2d] group-hover:text-[#b6152e] transition-colors line-clamp-2 leading-snug font-heading">
                  {proj.title}
                </h3>

                <p className="text-xs text-[#45464e] mt-2 line-clamp-2 leading-relaxed font-bilingual">
                  {proj.lessonPack.summaryNepali || proj.lessonPack.summaryEnglish}
                </p>
              </div>

              {/* Metrics & Footer */}
              <div className="pt-3 border-t border-[#e2e8f0] space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center text-[#0f1c2d] font-mono text-xs">
                  <div className="bg-[#f8f9ff] p-2 rounded-xl border border-[#dde9ff]">
                    <span className="text-[10px] text-[#45464e] block">समय</span>
                    <span className="font-bold text-[#0f1c2d]">{formatTime(proj.mediaDuration, language)}</span>
                  </div>

                  <div className="bg-[#f8f9ff] p-2 rounded-xl border border-[#dde9ff]">
                    <span className="text-[10px] text-[#45464e] block">पज कट</span>
                    <span className="font-bold text-[#b6152e]">
                      -{language === 'ne' ? toNepaliNumerals(proj.trimmedPauseSeconds) : proj.trimmedPauseSeconds}s
                    </span>
                  </div>

                  <div className="bg-[#f8f9ff] p-2 rounded-xl border border-[#dde9ff]">
                    <span className="text-[10px] text-[#45464e] block">उपशीर्षक</span>
                    <span className="font-bold text-[#e07a1e]">
                      {language === 'ne' ? toNepaliNumerals(proj.subtitles.length) : proj.subtitles.length}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[#45464e] pt-1">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-[#75777f]" />
                    <span>{new Date(proj.createdAt).toLocaleDateString('ne-NP')}</span>
                  </span>
                  <span className="text-[#b6152e] font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-heading text-xs">
                    <span>{language === 'ne' ? 'कार्यशाला खोल्नुहोस्' : 'Open Workbench'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
