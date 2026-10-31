import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Play,
  Pause,
  Scissors,
  Volume2,
  FileText,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowRight,
  GraduationCap,
  CreditCard,
  Building2,
  Lock,
  Layers,
  Film,
  Zap,
  Clock,
  Star,
  ChevronDown,
  ChevronUp,
  Smartphone,
  Monitor,
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface LandingPageProps {
  onStartCreating: () => void;
  onOpenPricing: () => void;
  onOpenUpload: () => void;
  onOpenAiEditor?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartCreating,
  onOpenPricing,
  onOpenUpload,
  onOpenAiEditor,
}) => {

  const { language, t } = useLanguage();
  const { user } = useAuth();

  // Interactive Demo State
  const [demoAspect, setDemoAspect] = useState<'9:16' | '16:9'>('9:16');
  const [demoStyle, setDemoStyle] = useState<'submagic' | 'bold' | 'classic'>('submagic');
  const [demoCutPauses, setDemoCutPauses] = useState(true);
  const [activeWordIdx, setActiveWordIdx] = useState(2);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const demoWords = [
    { text: 'नमस्ते,', ne: 'नमस्ते,' },
    { text: 'आज', ne: 'आज' },
    { text: 'हामी', ne: 'हामी' },
    { text: 'न्यूटनको', ne: 'न्यूटनको' },
    { text: 'दोस्रो', ne: 'दोस्रो' },
    { text: 'नियम', ne: 'नियम' },
    { text: 'पढ्दैछौँ।', ne: 'पढ्दैछौँ।' },
  ];

  const faqs = [
    {
      qNe: 'माछापुच्छ्रे बैंक (MBL) बाट भुक्तानी कसरी सुरक्षित हुन्छ?',
      qEn: 'How does payment settlement work with Machhapuchchhre Bank?',
      aNe: 'तपाईंले connectIPS, NepalPay QR वा सिधा खाता ००२००८४५९२००१९ मा रकम जम्मा गर्दा हाम्रो सर्भरले NCHL/बैंक सेटलमेन्ट चेक गर्छ। रकम खातामा आएपछि मात्र तपाईंको मोबाइलमा ६-अङ्कको सुरक्षा OTP पठाइन्छ र योजना सक्रिय हुन्छ। स्क्रिनसट वा नक्कली विवरणले सदस्यता खुल्दैन।',
      aEn: 'Payments settle directly into our official Machhapuchchhre Bank account (00200845920019) via connectIPS or NepalPay Smart QR. Our server verifies the clearing reference before issuing an activation OTP to your registered phone.',
    },
    {
      qNe: 'के मेरा अपलोड गरिएका कक्षा भिडियोहरू सुरक्षित र निजी रहन्छन्?',
      qEn: 'Are my uploaded lecture videos private and secure?',
      aNe: 'हो, पूर्ण रूपमा। एडिटफ्लोले कुनै पनि पब्लिक फोल्डर प्रयोग गर्दैन। सबै डाउनलोडहरू १५ मिनेटका लागि मात्र मान्य हुने क्रिप्टोग्राफिक डिजिटल हस्ताक्षर (HMAC-SHA256) बाट सुरक्षित गरिन्छन्। अन्य कुनै प्रयोगकर्ता वा संस्थाले तपाईंको सामग्री हेर्न पाउँदैन।',
      aEn: 'Yes, absolutely. Editflow stores files in private buckets with zero public URLs. Downloads use short-lived HMAC-SHA256 signed tokens valid for 15 minutes only.',
    },
    {
      qNe: 'नन-डिस्ट्रक्टिभ साइलेन्स कट भनेको के हो?',
      qEn: 'What is non-destructive silence removal?',
      aNe: 'यसले मूल भिडियो फाइललाई बिगार्दैन। सफ्टवेयरले अनावश्यक लामा पजहरू पत्ता लगाएर समय-सीमा (Keep Ranges) मात्र तयार गर्छ। तपाईंले चाहेको खण्डमा जुनसुकै पज पुनः राख्न वा हटाउन सक्नुहुन्छ।',
      aEn: 'It leaves your original footage untouched. The engine detects long pauses and suggests straight cuts as timeline keep ranges, allowing you to accept or revert any cut instantly.',
    },
    {
      qNe: 'नेपाली र अङ्ग्रेजी क्याप्सन कसरी सम्पादन गर्न सकिन्छ?',
      qEn: 'How can I edit Nepali Devanagari and English subtitles?',
      aNe: 'ब्राउजरमै रहेको हाम्रो सबटाइटल सम्पादकमा तपाईंले शब्द-शब्द सच्याउन, समय मिलाउन, Submagic शैलीको वर्ड-हाइलाइट थप्न र .SRT वा WebVTT ढाँचामा डाउनलोड गर्न सक्नुहुन्छ।',
      aEn: 'Our in-browser bilingual editor lets you adjust timestamps, fix Devanagari typos, choose highlight colors, and export clean .SRT or WebVTT files.',
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 py-4 font-bilingual text-[#0f1c2d]">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#1b2a4a] via-[#101b33] to-[#041534] text-white p-6 sm:p-12 lg:p-16 border border-[#243143] shadow-2xl">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#b6152e]/20 border border-[#b6152e]/50 text-xs font-semibold text-[#ffb3b2]">
            <Sparkles className="w-3.5 h-3.5 text-[#ffdad9]" />
            <span>नेपालका शिक्षक, कोचिङ र क्रिएटरहरूका लागि आधुनिक भिडियो SaaS</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight font-heading leading-tight sm:leading-none">
            {language === 'ne' ? (
              <>
                कक्षाका भिडियोहरूलाई{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffdcc5] via-[#ffb783] to-[#dc771b]">
                  आधुनिक र परीक्षा-केन्द्रित
                </span>{' '}
                पाठ्य-सामग्रीमा बदल्नुहोस्
              </>
            ) : (
              <>
                Turn Raw Lectures Into{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffdcc5] via-[#ffb783] to-[#dc771b]">
                  Polished Video Lessons
                </span>{' '}
                & Exam Packs
              </>
            )}
          </h1>

          <p className="text-sm sm:text-lg text-[#cddbf2] max-w-2xl mx-auto leading-relaxed">
            {language === 'ne'
              ? 'अनावश्यक लामा पजहरू स्वतः हटाउनुहोस्, आवाज सन्तुलन गर्नुहोस्, Submagic शैलीका नेपाली र अङ्ग्रेजी क्याप्सन राख्नुहोस्, र SEE, +2 तथा लोक सेवाका लागि १० वटा नमुना प्रश्नहरू तत्काल तयार गर्नुहोस्।'
              : 'Auto-trim dead pauses, normalize classroom audio to -14 LUFS, style bilingual Devanagari captions with word highlights, and generate high-yield exam packs.'}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={onOpenUpload}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#b6152e] hover:bg-[#92001f] text-white font-bold text-sm shadow-xl shadow-[#b6152e]/30 flex items-center justify-center gap-2.5 transition-all active:scale-95 font-heading"
            >
              <Zap className="w-4 h-4" />
              <span>{language === 'ne' ? 'भिडियो अपलोड गर्नुहोस् (Upload Free)' : 'Upload Lecture Video'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {onOpenAiEditor && (
              <button
                onClick={onOpenAiEditor}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#041534] hover:bg-[#1b2a4a] text-white border border-[#384668] font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all font-heading"
              >
                <Sparkles className="w-4 h-4 text-[#ffdcc5]" />
                <span>{language === 'ne' ? 'AI पाठ सम्पादक (AI Editor)' : 'AI Text Editor'}</span>
              </button>
            )}

            <button
              onClick={onStartCreating}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#243143] hover:bg-[#384668] text-white border border-[#384668] font-semibold text-sm transition-all"
            >
              {language === 'ne' ? 'प्रोजेक्टहरू हेर्नुहोस्' : 'Explore My Projects'}
            </button>
          </div>

          {/* Local Trust Badges */}
          <div className="pt-8 border-t border-[#384668]/60 flex flex-wrap items-center justify-center gap-6 text-xs text-[#8392b7]">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#ffdad9]" />
              <span>Machhapuchchhre Bank (MBL) Direct Settlement</span>
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>connectIPS / NepalPay Smart QR / eSewa</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-[#ffdcc5]" />
              <span>HMAC-SHA256 Signed Short-Lived Downloads</span>
            </span>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE DEMO PLAYER SHOWCASE */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-[#b6152e] uppercase tracking-wider font-heading">
            Live Interactive Editor Preview
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight font-heading">
            {language === 'ne' ? 'Submagic र Captions शैलीको भिडियो रूपान्तरण' : 'Submagic-Grade Captions with Silence Trimming'}
          </h2>
          <p className="text-xs sm:text-sm text-[#45464e]">
            {language === 'ne'
              ? 'तलका नियन्त्रणहरू चलाएर भिडियोको अनुपात (९:१६ वा १६:९), क्याप्सनको हाइलाइट शैली र पज कटिङको प्रत्यक्ष अनुभव लिनुहोस्:'
              : 'Try toggling aspect ratios, subtitle highlight styles, and silence cuts in real-time below:'}
          </p>
        </div>

        {/* Interactive Container */}
        <div className="max-w-4xl mx-auto bg-white border border-[#dde9ff] rounded-3xl p-6 sm:p-8 shadow-xl">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#dde9ff]">
            {/* Aspect Ratio Switch */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#45464e] font-heading">Aspect:</span>
              <div className="inline-flex bg-[#eff4ff] p-1 rounded-xl border border-[#dde9ff]">
                <button
                  onClick={() => setDemoAspect('9:16')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    demoAspect === '9:16' ? 'bg-[#1b2a4a] text-white shadow-sm' : 'text-[#45464e]'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>9:16 (Shorts/Reels)</span>
                </button>
                <button
                  onClick={() => setDemoAspect('16:9')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    demoAspect === '16:9' ? 'bg-[#1b2a4a] text-white shadow-sm' : 'text-[#45464e]'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>16:9 (YouTube/Class)</span>
                </button>
              </div>
            </div>

            {/* Caption Style Switch */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#45464e] font-heading">Style:</span>
              <div className="inline-flex bg-[#eff4ff] p-1 rounded-xl border border-[#dde9ff]">
                <button
                  onClick={() => setDemoStyle('submagic')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    demoStyle === 'submagic' ? 'bg-[#e07a1e] text-white' : 'text-[#45464e]'
                  }`}
                >
                  Submagic Word
                </button>
                <button
                  onClick={() => setDemoStyle('bold')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    demoStyle === 'bold' ? 'bg-[#1b2a4a] text-white' : 'text-[#45464e]'
                  }`}
                >
                  Bold Clean
                </button>
                <button
                  onClick={() => setDemoStyle('classic')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    demoStyle === 'classic' ? 'bg-[#1b2a4a] text-white' : 'text-[#45464e]'
                  }`}
                >
                  Classic Box
                </button>
              </div>
            </div>

            {/* Silence Cut Toggle */}
            <button
              onClick={() => setDemoCutPauses(!demoCutPauses)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                demoCutPauses
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-gray-100 text-gray-600 border-gray-300'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>{demoCutPauses ? 'Dead Pauses Cut (-14s)' : 'Raw Pauses Kept'}</span>
            </button>
          </div>

          {/* Interactive Player Frame */}
          <div className="mt-6 flex flex-col md:flex-row items-center justify-center gap-8">
            <div
              className={`relative bg-[#041534] rounded-2xl border-4 border-[#1b2a4a] shadow-2xl overflow-hidden flex flex-col justify-between p-4 transition-all duration-300 ${
                demoAspect === '9:16'
                  ? 'w-[260px] h-[460px]'
                  : 'w-full max-w-[540px] h-[300px]'
              }`}
            >
              {/* Top Watermark / Status */}
              <div className="flex items-center justify-between z-10">
                <span className="px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono border border-white/20">
                  {demoAspect === '9:16' ? 'Reels 1080x1920' : 'Lecture 1920x1080'}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#b6152e] text-white text-[10px] font-bold">
                  SEE Physics Prep
                </span>
              </div>

              {/* Center Talking Head Mockup */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-[#1b2a4a] to-[#384668] border-2 border-white/20 flex flex-col items-center justify-center text-white/70">
                  <GraduationCap className="w-12 h-12 text-[#ffb783] mb-1" />
                  <span className="text-[11px] font-semibold text-center px-2">
                    शिक्षक: राम कार्की
                  </span>
                </div>
              </div>

              {/* Subtitles Overlay */}
              <div className="z-10 text-center space-y-1">
                {demoStyle === 'submagic' && (
                  <div className="inline-flex flex-wrap items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-black/75 backdrop-blur-sm border border-white/20">
                    {demoWords.map((w, idx) => (
                      <span
                        key={idx}
                        onClick={() => setActiveWordIdx(idx)}
                        className={`text-sm sm:text-base font-black uppercase tracking-wide cursor-pointer transition-transform ${
                          idx === activeWordIdx
                            ? 'text-[#ffe500] scale-110 drop-shadow-[0_2px_8px_rgba(255,229,0,0.8)]'
                            : 'text-white hover:text-gray-200'
                        }`}
                      >
                        {w.ne}
                      </span>
                    ))}
                  </div>
                )}

                {demoStyle === 'bold' && (
                  <div className="inline-block px-4 py-1.5 rounded-lg bg-black/85 text-white font-black text-sm tracking-wide border border-white/20">
                    नमस्ते, आज हामी न्यूटनको दोस्रो नियम पढ्दैछौँ।
                  </div>
                )}

                {demoStyle === 'classic' && (
                  <div className="inline-block px-3 py-1 bg-black/90 text-[#ffeed3] text-xs font-medium border-b-2 border-[#b6152e]">
                    नमस्ते, आज हामी न्यूटनको दोस्रो नियम पढ्दैछौँ।
                  </div>
                )}

                <p className="text-[10px] text-white/80 font-mono italic">
                  Hello, today we are studying Newton&apos;s Second Law.
                </p>
              </div>
            </div>

            {/* Feature Callouts next to player */}
            <div className="max-w-xs space-y-4 text-xs text-[#45464e]">
              <div className="p-3.5 rounded-2xl bg-[#eff4ff] border border-[#dde9ff] space-y-1">
                <span className="font-bold text-[#1b2a4a] block font-heading flex items-center gap-1.5">
                  <Scissors className="w-4 h-4 text-[#b6152e]" />
                  <span>Conservative Silence Trimming</span>
                </span>
                <p className="text-[11px]">
                  नेपाली बोलीको स्वाभाविक लय कायम राख्दै अनावश्यक २+ सेकेन्डका लामा पज मात्र काटिन्छ।
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#eff4ff] border border-[#dde9ff] space-y-1">
                <span className="font-bold text-[#1b2a4a] block font-heading flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-[#e07a1e]" />
                  <span>EBU R128 Sound Normalization</span>
                </span>
                <p className="text-[11px]">
                  कक्षाकोठामा रेकर्ड गरिएको मन्द वा चर्को आवाजलाई मानक -१४ LUFS मा सन्तुलित गरिन्छ।
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#eff4ff] border border-[#dde9ff] space-y-1">
                <span className="font-bold text-[#1b2a4a] block font-heading flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#2d7d1b]" />
                  <span>Exam Revision Pack (SEE / Lok Sewa)</span>
                </span>
                <p className="text-[11px]">
                  भिडियोबाट १० वटा नमुना परीक्षा प्रश्नोत्तर, उत्तरपुस्तिका र सुत्र नोटहरू स्वतः जेनेरेट।
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. COMPETITOR COMPARISON TABLE */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-[#b6152e] uppercase tracking-wider font-heading">
            Nepal Market Advantage
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight font-heading">
            {language === 'ne' ? 'एडिटफ्लो किन विदेशी सफ्टवेयरभन्दा उत्तम छ?' : 'Why Editflow vs. Descript, Submagic & OpusClip'}
          </h2>
          <p className="text-xs sm:text-sm text-[#45464e]">
            {language === 'ne'
              ? 'विदेशी एपहरूको महँगो डलर शुल्क र नेपाली भाषा नबुझ्ने समस्यालाई एडिटफ्लोले पूर्ण अन्त्य गर्दछ।'
              : 'Built specifically for Nepali educators with local bank settlement and Devanagari models.'}
          </p>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-[#dde9ff] shadow-md bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1b2a4a] text-white border-b border-[#041534]">
                <th className="p-4 sm:p-5 font-bold font-heading">विशेषता (Feature)</th>
                <th className="p-4 sm:p-5 font-bold font-heading bg-[#b6152e] text-white text-center">
                  Editflow (नेपाल)
                </th>
                <th className="p-4 sm:p-5 font-bold font-heading text-center text-[#cddbf2]">Descript</th>
                <th className="p-4 sm:p-5 font-bold font-heading text-center text-[#cddbf2]">Submagic</th>
                <th className="p-4 sm:p-5 font-bold font-heading text-center text-[#cddbf2]">OpusClip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dde9ff] text-[#0f1c2d]">
              {/* Nepali Speech & Devanagari */}
              <tr className="hover:bg-[#eff4ff]/50">
                <td className="p-4 font-semibold text-[#1b2a4a]">
                  नेपाली देवनागरी बोली तथा क्याप्सन (Nepali STT)
                </td>
                <td className="p-4 text-center bg-[#b6152e]/5 font-bold text-emerald-700">
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>पूर्ण समर्थित</span>
                  </span>
                </td>
                <td className="p-4 text-center text-[#75777f]">अपूर्ण / अङ्ग्रेजी मात्र</td>
                <td className="p-4 text-center text-[#75777f]">अपूर्ण अनुवाद</td>
                <td className="p-4 text-center text-[#75777f]">नेपाली उपलब्ध छैन</td>
              </tr>

              {/* Machhapuchchhre Bank / connectIPS Settlement */}
              <tr className="hover:bg-[#eff4ff]/50">
                <td className="p-4 font-semibold text-[#1b2a4a]">
                  स्थानीय भुक्तानी (MBL, connectIPS, QR, eSewa)
                </td>
                <td className="p-4 text-center bg-[#b6152e]/5 font-bold text-emerald-700">
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>माछापुच्छ्रे बैंक सिधा जम्मा</span>
                  </span>
                </td>
                <td className="p-4 text-center text-red-600">डलर क्रेडिट कार्ड मात्र ($२४/mo)</td>
                <td className="p-4 text-center text-red-600">डलर कार्ड मात्र ($५०/mo)</td>
                <td className="p-4 text-center text-red-600">डलर कार्ड मात्र ($२९/mo)</td>
              </tr>

              {/* Exam Lesson Pack Generator */}
              <tr className="hover:bg-[#eff4ff]/50">
                <td className="p-4 font-semibold text-[#1b2a4a]">
                  परीक्षा तयारी सामग्री जेनेरेटर (SEE/+2/Lok Sewa)
                </td>
                <td className="p-4 text-center bg-[#b6152e]/5 font-bold text-emerald-700">
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>१० नमुना प्रश्न + सुत्र</span>
                  </span>
                </td>
                <td className="p-4 text-center text-[#75777f]">छैन</td>
                <td className="p-4 text-center text-[#75777f]">छैन</td>
                <td className="p-4 text-center text-[#75777f]">छैन</td>
              </tr>

              {/* Non-destructive Straight Cuts */}
              <tr className="hover:bg-[#eff4ff]/50">
                <td className="p-4 font-semibold text-[#1b2a4a]">
                  नन-डिस्ट्रक्टिभ पज कट (Non-destructive Keep Ranges)
                </td>
                <td className="p-4 text-center bg-[#b6152e]/5 font-bold text-emerald-700">
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>मूल फुटेज सुरक्षित</span>
                  </span>
                </td>
                <td className="p-4 text-center text-emerald-700">समर्थित</td>
                <td className="p-4 text-center text-[#75777f]">सिमित</td>
                <td className="p-4 text-center text-[#75777f]">स्वतः काटिने (फिर्ता नहुने)</td>
              </tr>

              {/* Security & Signed URLs */}
              <tr className="hover:bg-[#eff4ff]/50">
                <td className="p-4 font-semibold text-[#1b2a4a]">
                  सुरक्षित निजी फाइल (HMAC-SHA256 Signed Links)
                </td>
                <td className="p-4 text-center bg-[#b6152e]/5 font-bold text-emerald-700">
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>१५ मिनेट डिजिटल हस्ताक्षर</span>
                  </span>
                </td>
                <td className="p-4 text-center text-emerald-700">समर्थित</td>
                <td className="p-4 text-center text-[#75777f]">साधारण लिङ्क</td>
                <td className="p-4 text-center text-[#75777f]">पब्लिक CDN लिङ्क</td>
              </tr>

              {/* Price in NPR */}
              <tr className="bg-[#eff4ff]/80 font-bold">
                <td className="p-4 text-[#1b2a4a]">मासिक शुल्क (NPR)</td>
                <td className="p-4 text-center bg-[#b6152e]/10 text-[#b6152e] text-sm font-mono">
                  रु. १,४९९ / महिना
                </td>
                <td className="p-4 text-center text-[#45464e] font-mono">~ रु. ३,४००</td>
                <td className="p-4 text-center text-[#45464e] font-mono">~ रु. ६,८००</td>
                <td className="p-4 text-center text-[#45464e] font-mono">~ रु. ४,०००</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. PRICING TIERS HIGHLIGHT */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold text-[#b6152e] uppercase tracking-wider font-heading">
            Transparent Nepali Pricing
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight font-heading">
            {language === 'ne' ? 'सस्तो, सरल र भरपर्दो सदस्यता' : 'Affordable Pricing for Nepali Educators'}
          </h2>
          <p className="text-xs text-[#45464e]">
            {language === 'ne'
              ? 'माछापुच्छ्रे बैंक, connectIPS वा eSewa बाट भुक्तानी गर्नुहोस्। कुनै लुकेको शुल्क छैन।'
              : 'Pay directly via Machhapuchchhre Bank or wallets in Nepalese Rupees.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Free */}
          <div className="bg-white border border-[#dde9ff] rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-[#45464e] uppercase font-heading">Free Starter</span>
              <div className="mt-2 mb-4">
                <span className="text-3xl font-black text-[#0f1c2d] font-mono">रु. ०</span>
                <span className="text-xs text-[#75777f] ml-1">/ सधैंका लागि</span>
              </div>
              <ul className="space-y-2.5 text-xs text-[#45464e]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>१० मिनेट भिडियो इनपुट</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>नन-डिस्ट्रक्टिभ पज कट</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>नेपाली सबटाइटल सम्पादक</span>
                </li>
              </ul>
            </div>
            <button
              onClick={onOpenUpload}
              className="mt-6 w-full py-2.5 rounded-xl border border-[#1b2a4a] text-[#1b2a4a] font-bold text-xs hover:bg-[#eff4ff] transition-all"
            >
              नि:शुल्क सुरु गर्नुहोस्
            </button>
          </div>

          {/* Teacher Pro */}
          <div className="relative bg-white border-2 border-[#e07a1e] rounded-3xl p-6 shadow-xl flex flex-col justify-between ring-4 ring-[#e07a1e]/10">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#e07a1e] text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-sm">
              शिक्षकहरूका लागि उत्तम
            </span>
            <div>
              <span className="text-xs font-bold text-[#e07a1e] uppercase font-heading">Teacher Pro</span>
              <div className="mt-2 mb-4">
                <span className="text-3xl font-black text-[#0f1c2d] font-mono">रु. १,४९९</span>
                <span className="text-xs text-[#75777f] ml-1">/ महिना</span>
              </div>
              <ul className="space-y-2.5 text-xs text-[#45464e]">
                <li className="flex items-center gap-2 font-semibold text-[#0f1c2d]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#e07a1e] shrink-0" />
                  <span>१२० मिनेट मासिक प्रशोधन</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#e07a1e] shrink-0" />
                  <span>Submagic वर्ड-हाइलाइट क्याप्सन</span>
                </li>
                <li className="flex items-center gap-2 font-semibold text-[#0f1c2d]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#e07a1e] shrink-0" />
                  <span>१० नमुना परीक्षा प्रश्नोत्तर जेनेरेटर</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#e07a1e] shrink-0" />
                  <span>१०८०p HD एक्सपोर्ट & Signed Links</span>
                </li>
              </ul>
            </div>
            <button
              onClick={onOpenPricing}
              className="mt-6 w-full py-2.5 rounded-xl bg-[#e07a1e] hover:bg-[#c96815] text-white font-bold text-xs shadow-md transition-all font-heading"
            >
              अहिले अपग्रेड गर्नुहोस्
            </button>
          </div>

          {/* Institute Unlimited */}
          <div className="bg-white border border-[#dde9ff] rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-[#5c2d91] uppercase font-heading">Institute Unlimited</span>
              <div className="mt-2 mb-4">
                <span className="text-3xl font-black text-[#0f1c2d] font-mono">रु. ४,९९९</span>
                <span className="text-xs text-[#75777f] ml-1">/ महिना</span>
              </div>
              <ul className="space-y-2.5 text-xs text-[#45464e]">
                <li className="flex items-center gap-2 font-semibold text-[#0f1c2d]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#5c2d91] shrink-0" />
                  <span>३६० मिनेट मासिक प्रशोधन</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#5c2d91] shrink-0" />
                  <span>मल्टि-फ्याकल्टी / टिचर पहुँच</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#5c2d91] shrink-0" />
                  <span>संस्थाको आफ्नै ब्राण्ड वाटरमार्क</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#5c2d91] shrink-0" />
                  <span>आधिकारिक भ्याट/प्यान बिल</span>
                </li>
              </ul>
            </div>
            <button
              onClick={onOpenPricing}
              className="mt-6 w-full py-2.5 rounded-xl bg-[#1b2a4a] hover:bg-[#041534] text-white font-bold text-xs shadow-md transition-all"
            >
              इन्स्टिच्युट योजना रोज्नुहोस्
            </button>
          </div>
        </div>
      </section>

      {/* 5. TESTIMONIALS */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold text-[#b6152e] uppercase tracking-wider font-heading">
            Trusted by Nepali Educators
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight font-heading">
            {language === 'ne' ? 'नेपालका शिक्षक तथा संस्थाहरूको अनुभव' : 'Loved by Teachers & Entrance Institutes'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto text-xs">
          <div className="bg-white border border-[#dde9ff] rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <p className="text-[#45464e] leading-relaxed italic">
              &quot;पहिले १ घण्टाको कक्षा रेकर्ड गर्दा पज काट्न र सबटाइटल लेख्न ३ घण्टा लाग्थ्यो। एडिटफ्लोमा अपलोड गर्नासाथ पजहरू आफैँ ट्रिम हुन्छन् र नेपाली क्याप्सन तुरुन्तै तयार हुन्छ।&quot;
            </p>
            <div className="pt-2 border-t border-[#dde9ff] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#1b2a4a] text-white flex items-center justify-center font-bold">
                र
              </div>
              <div>
                <p className="font-bold text-[#0f1c2d]">रमेश अधिकारी</p>
                <p className="text-[10px] text-[#75777f]">विज्ञान शिक्षक, SEE बोर्ड तयारी (काठमाडौं)</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#dde9ff] rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <p className="text-[#45464e] leading-relaxed italic">
              &quot;माछापुच्छ्रे बैंक र connectIPS बाट सिधा भुक्तानी गर्न पाउँदा एकदम सजिलो भयो। विदेशी डलर कार्ड नहुँदा पनि हाम्रो इन्स्टिच्युटले सजिलै प्रो एकाउन्ट सक्रिय गर्‍यो।&quot;
            </p>
            <div className="pt-2 border-t border-[#dde9ff] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#b6152e] text-white flex items-center justify-center font-bold">
                P
              </div>
              <div>
                <p className="font-bold text-[#0f1c2d]">PEA Entrance Academy</p>
                <p className="text-[10px] text-[#75777f]">IOE / IOM इन्ट्रान्स कोचिङ, पुतलीसडक</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#dde9ff] rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <p className="text-[#45464e] leading-relaxed italic">
              &quot;भिडियोबाट १० वटा नमुना प्रश्न र मोडल उत्तर तुरुन्तै निक्लिन्छ। विद्यार्थीहरूलाई रिभिजन नोट दिन हाम्रो शिक्षक टोलीको दैनिक २ घण्टा बचत भएको छ।&quot;
            </p>
            <div className="pt-2 border-t border-[#dde9ff] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#5c2d91] text-white flex items-center justify-center font-bold">
                स
              </div>
              <div>
                <p className="font-bold text-[#0f1c2d]">सरोज श्रेष्ठ</p>
                <p className="text-[10px] text-[#75777f]">लोक सेवा आयोग (ना.सु./अधिकृत) प्रशिक्षक</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ ACCORDION */}
      <section className="space-y-6 max-w-3xl mx-auto">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-[#b6152e] uppercase tracking-wider font-heading">
            Frequently Asked Questions
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight font-heading">
            {language === 'ne' ? 'प्रायः सोधिने प्रश्नहरू' : 'Frequently Asked Questions'}
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white border border-[#dde9ff] rounded-2xl overflow-hidden transition-all shadow-sm"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-[#0f1c2d] hover:bg-[#eff4ff]/60 transition-colors"
                >
                  <span>{language === 'ne' ? faq.qNe : faq.qEn}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#b6152e] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#75777f] shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-4 text-xs text-[#45464e] leading-relaxed border-t border-[#dde9ff] pt-3 bg-[#f8f9ff]">
                    {language === 'ne' ? faq.aNe : faq.aEn}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. BOTTOM CTA BANNER */}
      <section className="rounded-3xl bg-[#1b2a4a] text-white p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-2xl sm:text-4xl font-bold font-heading tracking-tight">
            {language === 'ne'
              ? 'आफ्नो पहिलो कक्षा भिडियो आजै नि:शुल्क सम्पादन गर्नुहोस्'
              : 'Start Polishing Your First Lecture Video Today'}
          </h2>
          <p className="text-xs sm:text-sm text-[#cddbf2]">
            {language === 'ne'
              ? 'कुनै क्रेडिट कार्ड आवश्यक छैन। अपलोड गर्नुहोस् र नन-डिस्ट्रक्टिभ पज कट र द्विभाषिक सबटाइटल सुरु गर्नुहोस्।'
              : 'No credit card needed. Upload any raw video and turn it into exam-ready lessons.'}
          </p>
          <div className="pt-2">
            <button
              onClick={onOpenUpload}
              className="px-8 py-3.5 rounded-2xl bg-[#b6152e] hover:bg-[#92001f] text-white font-bold text-xs sm:text-sm shadow-xl transition-all active:scale-95 font-heading"
            >
              {language === 'ne' ? 'भिडियो अपलोड गर्नुहोस् (Start Free)' : 'Get Started for Free'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
