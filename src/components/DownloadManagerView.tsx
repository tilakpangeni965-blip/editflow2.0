import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Project, SignedDownloadToken } from '../types';
import { formatTime, toNepaliNumerals } from '../utils/formatters';
import {
  ShieldCheck,
  Download,
  Key,
  Clock,
  RefreshCw,
  FileText,
  Video,
  Subtitles,
  Copy,
  Check,
} from 'lucide-react';

interface DownloadManagerViewProps {
  project: Project;
}

export const DownloadManagerView: React.FC<DownloadManagerViewProps> = ({ project }) => {
  const { language, t } = useLanguage();
  const { token } = useAuth();

  const [signedInfo, setSignedInfo] = useState<SignedDownloadToken | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(15 * 60);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSignedUrl = async (fileType: string = 'video') => {
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/generate-signed-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fileType, expiresInMinutes: 15 }),
      });
      const data = await res.json();
      if (data.success) {
        setSignedInfo(data);
        const secs = Math.max(0, data.expires - Math.floor(Date.now() / 1000));
        setRemainingSeconds(secs);
      }
    } catch (err) {
      console.error('Failed to generate signed url:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    generateSignedUrl('video');
  }, [project.id]);

  useEffect(() => {
    if (remainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [remainingSeconds]);

  const handleCopyLink = () => {
    if (!signedInfo) return;
    const fullUrl = `${window.location.origin}${signedInfo.downloadUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownload = (type: string) => {
    const downloadEndpoint = `/api/downloads/signed?token=${btoa(`${project.id}:${type}:${Math.floor(Date.now() / 1000) + 900}:${project.userId}`)}&sig=${signedInfo?.signature || 'valid-sig'}&expires=${Math.floor(Date.now() / 1000) + 900}&type=${type}&pid=${project.id}`;
    window.open(downloadEndpoint, '_blank');
  };

  const isExpired = remainingSeconds <= 0;

  return (
    <div className="space-y-6 font-bilingual">
      {/* Security Banner Card */}
      <div className="p-6 rounded-3xl bg-white border border-[#dde9ff] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0f1c2d] flex items-center gap-2 font-heading">
                <span>{t('downloadsTitle')}</span>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#eff4ff] text-[#1b2a4a] border border-[#cddbf2] font-bold">
                  HMAC-SHA256
                </span>
              </h3>
              <p className="text-xs text-[#45464e] max-w-xl leading-relaxed">
                {t('downloadsSub')}
              </p>
            </div>
          </div>

          {/* Expiry Countdown Badge */}
          <div className="flex items-center gap-3 font-heading">
            <div
              className={`px-4 py-2 rounded-2xl border flex items-center gap-2 text-xs font-mono font-bold ${
                isExpired
                  ? 'bg-[#ffdad9] border-[#ffb3b2] text-[#b6152e]'
                  : 'bg-[#ffdcc5]/60 border-[#ffdcc5] text-[#703700]'
              }`}
            >
              <Clock className="w-4 h-4 text-[#e07a1e]" />
              <span>
                {t('linkExpiryNotice')}{' '}
                {isExpired
                  ? language === 'ne'
                    ? 'म्याद सकियो'
                    : 'Expired'
                  : formatTime(remainingSeconds, language)}
              </span>
            </div>

            <button
              onClick={() => generateSignedUrl('video')}
              disabled={isGenerating}
              className="p-2.5 rounded-2xl bg-[#eff4ff] hover:bg-[#dde9ff] text-[#1b2a4a] border border-[#cddbf2] transition-colors"
              title={t('generateNewSignedLink')}
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin text-[#b6152e]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Cryptographic token inspector */}
        {signedInfo && (
          <div className="p-4 rounded-2xl bg-[#f8f9ff] border border-[#dde9ff] space-y-2 text-xs">
            <div className="flex items-center justify-between text-[#45464e] text-[11px]">
              <span className="flex items-center gap-1.5 font-bold font-heading text-[#1b2a4a]">
                <Key className="w-3.5 h-3.5 text-[#b6152e]" />
                <span>{t('signedTokenLabel')}</span>
              </span>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1 text-[#b6152e] hover:underline font-bold"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? t('copied') : t('copy')}</span>
              </button>
            </div>
            <p className="font-mono text-[11px] text-[#0f1c2d] break-all bg-white p-3 rounded-xl border border-[#dde9ff] select-all">
              {signedInfo.downloadUrl}
            </p>
          </div>
        )}
      </div>

      {/* Download Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Cleaned Media */}
        <div className="p-5 rounded-3xl bg-white border border-[#dde9ff] hover:border-[#1b2a4a] transition-all space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#ffdad9] text-[#b6152e] flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded bg-[#eff4ff] text-[#1b2a4a]">
              MP4 / WebM
            </span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#0f1c2d] font-heading">
              {t('downloadPolishedMedia')}
            </h4>
            <p className="text-xs text-[#45464e] mt-1 leading-relaxed">
              {language === 'ne'
                ? `मौनता काटिएको (-${toNepaliNumerals(project.trimmedPauseSeconds)} सेकेन्ड) र आवाज स्तर -१४ LUFS नर्मालाइज गरिएको भिडियो।`
                : `Pauses trimmed (-${project.trimmedPauseSeconds}s) and normalized to -14 LUFS broadcast quality.`}
            </p>
          </div>
          <button
            onClick={() => handleDownload('video')}
            className="w-full py-2.5 rounded-xl bg-[#1b2a4a] hover:bg-[#041534] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors font-heading"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('download')} Media</span>
          </button>
        </div>

        {/* 2. Nepali SRT */}
        <div className="p-5 rounded-3xl bg-white border border-[#dde9ff] hover:border-[#1b2a4a] transition-all space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#ffdcc5] text-[#703700] flex items-center justify-center">
              <Subtitles className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded bg-[#eff4ff] text-[#1b2a4a]">
              .SRT (UTF-8)
            </span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#0f1c2d] font-heading">
              {t('downloadNepaliSrt')}
            </h4>
            <p className="text-xs text-[#45464e] mt-1 leading-relaxed">
              {language === 'ne'
                ? 'युट्युब, फेसबुक, भिएलसी तथा अनलाइन लर्निङ म्यानेजमेन्ट सिस्टम (LMS) का लागि देवनागरी क्याप्सन।'
                : 'Formatted Devanagari captions compatible with YouTube, Facebook, and school LMS.'}
            </p>
          </div>
          <button
            onClick={() => handleDownload('srt_ne')}
            className="w-full py-2.5 rounded-xl bg-[#b6152e] hover:bg-[#92001f] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors font-heading"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('download')} Nepali SRT</span>
          </button>
        </div>

        {/* 3. English SRT */}
        <div className="p-5 rounded-3xl bg-white border border-[#dde9ff] hover:border-[#1b2a4a] transition-all space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#d9e2ff] text-[#1b2a4a] flex items-center justify-center">
              <Subtitles className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded bg-[#eff4ff] text-[#1b2a4a]">
              .SRT (English)
            </span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#0f1c2d] font-heading">
              {t('downloadEnglishSrt')}
            </h4>
            <p className="text-xs text-[#45464e] mt-1 leading-relaxed">
              {language === 'ne'
                ? 'अङ्ग्रेजी माध्यमका विद्यार्थी तथा राष्ट्रिय-अन्तर्राष्ट्रिय प्रतियोगिताका लागि अङ्ग्रेजी क्याप्सन।'
                : 'English subtitles tailored for English medium students and entrance exams.'}
            </p>
          </div>
          <button
            onClick={() => handleDownload('srt_en')}
            className="w-full py-2.5 rounded-xl bg-[#1b2a4a] hover:bg-[#041534] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors font-heading"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('download')} English SRT</span>
          </button>
        </div>

        {/* 4. Complete Exam Revision Pack Notes */}
        <div className="p-5 rounded-3xl bg-white border border-[#dde9ff] hover:border-[#1b2a4a] transition-all space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#e6eeff] text-[#1b2a4a] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded bg-[#eff4ff] text-[#1b2a4a]">
              .MD / .TXT
            </span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#0f1c2d] font-heading">
              {t('downloadExamNotesPdf')}
            </h4>
            <p className="text-xs text-[#45464e] mt-1 leading-relaxed">
              {language === 'ne'
                ? 'सारांश, बोर्ड परीक्षा बुँदाहरू, सुत्र, र १० वटा नमुना प्रश्नोत्तर सहितको पूर्ण अध्ययन फाइल।'
                : 'Complete printable lesson notes, board exam points, formulas, and 10 model Q&A.'}
            </p>
          </div>
          <button
            onClick={() => handleDownload('notes_md')}
            className="w-full py-2.5 rounded-xl bg-[#b6152e] hover:bg-[#92001f] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors font-heading"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('download')} Exam Pack</span>
          </button>
        </div>
      </div>
    </div>
  );
};
