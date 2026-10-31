import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Project, ExamLessonPack, ModelQuestion } from '../types';
import { toNepaliNumerals } from '../utils/formatters';
import { generateLessonPackMarkdown } from '../utils/audioHelper';
import {
  BookOpen,
  Sparkles,
  HelpCircle,
  FileCheck,
  Download,
  RotateCw,
  Lightbulb,
  CheckCircle2,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ExamLessonPackViewProps {
  project: Project;
  onUpdateLessonPack: (pack: ExamLessonPack) => void;
}

export const ExamLessonPackView: React.FC<ExamLessonPackViewProps> = ({
  project,
  onUpdateLessonPack,
}) => {
  const { language, t } = useLanguage();
  const { token } = useAuth();

  const [activeTab, setActiveTab] = useState<'summary' | 'points' | 'formulas' | 'questions' | 'flashcards'>('questions');
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(project.lessonPack.practiceQuestions[0]?.id || null);
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
  const [activeFlashcardIndex, setActiveFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const lessonPack = project.lessonPack;

  const toggleAnswer = (id: string) => {
    setRevealedAnswers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRegenerateWithAI = async () => {
    setIsRegenerating(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/generate-ai-pack`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetExam: project.targetExam,
          subject: project.subject,
          topicTitle: project.title,
        }),
      });
      const data = await res.json();
      if (data.lessonPack) {
        onUpdateLessonPack(data.lessonPack);
      }
    } catch (err) {
      console.error('Failed to regenerate lesson pack:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDownloadNotes = () => {
    const md = generateLessonPackMarkdown(lessonPack);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title}_Exam_Prep_Pack.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 font-bilingual">
      {/* Top Header Card */}
      <div className="p-6 rounded-3xl bg-white border border-[#dde9ff] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-xl bg-[#d9e2ff] text-[#1b2a4a] border border-[#b7c6ee] flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </span>
            <h3 className="text-lg font-bold text-[#0f1c2d] font-heading">
              {t('examPackTitle')}
            </h3>
          </div>
          <p className="text-xs text-[#45464e] leading-relaxed">
            {t('examPackSub')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 font-heading">
          <button
            onClick={handleRegenerateWithAI}
            disabled={isRegenerating}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#eff4ff] hover:bg-[#dde9ff] text-[#1b2a4a] border border-[#cddbf2] text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin text-[#b6152e]' : ''}`} />
            <span>{isRegenerating ? t('loading') : t('regenerateLessonPack')}</span>
          </button>

          <button
            onClick={handleDownloadNotes}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#b6152e] hover:bg-[#92001f] text-white text-xs font-semibold shadow-md shadow-[#b6152e]/30 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{language === 'ne' ? 'नोट्स डाउनलोड (.TXT)' : 'Download Notes'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#dde9ff] overflow-x-auto pb-2 scrollbar-none text-xs font-heading">
        <button
          onClick={() => setActiveTab('questions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all shrink-0 ${
            activeTab === 'questions'
              ? 'bg-[#1b2a4a] text-white shadow-sm'
              : 'text-[#45464e] hover:text-[#0f1c2d] hover:bg-[#eff4ff]'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-[#ffdad9]" />
          <span>{t('questionsTab')}</span>
        </button>

        <button
          onClick={() => setActiveTab('summary')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all shrink-0 ${
            activeTab === 'summary'
              ? 'bg-[#1b2a4a] text-white shadow-sm'
              : 'text-[#45464e] hover:text-[#0f1c2d] hover:bg-[#eff4ff]'
          }`}
        >
          <FileCheck className="w-4 h-4 text-[#b7c6ee]" />
          <span>{t('summaryTab')}</span>
        </button>

        <button
          onClick={() => setActiveTab('points')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all shrink-0 ${
            activeTab === 'points'
              ? 'bg-[#1b2a4a] text-white shadow-sm'
              : 'text-[#45464e] hover:text-[#0f1c2d] hover:bg-[#eff4ff]'
          }`}
        >
          <Lightbulb className="w-4 h-4 text-[#ffdcc5]" />
          <span>{t('highYieldTab')}</span>
        </button>

        <button
          onClick={() => setActiveTab('formulas')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all shrink-0 ${
            activeTab === 'formulas'
              ? 'bg-[#1b2a4a] text-white shadow-sm'
              : 'text-[#45464e] hover:text-[#0f1c2d] hover:bg-[#eff4ff]'
          }`}
        >
          <BookOpen className="w-4 h-4 text-[#d6e3fb]" />
          <span>{t('formulasTab')}</span>
        </button>

        <button
          onClick={() => setActiveTab('flashcards')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all shrink-0 ${
            activeTab === 'flashcards'
              ? 'bg-[#1b2a4a] text-white shadow-sm'
              : 'text-[#45464e] hover:text-[#0f1c2d] hover:bg-[#eff4ff]'
          }`}
        >
          <Layers className="w-4 h-4 text-[#ffdcc5]" />
          <span>{t('flashcardsTab')}</span>
        </button>
      </div>

      {/* 1. MODEL QUESTIONS TAB */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          {lessonPack.practiceQuestions.map((q) => {
            const isExpanded = expandedQuestionId === q.id;
            const isAnswerRevealed = !!revealedAnswers[q.id];

            return (
              <div
                key={q.id}
                className="p-5 rounded-3xl bg-white border border-[#dde9ff] shadow-sm space-y-3.5 transition-all"
              >
                <div
                  onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                  className="flex items-start justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-xl bg-[#ffdad9] text-[#b6152e] font-bold text-xs flex items-center justify-center shrink-0 border border-[#ffb3b2]">
                      {language === 'ne' ? toNepaliNumerals(q.questionNumber) : q.questionNumber}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-[#0f1c2d] leading-snug font-heading">
                        {q.questionNepali}
                      </h4>
                      <p className="text-xs text-[#45464e] mt-0.5">
                        {q.questionEnglish}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="px-2.5 py-1 rounded-full bg-[#eff4ff] border border-[#dde9ff] text-[11px] font-bold text-[#b6152e]">
                      {t('marksUnit')} {language === 'ne' ? toNepaliNumerals(q.marks) : q.marks}
                    </span>
                    <button className="p-1 rounded-lg text-[#75777f] hover:text-[#0f1c2d]">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="pt-3 border-t border-[#e2e8f0] space-y-3 text-xs animate-in fade-in duration-100">
                    {/* MCQ Options if available */}
                    {q.options && (
                      <div className="space-y-2 p-3.5 rounded-2xl bg-[#f8f9ff] border border-[#dde9ff]">
                        <p className="text-[11px] font-bold text-[#45464e]">विकल्पहरू (Options):</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.nepali.map((opt, oIdx) => {
                            const isCorrect = oIdx === q.options?.correctIndex;
                            return (
                              <div
                                key={oIdx}
                                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                                  isAnswerRevealed && isCorrect
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                    : 'bg-white border-[#dde9ff] text-[#0f1c2d]'
                                }`}
                              >
                                <span>
                                  <strong className="text-[#b6152e] mr-2">{String.fromCharCode(65 + oIdx)})</strong>
                                  {opt}
                                </span>
                                {isAnswerRevealed && isCorrect && (
                                  <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-bold">
                                    ✓ सही उत्तर
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Examiner Tip */}
                    <div className="p-3.5 rounded-2xl bg-[#ffdcc5]/40 border border-[#ffdcc5] text-[#703700] flex items-start gap-2.5">
                      <Lightbulb className="w-4 h-4 text-[#e07a1e] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-[11px] block">{t('examTipTitle')}</span>
                        <p className="text-xs text-[#703700] leading-relaxed">{q.examTip}</p>
                      </div>
                    </div>

                    {/* Reveal Model Answer Toggle */}
                    <div className="pt-1">
                      <button
                        onClick={() => toggleAnswer(q.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#eff4ff] hover:bg-[#dde9ff] text-[#1b2a4a] text-xs font-semibold border border-[#cddbf2] transition-colors"
                      >
                        {isAnswerRevealed ? t('hideAnswer') : t('showAnswer')}
                      </button>

                      {isAnswerRevealed && (
                        <div className="mt-3 p-4 rounded-2xl bg-[#f8f9ff] border border-[#dde9ff] space-y-2">
                          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 font-heading">
                            <CheckCircle2 className="w-4 h-4" />
                            {t('modelAnswerTitle')}
                          </span>
                          <p className="text-xs text-[#0f1c2d] leading-relaxed whitespace-pre-line font-medium">
                            {q.modelAnswerNepali}
                          </p>
                          <p className="text-[11px] text-[#45464e] italic pt-1 border-t border-[#e2e8f0]">
                            {q.modelAnswerEnglish}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 2. SUMMARY TAB */}
      {activeTab === 'summary' && (
        <div className="p-6 rounded-3xl bg-white border border-[#dde9ff] shadow-sm space-y-6 leading-relaxed">
          <div>
            <h4 className="text-sm font-bold text-[#b6152e] uppercase tracking-wider mb-2 font-heading">
              🇳🇵 पाठको सारांश (Nepali Summary)
            </h4>
            <p className="text-sm text-[#0f1c2d] whitespace-pre-line leading-relaxed">
              {lessonPack.summaryNepali}
            </p>
          </div>

          <div className="pt-4 border-t border-[#e2e8f0]">
            <h4 className="text-sm font-bold text-[#45464e] uppercase tracking-wider mb-2 font-heading">
              🇬🇧 English Synopsis
            </h4>
            <p className="text-sm text-[#45464e] whitespace-pre-line leading-relaxed">
              {lessonPack.summaryEnglish}
            </p>
          </div>
        </div>
      )}

      {/* 3. HIGH-YIELD POINTS TAB */}
      {activeTab === 'points' && (
        <div className="p-6 rounded-3xl bg-white border border-[#dde9ff] shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-[#703700] flex items-center gap-2 mb-3 font-heading">
            <Lightbulb className="w-4 h-4 text-[#e07a1e]" />
            <span>बोर्ड परीक्षाका लागि आवश्यक मुख्य बुँदाहरू (High-Yield Board Points)</span>
          </h4>
          <div className="space-y-3">
            {lessonPack.highYieldPointsNepali.map((point, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-[#f8f9ff] border border-[#dde9ff] flex items-start gap-3"
              >
                <span className="w-5 h-5 rounded-full bg-[#ffdcc5] text-[#703700] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  ✓
                </span>
                <div className="text-xs space-y-1">
                  <p className="text-[#0f1c2d] font-semibold leading-relaxed">{point}</p>
                  <p className="text-[#45464e] text-[11px] italic">
                    {lessonPack.highYieldPointsEnglish[idx] || ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. FORMULAS & TERMS TAB */}
      {activeTab === 'formulas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lessonPack.keyFormulasOrDefinitions.map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-3xl bg-white border border-[#dde9ff] shadow-sm space-y-2.5"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#ffdad9] text-[#b6152e] text-xs font-bold flex items-center justify-center">
                  ∑
                </span>
                <div>
                  <h4 className="text-xs font-bold text-[#0f1c2d] font-heading">
                    {item.termNepali}
                  </h4>
                  <p className="text-[10px] text-[#45464e]">{item.termEnglish}</p>
                </div>
              </div>
              <p className="text-xs text-[#0f1c2d] bg-[#f8f9ff] p-3 rounded-xl border border-[#dde9ff] leading-relaxed font-mono font-medium">
                {item.definitionNepali}
              </p>
              <p className="text-[11px] text-[#45464e] italic">
                {item.definitionEnglish}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 5. FLASHCARDS TAB */}
      {activeTab === 'flashcards' && lessonPack.flashcards.length > 0 && (
        <div className="max-w-xl mx-auto py-6 space-y-6 text-center">
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="h-64 p-8 rounded-3xl bg-white border-2 border-[#1b2a4a] shadow-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#b6152e] transition-all active:scale-98 relative select-none"
          >
            <span className="absolute top-4 left-4 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#eff4ff] text-[#1b2a4a]">
              {isFlipped ? 'उत्तर (Answer)' : 'प्रश्न (Question)'}
            </span>
            <span className="absolute top-4 right-4 text-xs text-[#75777f] font-mono">
              {activeFlashcardIndex + 1} / {lessonPack.flashcards.length}
            </span>

            <p className="text-base sm:text-lg font-bold text-[#0f1c2d] px-4 leading-relaxed font-heading">
              {isFlipped
                ? lessonPack.flashcards[activeFlashcardIndex].backNepali
                : lessonPack.flashcards[activeFlashcardIndex].frontNepali}
            </p>
            <p className="text-xs text-[#45464e] mt-3 px-4 italic">
              {isFlipped
                ? lessonPack.flashcards[activeFlashcardIndex].backEnglish
                : lessonPack.flashcards[activeFlashcardIndex].frontEnglish}
            </p>

            <span className="absolute bottom-4 text-[11px] text-[#b6152e] font-semibold">
              ↻ {t('flipCard')}
            </span>
          </div>

          <div className="flex items-center justify-center gap-4 font-heading">
            <button
              onClick={() => {
                setIsFlipped(false);
                setActiveFlashcardIndex((prev) => (prev > 0 ? prev - 1 : lessonPack.flashcards.length - 1));
              }}
              className="px-4 py-2 rounded-xl bg-[#eff4ff] hover:bg-[#dde9ff] text-[#1b2a4a] text-xs font-semibold border border-[#cddbf2]"
            >
              ← {t('back')}
            </button>
            <button
              onClick={() => {
                setIsFlipped(false);
                setActiveFlashcardIndex((prev) => (prev < lessonPack.flashcards.length - 1 ? prev + 1 : 0));
              }}
              className="px-4 py-2 rounded-xl bg-[#eff4ff] hover:bg-[#dde9ff] text-[#1b2a4a] text-xs font-semibold border border-[#cddbf2]"
            >
              {t('next')} →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
