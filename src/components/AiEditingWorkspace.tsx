import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { diffWords, Change } from 'diff';
import {
  Sparkles,
  Wand2,
  FileText,
  Upload,
  Copy,
  Check,
  RotateCcw,
  RotateCw,
  Trash2,
  Download,
  Columns,
  GitCompare,
  Eye,
  SlidersHorizontal,
  History,
  BookOpen,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Lock,
  X,
  RefreshCw,
  FileUp,
  FileCheck,
  Layers,
  ArrowLeftRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

interface AiEditingWorkspaceProps {
  initialContent?: string;
  initialTitle?: string;
  initialInstruction?: string;
  onOpenPricing: () => void;
  onBackToProjects?: () => void;
}

interface EditingHistoryRecord {
  id: number;
  userId: string;
  title: string;
  originalContent: string;
  editedContent: string;
  instruction: string;
  selectedMode: string;
  strength: string;
  targetLanguage: string;
  wordCountBefore: number;
  wordCountAfter: number;
  createdAt: string;
  updatedAt: string;
}

interface UsageSummary {
  plan: string;
  isSubscribed: boolean;
  limit: number;
  totalUsed: number;
  remaining: number;
}

export const AiEditingWorkspace: React.FC<AiEditingWorkspaceProps> = ({
  initialContent = '',
  initialTitle = '',
  initialInstruction = '',
  onOpenPricing,
  onBackToProjects,
}) => {
  const { language, t } = useLanguage();
  const { user, token } = useAuth();

  // Core editor state
  const [content, setContent] = useState<string>(initialContent);
  const [editedContent, setEditedContent] = useState<string>('');
  const [instruction, setInstruction] = useState<string>(initialInstruction);
  const [title, setTitle] = useState<string>(initialTitle || (language === 'ne' ? 'नयाँ सम्पादन सत्र' : 'Untitled Document'));
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);

  // Undo / Redo stacks for original content
  const [historyStack, setHistoryStack] = useState<string[]>([initialContent]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Advanced controls
  const [mode, setMode] = useState<string>('proofread');
  const [strength, setStrength] = useState<'light' | 'medium' | 'strong'>('medium');
  const [tone, setTone] = useState<string>('original');
  const [targetLanguage, setTargetLanguage] = useState<string>('original');
  const [viewMode, setViewMode] = useState<'split' | 'diff' | 'editor'>('split');

  // UI state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<boolean>(false);
  const [historyList, setHistoryList] = useState<EditingHistoryRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Update undo stack on manual typing (debounced)
  const handleContentChange = (newVal: string) => {
    setContent(newVal);
    // Push to undo stack
    setHistoryStack((prev) => [...prev.slice(0, historyIndex + 1), newVal]);
    setHistoryIndex((prev) => prev + 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setContent(historyStack[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < historyStack.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setContent(historyStack[newIndex]);
    }
  };

  // Fetch usage and history
  const fetchUsage = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/ai/usage', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsage(data.usage);
      }
    } catch (e) {
      console.warn('Failed to fetch AI usage:', e);
    }
  };

  const fetchHistory = async () => {
    if (!token) return;
    setIsLoadingHistory(true);
    try {
      const res = await fetch('/api/ai/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data.history || []);
      }
    } catch (e) {
      console.warn('Failed to load editing history:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchUsage();
    fetchHistory();
  }, [token]);

  // When initialContent changes from outside (e.g. from transcript)
  useEffect(() => {
    if (initialContent) {
      setContent(initialContent);
      setHistoryStack([initialContent]);
      setHistoryIndex(0);
      if (initialTitle) setTitle(initialTitle);
      if (initialInstruction) setInstruction(initialInstruction);
    }
  }, [initialContent, initialTitle, initialInstruction]);

  // Execute AI Editing
  const handleRunAiEdit = async (customInstructionOverride?: string) => {
    if (!content.trim()) {
      setErrorMessage(language === 'ne' ? 'कृपया सम्पादन गर्नका लागि पाठ लेख्नुहोस् वा फाइल अपलोड गर्नुहोस्।' : 'Please enter or upload text to edit.');
      return;
    }

    setErrorMessage(null);
    setSuccessNotice(null);
    setIsProcessing(true);

    try {
      const res = await fetch('/api/ai/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content,
          instruction: customInstructionOverride !== undefined ? customInstructionOverride : instruction,
          mode,
          strength,
          tone,
          targetLanguage,
          title,
          sessionId: activeSessionId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.limitReached) {
          setErrorMessage(data.error || (language === 'ne' ? 'तपाईंको AI सम्पादन कोटा सकियो। कृपया योजना अपग्रेड गर्नुहोस्।' : 'AI editing quota reached. Please upgrade your plan.'));
          onOpenPricing();
        } else {
          setErrorMessage(data.error || (language === 'ne' ? 'AI सम्पादन प्रक्रिया असफल भयो।' : 'AI editing failed.'));
        }
        return;
      }

      setEditedContent(data.result.editedContent);
      if (data.historyItem) {
        setActiveSessionId(data.historyItem.id);
      }
      if (data.usage) {
        setUsage(data.usage);
      }
      setSuccessNotice(language === 'ne' ? 'AI सम्पादन सफलतापूर्वक सम्पन्न भयो!' : 'AI editing completed successfully!');
      fetchHistory();
    } catch (err: any) {
      setErrorMessage(err.message || 'Server communication error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Upload document (TXT, DOCX, PDF)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingDoc(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('docFile', file);

    try {
      const res = await fetch('/api/ai/extract-document', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to extract document text');
        return;
      }

      setContent(data.text);
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
      setHistoryStack([data.text]);
      setHistoryIndex(0);
      setSuccessNotice(
        language === 'ne'
          ? `फाइल "${file.name}" बाट ${data.wordCount} शब्दहरू सफलतापूर्वक आयात गरियो!`
          : `Imported ${data.wordCount} words from "${file.name}"!`
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload document');
    } finally {
      setIsUploadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Copy to clipboard
  const handleCopyEdited = async () => {
    if (!editedContent) return;
    try {
      await navigator.clipboard.writeText(editedContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  // Replace original with edited
  const handleReplaceOriginal = () => {
    if (!editedContent) return;
    setContent(editedContent);
    setHistoryStack((prev) => [...prev, editedContent]);
    setHistoryIndex((prev) => prev + 1);
    setSuccessNotice(language === 'ne' ? 'मूल सामग्री नयाँ सम्पादित पाठद्वारा प्रतिस्थापन गरियो।' : 'Original content replaced with edited version.');
  };

  // Clear editor
  const handleClearAll = () => {
    if (content && window.confirm(language === 'ne' ? 'के तपाईं सबै पाठ हटाउन निश्चित हुनुहुन्छ?' : 'Are you sure you want to clear the editor?')) {
      setContent('');
      setEditedContent('');
      setActiveSessionId(null);
      setHistoryStack(['']);
      setHistoryIndex(0);
    }
  };

  // Load a historical session
  const handleSelectHistoryItem = (item: EditingHistoryRecord) => {
    setContent(item.originalContent);
    setEditedContent(item.editedContent);
    setTitle(item.title);
    setInstruction(item.instruction);
    setMode(item.selectedMode || 'proofread');
    setStrength((item.strength as any) || 'medium');
    setTargetLanguage(item.targetLanguage || 'original');
    setActiveSessionId(item.id);
    setHistoryStack([item.originalContent]);
    setHistoryIndex(0);
    setShowHistoryDrawer(false);
    setSuccessNotice(language === 'ne' ? `सम्पादन सत्र "${item.title}" पुन: लोड गरियो।` : `Session "${item.title}" loaded.`);
  };

  // Delete history item
  const handleDeleteHistoryItem = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(language === 'ne' ? 'के तपाईं यो इतिहास मेटाउन चाहनुहुन्छ?' : 'Delete this editing session?')) {
      return;
    }
    try {
      await fetch(`/api/ai/history/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistoryList((prev) => prev.filter((h) => h.id !== id));
      if (activeSessionId === id) setActiveSessionId(null);
    } catch (err) {
      console.error('Failed to delete history item:', err);
    }
  };

  // Export document (TXT or DOC)
  const handleExport = async (format: 'txt' | 'doc') => {
    const textToExport = editedContent || content;
    if (!textToExport) return;

    try {
      const res = await fetch('/api/ai/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          content: textToExport,
          format,
        }),
      });

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s+/g, '_')}.${format === 'doc' ? 'doc' : 'txt'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed:', e);
    }
  };

  // Compute metrics
  const originalWords = content.trim().split(/\s+/).filter(Boolean).length;
  const originalChars = content.length;
  const editedWords = editedContent.trim().split(/\s+/).filter(Boolean).length;
  const editedChars = editedContent.length;
  const wordDiff = editedWords - originalWords;

  // Render Diff Highlighted View
  const renderDiff = () => {
    if (!content && !editedContent) {
      return (
        <div className="text-center py-16 text-[#75777f] dark:text-[#8392b7] text-sm font-bilingual">
          {language === 'ne' ? 'तुलना गर्नका लागि सम्पादन परिणाम छैन।' : 'No edited output to compare yet.'}
        </div>
      );
    }

    const differences: Change[] = diffWords(content, editedContent);

    return (
      <div className="p-6 font-sans text-sm leading-relaxed whitespace-pre-wrap break-words bg-white dark:bg-[#0b1020] rounded-2xl border border-[#dde9ff] dark:border-[#1b2a4a] min-h-[420px] max-h-[600px] overflow-y-auto">
        {differences.map((part, index) => {
          if (part.added) {
            return (
              <span
                key={index}
                className="bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 px-1 py-0.5 rounded font-medium border-b-2 border-emerald-500 inline"
                title="Added by AI"
              >
                {part.value}
              </span>
            );
          }
          if (part.removed) {
            return (
              <span
                key={index}
                className="bg-rose-100 dark:bg-rose-950/70 text-rose-900 dark:text-rose-300 line-through px-1 py-0.5 rounded font-normal opacity-70 border-b border-rose-400 inline mx-0.5"
                title="Removed by AI"
              >
                {part.value}
              </span>
            );
          }
          return <span key={index}>{part.value}</span>;
        })}
      </div>
    );
  };

  // Quick Preset Prompts
  const PRESET_PROMPTS = [
    {
      label: language === 'ne' ? '✍️ व्याकरण र हिज्जे' : '✍️ Fix Grammar & Spelling',
      mode: 'proofread',
      instruction: 'व्याकरण, हिज्जे, र विराम चिन्हहरू सच्याउनुहोस्। मूल अर्थ परिवर्तन नगर्नुहोस्।',
    },
    {
      label: language === 'ne' ? '🏢 व्यावसायिक भाषा' : '🏢 Make Professional',
      mode: 'professional',
      instruction: 'Make this content sound authoritative, elegant, and corporate professional.',
    },
    {
      label: language === 'ne' ? '🎓 शैक्षिक प्रतिवेदन' : '🎓 Academic Report Style',
      mode: 'academic',
      instruction: 'शैक्षिक प्रतिवेदन तथा अनुसन्धान शैलीमा औपचारिक र स्पष्ट भाषा प्रयोग गरी पुनर्लेखन गर्नुहोस्।',
    },
    {
      label: language === 'ne' ? '✂️ छोटो र संक्षिप्त' : '✂️ Make Concise & Lean',
      mode: 'concise',
      instruction: 'अनावश्यक शब्दहरू हटाएर वाक्यहरूलाई चुस्त, संक्षिप्त र प्रभावकारी बनाउनुहोस्।',
    },
    {
      label: language === 'ne' ? '🧹 थेगो/Filler हटाउनुहोस्' : '🧹 Remove Filler Words',
      mode: 'clean_filler_words',
      instruction: 'उम्म्, अँ, uh, um, you know जस्ता बोलेका थेगो र अनावश्यक शब्दहरू हटाएर सफा पाठ बनाउनुहोस्।',
    },
    {
      label: language === 'ne' ? '🎯 परीक्षा बुँदाहरू' : '🎯 Convert to Exam Bullets',
      mode: 'text_to_bullets',
      instruction: 'Convert this into high-yield, structured exam revision bullet points with bold subheadings.',
    },
    {
      label: language === 'ne' ? '📖 सारांश निकाल्नुहोस्' : '📖 Summarize',
      mode: 'summarize',
      instruction: 'मुख्य बुँदाहरू र निष्कर्ष समेटेर छोटो तथा प्रभावकारी सारांश प्रस्तुत गर्नुहोस्।',
    },
    {
      label: language === 'ne' ? '💡 व्याख्या थप्नुहोस्' : '💡 Expand & Explain',
      mode: 'expand',
      instruction: 'विद्यार्थीहरूले सजिलै बुझ्ने गरी स्पष्ट उदाहरण तथा थप व्याख्या सहित विस्तार गर्नुहोस्।',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#041534] border border-[#dde9ff] dark:border-[#1b2a4a] shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1b2a4a] to-[#b6152e] flex items-center justify-center text-white shadow-md shadow-[#1b2a4a]/20 shrink-0">
              <Wand2 className="w-6 h-6 text-[#ffdcc5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg sm:text-xl font-bold text-[#0f1c2d] dark:text-white bg-transparent border-b border-dashed border-[#cddbf2] hover:border-[#b6152e] focus:border-[#b6152e] focus:outline-none transition-colors font-heading max-w-sm sm:max-w-md"
                  placeholder="दस्तावेज शीर्षक..."
                />
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#ffdad9] text-[#b6152e] border border-[#ffb3b2]">
                  Gemini 3.8
                </span>
              </div>
              <p className="text-xs text-[#75777f] dark:text-[#8392b7] font-bilingual mt-0.5">
                {language === 'ne'
                  ? 'नेपाली तथा अंग्रेजी शैक्षिक सामग्री, लेख, र भाषणलाई बुद्धिमानीपूर्वक सम्पादन र परिमार्जन गर्नुहोस्'
                  : 'AI-Powered Text Transformation, Grammar Correction, Tone Adjustment & Document Polishing'}
              </p>
            </div>
          </div>

          {/* Quick Header Actions: Usage Quota & History */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* AI Usage Badge */}
            {usage && (
              <button
                onClick={onOpenPricing}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#eff4ff] dark:bg-[#1b2a4a] border border-[#cddbf2] dark:border-[#384668] text-[#1b2a4a] dark:text-[#d6e3fb] hover:border-[#b6152e] transition-colors"
                title="AI Usage Limit"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#e07a1e]" />
                <span>
                  {language === 'ne'
                    ? `${usage.totalUsed}/${usage.limit} सम्पादन प्रयोग`
                    : `${usage.totalUsed}/${usage.limit} Edits Used`}
                </span>
                {usage.plan === 'free' && (
                  <span className="text-[10px] text-[#b6152e] font-bold underline ml-1">
                    {language === 'ne' ? 'अपग्रेड' : 'Upgrade'}
                  </span>
                )}
              </button>
            )}

            {/* History Drawer Toggle */}
            <button
              onClick={() => {
                fetchHistory();
                setShowHistoryDrawer(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#eff4ff] dark:bg-[#1b2a4a] border border-[#cddbf2] dark:border-[#384668] text-[#1b2a4a] dark:text-[#d6e3fb] hover:bg-[#dde9ff] dark:hover:bg-[#243143] transition-colors"
            >
              <History className="w-3.5 h-3.5 text-[#b6152e]" />
              <span>{language === 'ne' ? 'इतिहास' : 'History'}</span>
              {historyList.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#b6152e] text-white text-[10px] flex items-center justify-center font-bold">
                  {historyList.length}
                </span>
              )}
            </button>

            {/* File Upload Button (TXT, DOCX, PDF) */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,.md,.docx,.pdf"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingDoc}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#1b2a4a] text-white hover:bg-[#243143] transition-colors shadow-sm disabled:opacity-50"
            >
              {isUploadingDoc ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileUp className="w-3.5 h-3.5 text-[#ffdcc5]" />
              )}
              <span>{language === 'ne' ? 'फाइल अपलोड (DOCX/PDF/TXT)' : 'Import Document'}</span>
            </button>
          </div>
        </div>

        {/* Notices */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="p-1 hover:bg-rose-200/50 rounded-lg">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {successNotice && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
            <button onClick={() => setSuccessNotice(null)} className="p-1 hover:bg-emerald-200/50 rounded-lg">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Preset Prompt Buttons */}
        <div className="pt-2 border-t border-[#dde9ff] dark:border-[#1b2a4a]">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-bold text-[#75777f] dark:text-[#8392b7] shrink-0 mr-1">
              {language === 'ne' ? 'द्रुत सम्पादन:' : 'Quick Presets:'}
            </span>
            {PRESET_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setMode(p.mode);
                  setInstruction(p.instruction);
                  handleRunAiEdit(p.instruction);
                }}
                disabled={isProcessing}
                className="px-2.5 py-1 rounded-xl text-xs font-medium bg-[#eff4ff] dark:bg-[#1b2a4a] hover:bg-[#dde9ff] dark:hover:bg-[#243143] text-[#1b2a4a] dark:text-[#d6e3fb] border border-[#cddbf2] dark:border-[#384668] transition-all shrink-0 hover:scale-[1.02]"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Editor Controls & Custom Instructions (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-[#041534] border border-[#dde9ff] dark:border-[#1b2a4a] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#0f1c2d] dark:text-white flex items-center gap-2 font-heading">
                <SlidersHorizontal className="w-4 h-4 text-[#b6152e]" />
                <span>{language === 'ne' ? 'सम्पादन नियन्त्रणहरू' : 'AI Editing Controls'}</span>
              </h2>
            </div>

            {/* Custom Instruction Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#45464e] dark:text-[#cddbf2] block">
                {language === 'ne' ? 'AI निर्देशन (तपाईं के परिवर्तन गर्न चाहनुहुन्छ?)' : 'AI Instructions (What to change?)'}
              </label>
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                rows={3}
                placeholder={
                  language === 'ne'
                    ? 'जस्तै: "यो अनुच्छेदलाई अझ व्यावसायिक बनाउनुहोस्", "व्याकरण सच्याएर सजिलो भाषामा लेख्नुहोस्", "१०० शब्दमा संक्षिप्त गर्नुहोस्"...'
                    : 'e.g. "Make this paragraph more professional", "Correct grammar without changing meaning", "Shorten to 100 words"...'
                }
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#dde9ff] dark:border-[#1b2a4a] bg-[#f8f9ff] dark:bg-[#0b1020] text-[#0f1c2d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#b6152e] resize-none"
              />
            </div>

            {/* Mode Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#45464e] dark:text-[#cddbf2] block">
                {language === 'ne' ? 'सम्पादन मोड' : 'Editing Task'}
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#dde9ff] dark:border-[#1b2a4a] bg-[#f8f9ff] dark:bg-[#0b1020] text-[#0f1c2d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#b6152e]"
              >
                <option value="proofread">
                  {language === 'ne' ? 'व्याकरण तथा हिज्जे सुधार (Proofread & Correct)' : 'Proofread & Fix Errors'}
                </option>
                <option value="improve_flow">
                  {language === 'ne' ? 'वाक्य संरचना तथा प्रवाह सुधार (Improve Sentence Flow)' : 'Improve Sentence Flow & Vocabulary'}
                </option>
                <option value="professional">
                  {language === 'ne' ? 'व्यावसायिक तथा औपचारिक (Professional)' : 'Professional Tone'}
                </option>
                <option value="academic">
                  {language === 'ne' ? 'शैक्षिक तथा अनुसन्धान (Academic Report)' : 'Academic Style'}
                </option>
                <option value="concise">
                  {language === 'ne' ? 'संक्षिप्त तथा चुस्त (Concise & Lean)' : 'Concise & Shorten'}
                </option>
                <option value="engaging">
                  {language === 'ne' ? 'रोचक तथा आकर्षक (Engaging)' : 'Engaging & Dynamic'}
                </option>
                <option value="summarize">
                  {language === 'ne' ? 'सारांश (Summarize Key Concepts)' : 'Summarize Content'}
                </option>
                <option value="expand">
                  {language === 'ne' ? 'विस्तार तथा व्याख्या (Expand Short Content)' : 'Expand with Explanations'}
                </option>
                <option value="paraphrase">
                  {language === 'ne' ? 'पुनर्लेखन (Paraphrase Human Style)' : 'Paraphrase (Human Style)'}
                </option>
                <option value="text_to_bullets">
                  {language === 'ne' ? 'अनुच्छेदबाट बुँदाहरू (Text to Bullet Points)' : 'Convert to Bullet Points'}
                </option>
                <option value="bullets_to_text">
                  {language === 'ne' ? 'बुँदाहरूबाट अनुच्छेद (Bullets to Paragraph)' : 'Convert Bullets to Paragraphs'}
                </option>
                <option value="clean_filler_words">
                  {language === 'ne' ? 'बोलेका थेगो सफा गर्नुहोस् (Clean Transcript Fillers)' : 'Remove Spoken Filler Words'}
                </option>
                <option value="custom">
                  {language === 'ne' ? 'कस्टम निर्देशन मात्र (Custom Instruction Only)' : 'Custom Instruction'}
                </option>
              </select>
            </div>

            {/* Editing Strength */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#45464e] dark:text-[#cddbf2] block">
                {language === 'ne' ? 'सम्पादन तीव्रता (Strength)' : 'Editing Strength'}
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-[#eff4ff] dark:bg-[#0b1020] p-1 rounded-xl border border-[#dde9ff] dark:border-[#1b2a4a]">
                {(['light', 'medium', 'strong'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStrength(s)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                      strength === s
                        ? 'bg-[#1b2a4a] text-white shadow-sm'
                        : 'text-[#45464e] dark:text-[#cddbf2] hover:text-[#0f1c2d]'
                    }`}
                  >
                    {s === 'light'
                      ? language === 'ne'
                        ? 'हल्का (Light)'
                        : 'Light'
                      : s === 'medium'
                      ? language === 'ne'
                        ? 'मध्यम (Med)'
                        : 'Medium'
                      : language === 'ne'
                      ? 'सशक्त (High)'
                      : 'Strong'}
                  </button>
                ))}
              </div>
            </div>

            {/* Tone Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#45464e] dark:text-[#cddbf2] block">
                {language === 'ne' ? 'शैली / स्वर (Tone)' : 'Tone'}
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#dde9ff] dark:border-[#1b2a4a] bg-[#f8f9ff] dark:bg-[#0b1020] text-[#0f1c2d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#b6152e]"
              >
                <option value="original">{language === 'ne' ? 'मूल शैली कायम राख्नुहोस्' : 'Keep Original Tone'}</option>
                <option value="professional">Professional (व्यावसायिक)</option>
                <option value="academic">Academic (शैक्षिक)</option>
                <option value="casual">Casual (सामान्य)</option>
                <option value="friendly">Friendly (मित्रवत)</option>
                <option value="formal">Formal (औपचारिक)</option>
                <option value="concise">Concise (संक्षिप्त)</option>
                <option value="engaging">Engaging (रोचक)</option>
              </select>
            </div>

            {/* Output Language */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#45464e] dark:text-[#cddbf2] block">
                {language === 'ne' ? 'नतिजाको भाषा' : 'Output Language'}
              </label>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#dde9ff] dark:border-[#1b2a4a] bg-[#f8f9ff] dark:bg-[#0b1020] text-[#0f1c2d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#b6152e]"
              >
                <option value="original">{language === 'ne' ? 'मूल भाषा यथावत' : 'Keep Original Language'}</option>
                <option value="ne">नेपाली (Nepali Devanagari)</option>
                <option value="en">English (अंग्रेजी)</option>
                <option value="bilingual">द्विभाषी (Bilingual Nepali + English)</option>
              </select>
            </div>

            {/* Main AI Edit Button */}
            <button
              onClick={() => handleRunAiEdit()}
              disabled={isProcessing || !content.trim()}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#b6152e] to-[#dc3545] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#b6152e]/30 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>{language === 'ne' ? 'AI प्रशोधन हुँदैछ...' : 'Gemini AI Processing...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#ffdcc5]" />
                  <span>{language === 'ne' ? 'AI सम्पादन सुरु गर्नुहोस्' : 'Run AI Edit'}</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Metrics Card */}
          <div className="p-4 rounded-3xl bg-white dark:bg-[#041534] border border-[#dde9ff] dark:border-[#1b2a4a] text-xs font-mono space-y-2">
            <div className="flex justify-between text-[#75777f] dark:text-[#8392b7] font-sans text-[11px] font-medium">
              <span>{language === 'ne' ? 'तथ्यांक' : 'Statistics'}</span>
              <span>{language === 'ne' ? 'परिवर्तन' : 'Diff'}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[#eff4ff] dark:border-[#1b2a4a]">
              <span className="font-sans text-[#45464e] dark:text-[#cddbf2]">
                {language === 'ne' ? 'शब्दहरू (Words):' : 'Words:'}
              </span>
              <div className="flex items-center gap-2">
                <span>{originalWords}</span>
                <ArrowRight className="w-3 h-3 text-[#75777f]" />
                <span className="font-bold text-[#0f1c2d] dark:text-white">{editedWords}</span>
                {editedContent && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                      wordDiff >= 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {wordDiff >= 0 ? `+${wordDiff}` : wordDiff}
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="font-sans text-[#45464e] dark:text-[#cddbf2]">
                {language === 'ne' ? 'अक्षरहरू (Chars):' : 'Characters:'}
              </span>
              <div className="flex items-center gap-2">
                <span>{originalChars}</span>
                <ArrowRight className="w-3 h-3 text-[#75777f]" />
                <span className="font-bold text-[#0f1c2d] dark:text-white">{editedChars}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Editor & Comparison Display (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* View Mode & Utility Bar */}
          <div className="p-4 rounded-3xl bg-white dark:bg-[#041534] border border-[#dde9ff] dark:border-[#1b2a4a] flex flex-wrap items-center justify-between gap-3 shadow-sm">
            {/* View Switcher: Split / Diff / Editor */}
            <div className="flex items-center gap-1 bg-[#eff4ff] dark:bg-[#0b1020] p-1 rounded-2xl border border-[#dde9ff] dark:border-[#1b2a4a]">
              <button
                onClick={() => setViewMode('split')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'split'
                    ? 'bg-[#1b2a4a] text-white shadow-sm'
                    : 'text-[#45464e] dark:text-[#cddbf2] hover:text-[#0f1c2d]'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>{language === 'ne' ? 'दायाँ-बायाँ (Split)' : 'Side-by-Side'}</span>
              </button>
              <button
                onClick={() => setViewMode('diff')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'diff'
                    ? 'bg-[#1b2a4a] text-white shadow-sm'
                    : 'text-[#45464e] dark:text-[#cddbf2] hover:text-[#0f1c2d]'
                }`}
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>{language === 'ne' ? 'तुलना (Diff)' : 'Changes (Diff)'}</span>
              </button>
              <button
                onClick={() => setViewMode('editor')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'editor'
                    ? 'bg-[#1b2a4a] text-white shadow-sm'
                    : 'text-[#45464e] dark:text-[#cddbf2] hover:text-[#0f1c2d]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{language === 'ne' ? 'केवल सम्पादक' : 'Editor Only'}</span>
              </button>
            </div>

            {/* Utility actions: Undo, Redo, Copy, Replace, Export, Clear */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-2 rounded-xl bg-[#eff4ff] dark:bg-[#1b2a4a] text-[#1b2a4a] dark:text-[#d6e3fb] hover:bg-[#dde9ff] dark:hover:bg-[#243143] disabled:opacity-30 transition-colors"
                title="Undo (Ctrl+Z)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= historyStack.length - 1}
                className="p-2 rounded-xl bg-[#eff4ff] dark:bg-[#1b2a4a] text-[#1b2a4a] dark:text-[#d6e3fb] hover:bg-[#dde9ff] dark:hover:bg-[#243143] disabled:opacity-30 transition-colors"
                title="Redo"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              {editedContent && (
                <>
                  <button
                    onClick={handleCopyEdited}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#eff4ff] dark:bg-[#1b2a4a] text-[#1b2a4a] dark:text-[#d6e3fb] hover:bg-[#dde9ff] dark:hover:bg-[#243143] transition-colors"
                    title="Copy Edited Output"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? (language === 'ne' ? 'प्रतिलिपि भयो' : 'Copied!') : language === 'ne' ? 'कपी' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={handleReplaceOriginal}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#eff4ff] dark:bg-[#1b2a4a] text-[#e07a1e] hover:bg-[#dde9ff] dark:hover:bg-[#243143] transition-colors"
                    title="Replace original text with edited"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>{language === 'ne' ? 'मूल प्रतिस्थापन' : 'Apply to Original'}</span>
                  </button>
                </>
              )}

              {/* Export menu */}
              <div className="relative group">
                <button
                  onClick={() => handleExport('txt')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#1b2a4a] text-white hover:bg-[#243143] transition-colors"
                  title="Download File"
                >
                  <Download className="w-3.5 h-3.5 text-[#ffdcc5]" />
                  <span>{language === 'ne' ? 'डाउनलोड (TXT)' : 'Export'}</span>
                </button>
                <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-[#041534] border border-[#dde9ff] dark:border-[#1b2a4a] rounded-xl shadow-lg p-1 hidden group-hover:block z-20">
                  <button
                    onClick={() => handleExport('txt')}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#0f1c2d] dark:text-white hover:bg-[#eff4ff] dark:hover:bg-[#1b2a4a] rounded-lg"
                  >
                    Plain Text (.txt)
                  </button>
                  <button
                    onClick={() => handleExport('doc')}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#0f1c2d] dark:text-white hover:bg-[#eff4ff] dark:hover:bg-[#1b2a4a] rounded-lg"
                  >
                    Word Doc (.doc)
                  </button>
                </div>
              </div>

              {/* Clear button */}
              <button
                onClick={handleClearAll}
                className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Clear editor"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* VIEW 1: SPLIT VIEW (Side-by-Side Original vs Edited) */}
          {viewMode === 'split' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Original Content Area */}
              <div className="p-4 rounded-3xl bg-white dark:bg-[#041534] border border-[#dde9ff] dark:border-[#1b2a4a] shadow-sm flex flex-col">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#eff4ff] dark:border-[#1b2a4a]">
                  <span className="text-xs font-bold text-[#45464e] dark:text-[#cddbf2] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#75777f]" />
                    <span>{language === 'ne' ? 'मूल सामग्री (Original Content)' : 'Original Content'}</span>
                  </span>
                  <span className="text-[11px] font-mono text-[#75777f] dark:text-[#8392b7]">
                    {originalWords} {language === 'ne' ? 'शब्द' : 'words'}
                  </span>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder={
                    language === 'ne'
                      ? 'यहाँ कुनै पनि पाठ टाइप वा पेस्ट गर्नुहोस्, वा माथिको बटनबाट DOCX/PDF फाइल अपलोड गर्नुहोस्...'
                      : 'Type or paste content here, or upload DOCX/PDF above...'
                  }
                  className="w-full flex-1 min-h-[420px] max-h-[600px] p-3 text-sm leading-relaxed rounded-2xl bg-[#f8f9ff] dark:bg-[#0b1020] border border-[#dde9ff] dark:border-[#1b2a4a] text-[#0f1c2d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#b6152e] resize-none font-sans"
                />
              </div>

              {/* Edited Result Area */}
              <div className="p-4 rounded-3xl bg-white dark:bg-[#041534] border border-[#dde9ff] dark:border-[#1b2a4a] shadow-sm flex flex-col">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#eff4ff] dark:border-[#1b2a4a]">
                  <span className="text-xs font-bold text-[#b6152e] dark:text-[#ffdad9] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#b6152e]" />
                    <span>{language === 'ne' ? 'AI सम्पादित नतिजा (Edited Output)' : 'AI Edited Output'}</span>
                  </span>
                  <span className="text-[11px] font-mono text-[#75777f] dark:text-[#8392b7]">
                    {editedWords} {language === 'ne' ? 'शब्द' : 'words'}
                  </span>
                </div>
                {isProcessing ? (
                  <div className="flex-1 min-h-[420px] flex flex-col items-center justify-center p-8 text-center bg-[#f8f9ff] dark:bg-[#0b1020] rounded-2xl border border-dashed border-[#b6152e]/40">
                    <RefreshCw className="w-8 h-8 text-[#b6152e] animate-spin mb-3" />
                    <p className="text-sm font-bold text-[#1b2a4a] dark:text-white font-heading">
                      {language === 'ne' ? 'Gemini 3.8 ले सम्पादन गर्दैछ...' : 'Gemini 3.8 Processing...'}
                    </p>
                    <p className="text-xs text-[#75777f] dark:text-[#8392b7] font-bilingual max-w-xs mt-1">
                      {language === 'ne'
                        ? 'व्याकरण, हिज्जे, वाक्य संरचना तथा शैलिगत सुधार गरिँदैछ।'
                        : 'Checking grammar, restructuring sentences and polishing educational flow.'}
                    </p>
                  </div>
                ) : editedContent ? (
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full flex-1 min-h-[420px] max-h-[600px] p-3 text-sm leading-relaxed rounded-2xl bg-[#f8f9ff] dark:bg-[#0b1020] border border-[#dde9ff] dark:border-[#1b2a4a] text-[#0f1c2d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#b6152e] resize-none font-sans"
                  />
                ) : (
                  <div className="flex-1 min-h-[420px] flex flex-col items-center justify-center p-8 text-center bg-[#f8f9ff] dark:bg-[#0b1020] rounded-2xl border border-dashed border-[#dde9ff] dark:border-[#1b2a4a] text-[#75777f] dark:text-[#8392b7]">
                    <Wand2 className="w-8 h-8 text-[#8392b7] mb-2 opacity-60" />
                    <p className="text-sm font-medium font-bilingual">
                      {language === 'ne'
                        ? 'बायाँपट्टिको सम्पादन बटन थिचेपछि यहाँ AI सम्पादित नतिजा देखिनेछ।'
                        : 'Click "Run AI Edit" on the left to see the polished output.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 2: DIFF VIEW (Highlighted Additions & Deletions) */}
          {viewMode === 'diff' && (
            <div className="p-4 rounded-3xl bg-white dark:bg-[#041534] border border-[#dde9ff] dark:border-[#1b2a4a] shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#eff4ff] dark:border-[#1b2a4a]">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#0f1c2d] dark:text-white flex items-center gap-1.5 font-heading">
                    <GitCompare className="w-3.5 h-3.5 text-[#b6152e]" />
                    <span>{language === 'ne' ? 'परिवर्तनहरूको सूक्ष्म तुलना (Diff View)' : 'Side-by-Side Diff Comparison'}</span>
                  </span>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                      + थपिएका (Added)
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-800 line-through font-semibold">
                      - हटाइएका (Removed)
                    </span>
                  </div>
                </div>
              </div>
              {renderDiff()}
            </div>
          )}

          {/* VIEW 3: EDITOR ONLY VIEW */}
          {viewMode === 'editor' && (
            <div className="p-4 rounded-3xl bg-white dark:bg-[#041534] border border-[#dde9ff] dark:border-[#1b2a4a] shadow-sm flex flex-col">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#eff4ff] dark:border-[#1b2a4a]">
                <span className="text-xs font-bold text-[#0f1c2d] dark:text-white">
                  {language === 'ne' ? 'मुख्य पाठ सम्पादक' : 'Main Text Editor'}
                </span>
                <span className="text-[11px] font-mono text-[#75777f]">
                  {originalWords} {language === 'ne' ? 'शब्दहरू' : 'words'} • {originalChars} chars
                </span>
              </div>
              <textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                rows={18}
                placeholder={language === 'ne' ? 'यहाँ पाठ टाइप गर्नुहोस्...' : 'Type or paste content here...'}
                className="w-full p-4 text-sm leading-relaxed rounded-2xl bg-[#f8f9ff] dark:bg-[#0b1020] border border-[#dde9ff] dark:border-[#1b2a4a] text-[#0f1c2d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#b6152e] font-sans"
              />
            </div>
          )}
        </div>
      </div>

      {/* Editing History Slide-Over Drawer */}
      {showHistoryDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#041534] h-full shadow-2xl border-l border-[#dde9ff] dark:border-[#1b2a4a] flex flex-col p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#dde9ff] dark:border-[#1b2a4a]">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#b6152e]" />
                <h3 className="text-base font-bold text-[#0f1c2d] dark:text-white font-heading">
                  {language === 'ne' ? 'सम्पादन इतिहास' : 'Editing History'}
                </h3>
              </div>
              <button
                onClick={() => setShowHistoryDrawer(false)}
                className="p-1.5 rounded-xl hover:bg-[#eff4ff] dark:hover:bg-[#1b2a4a] text-[#75777f]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#75777f] dark:text-[#8392b7] font-bilingual">
              {language === 'ne'
                ? 'तपाईंका अघिल्ला AI सम्पादन सत्रहरू यहाँ सुरक्षित छन्। क्लिक गरेर पुन: खोल्न वा पुराना संस्करणहरू पुनर्स्थापना गर्न सक्नुहुन्छ।'
                : 'All your previous AI editing sessions stored securely in PostgreSQL. Click to restore or reopen.'}
            </p>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {isLoadingHistory ? (
                <div className="text-center py-12 text-[#75777f]">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#b6152e]" />
                  <span className="text-xs font-bilingual">{language === 'ne' ? 'इतिहास लोड हुँदैछ...' : 'Loading history...'}</span>
                </div>
              ) : historyList.length === 0 ? (
                <div className="text-center py-16 text-[#75777f] dark:text-[#8392b7]">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bilingual">
                    {language === 'ne' ? 'कुनै अघिल्लो सम्पादन सत्र भेटिएन।' : 'No previous editing sessions yet.'}
                  </p>
                </div>
              ) : (
                historyList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectHistoryItem(item)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
                      activeSessionId === item.id
                        ? 'border-[#b6152e] bg-[#ffdad9]/20'
                        : 'border-[#dde9ff] dark:border-[#1b2a4a] hover:border-[#b6152e]/60 bg-[#f8f9ff] dark:bg-[#0b1020]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className="text-xs font-bold text-[#0f1c2d] dark:text-white line-clamp-1 font-heading group-hover:text-[#b6152e]">
                        {item.title}
                      </h4>
                      <button
                        onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                        className="text-gray-400 hover:text-rose-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] text-[#75777f] dark:text-[#8392b7] line-clamp-2 font-bilingual mb-2">
                      {item.editedContent || item.originalContent}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-[#75777f] dark:text-[#8392b7] font-mono">
                      <span>{new Date(item.createdAt).toLocaleDateString('ne-NP')}</span>
                      <span className="font-semibold text-[#b6152e]">
                        {item.wordCountBefore} → {item.wordCountAfter} words
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-[#dde9ff] dark:border-[#1b2a4a]">
              <button
                onClick={() => {
                  setContent('');
                  setEditedContent('');
                  setTitle(language === 'ne' ? 'नयाँ सम्पादन सत्र' : 'Untitled Document');
                  setActiveSessionId(null);
                  setShowHistoryDrawer(false);
                }}
                className="w-full py-2.5 rounded-xl bg-[#1b2a4a] text-white text-xs font-bold font-heading hover:bg-[#243143] transition-colors"
              >
                + {language === 'ne' ? 'नयाँ सम्पादन सत्र सुरु गर्नुहोस्' : 'Start Fresh Document'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
