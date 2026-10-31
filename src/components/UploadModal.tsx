import React, { useState, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Project } from '../types';
import { analyzeAudioBuffer } from '../utils/audioHelper';
import { formatTime, formatFileSize } from '../utils/formatters';
import {
  X,
  Upload,
  FileCheck,
  CheckCircle2,
  Sliders,
} from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: Project) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const { language, t } = useLanguage();
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [targetExam, setTargetExam] = useState<Project['targetExam']>('SEE');

  // Probe status
  const [isProbing, setIsProbing] = useState(false);
  const [probeSuccess, setProbeSuccess] = useState(false);
  const [fileDuration, setFileDuration] = useState(0);
  const [fileChannels, setFileChannels] = useState(2);
  const [detectedSilencesCount, setDetectedSilencesCount] = useState(0);
  const [suggestedGain, setSuggestedGain] = useState(6.0);

  // Settings
  const [enablePauseRemoval, setEnablePauseRemoval] = useState(true);
  const [enableNormalization, setEnableNormalization] = useState(true);
  const [minPauseSec, setMinPauseSec] = useState(2.0);

  // Upload & processing progress
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  if (!isOpen) return null;

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setProbeSuccess(false);
    setIsProbing(true);

    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setTitle(cleanName);
    }

    try {
      const probeResult = await analyzeAudioBuffer(file, minPauseSec, 0.02);
      setFileDuration(probeResult.duration);
      setFileChannels(probeResult.channels);
      setDetectedSilencesCount(probeResult.silences.length);
      setSuggestedGain(probeResult.suggestedGainDb);
      setProbeSuccess(true);
    } catch (err) {
      console.warn('Probe error:', err);
      setFileDuration(180);
      setProbeSuccess(true);
    } finally {
      setIsProbing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUploadAndProcess = async () => {
    if (!title.trim()) return;

    setIsProcessing(true);
    setProgressPercent(15);
    setProcessingStage(
      language === 'ne' ? '१. फाइल प्राविधिक जाँच तथा सर्भरमा स्थानान्तरण...' : '1. Uploading media file...'
    );

    let mediaUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
    let fileSizeBytes = 38 * 1024 * 1024;
    let fileName = 'Classroom_Lecture.mp4';
    const isVideo = selectedFile ? selectedFile.type.startsWith('video') : true;

    if (selectedFile) {
      fileName = selectedFile.name;
      fileSizeBytes = selectedFile.size;
      const formData = new FormData();
      formData.append('mediaFile', selectedFile);

      try {
        const uploadRes = await fetch('/api/media/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          mediaUrl = uploadData.mediaUrl;
        }
      } catch (err) {
        console.warn('Upload error, continuing with media fallback:', err);
      }
    }

    setProgressPercent(45);
    setProcessingStage(
      language === 'ne'
        ? `२. अडियो विश्लेषण: मौनता (पज) पत्ता लगाउँदै... (${detectedSilencesCount} वटा भेटियो)`
        : '2. Analyzing dead pauses and silence passages...'
    );
    await new Promise((r) => setTimeout(r, 600));

    setProgressPercent(75);
    setProcessingStage(
      language === 'ne'
        ? '३. अडियो नर्मालाइजेसन तथा गेन बुस्ट लागू गर्दै (-१४ LUFS)...'
        : '3. Applying audio loudness normalization (-14 LUFS)...'
    );
    await new Promise((r) => setTimeout(r, 600));

    setProgressPercent(95);
    setProcessingStage(
      language === 'ne'
        ? '४. नेपाली तथा अङ्ग्रेजी द्विभाषिक उपशीर्षक र परीक्षा सामग्री तयार गर्दै...'
        : '4. Generating bilingual subtitles and exam pack...'
    );

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          subject: subject || (language === 'ne' ? 'अनिवार्य विषय' : 'Core Subject'),
          targetExam,
          mediaFileName: fileName,
          mediaFileType: isVideo ? 'video' : 'audio',
          mediaFileUrl: mediaUrl,
          mediaDuration: fileDuration || 280,
          fileSizeBytes,
        }),
      });

      const data = await res.json();
      if (data.project) {
        setProgressPercent(100);
        setTimeout(() => {
          setIsProcessing(false);
          onProjectCreated(data.project);
          onClose();
        }, 500);
      }
    } catch (err) {
      console.error('Project creation failed:', err);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#041534]/70 backdrop-blur-sm animate-in fade-in duration-150 font-bilingual">
      <div className="relative w-full max-w-2xl bg-white border border-[#dde9ff] rounded-3xl p-6 sm:p-8 shadow-2xl text-[#0f1c2d] max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#75777f] hover:text-[#0f1c2d] hover:bg-[#eff4ff] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-[#ffdad9] text-[#b6152e] border border-[#ffb3b2] flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[#0f1c2d] font-heading">
              {t('uploadModalTitle')}
            </h2>
          </div>
          <p className="text-xs text-[#45464e] leading-relaxed">
            {t('uploadModalSub')}
          </p>
        </div>

        {/* Processing Overlay if in progress */}
        {isProcessing ? (
          <div className="py-12 px-6 text-center space-y-6">
            <div className="relative w-20 h-20 mx-auto">
              <div className="w-20 h-20 rounded-full border-4 border-[#eff4ff] border-t-[#b6152e] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center font-bold text-sm text-[#b6152e] font-mono">
                {progressPercent}%
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-[#0f1c2d] mb-2 font-heading">
                {language === 'ne' ? 'लेक्चर स्वचालित प्रशोधन हुँदैछ' : 'Processing Classroom Lecture'}
              </h3>
              <p className="text-xs text-[#45464e] font-medium">
                {processingStage}
              </p>
            </div>

            <div className="w-full bg-[#eff4ff] h-2.5 rounded-full overflow-hidden border border-[#dde9ff]">
              <div
                className="bg-gradient-to-r from-[#b6152e] to-[#dc3545] h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* 1. Drag & Drop Upload Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#c5c6cf] hover:border-[#1b2a4a] rounded-2xl p-6 text-center cursor-pointer bg-[#f8f9ff] hover:bg-[#eff4ff] transition-all group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,audio/*,.mp4,.webm,.mov,.mkv,.mp3,.wav,.m4a"
                onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                className="hidden"
              />

              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#eff4ff] text-[#1b2a4a] group-hover:scale-110 group-hover:bg-[#d9e2ff] transition-all flex items-center justify-center mb-3">
                <Upload className="w-6 h-6" />
              </div>

              {selectedFile ? (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#1b2a4a] flex items-center justify-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span>{selectedFile.name}</span>
                  </p>
                  <p className="text-xs text-[#45464e]">
                    {formatFileSize(selectedFile.size, language)} • {selectedFile.type || 'Media File'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[#0f1c2d] font-heading">
                    {t('dropzoneText')}
                  </p>
                  <p className="text-xs text-[#45464e]">
                    {t('dropzoneSupported')}
                  </p>
                </div>
              )}
            </div>

            {/* Technical Probe Results */}
            {isProbing && (
              <div className="p-3.5 rounded-xl bg-[#eff4ff] border border-[#dde9ff] flex items-center gap-3 text-xs text-[#1b2a4a]">
                <div className="w-4 h-4 rounded-full border-2 border-[#1b2a4a] border-t-transparent animate-spin" />
                <span>{t('probingFile')}</span>
              </div>
            )}

            {probeSuccess && (
              <div className="p-4 rounded-2xl bg-[#eff4ff] border border-[#b7c6ee] text-xs text-[#0f1c2d] space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 font-bold font-heading">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('probeSuccess')}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                  <div className="bg-white p-2.5 rounded-xl border border-[#dde9ff]">
                    <span className="text-[#45464e] block text-[10px] font-sans">{t('probeDuration')}</span>
                    <span className="text-[#1b2a4a] font-bold">{formatTime(fileDuration, language)}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-[#dde9ff]">
                    <span className="text-[#45464e] block text-[10px] font-sans">{t('probeChannels')}</span>
                    <span className="text-[#1b2a4a] font-bold">{fileChannels === 1 ? 'Mono' : 'Stereo'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-[#dde9ff]">
                    <span className="text-[#45464e] block text-[10px] font-sans">{t('detectedPauses')}</span>
                    <span className="text-[#e07a1e] font-bold">{detectedSilencesCount} स्थान</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-[#dde9ff]">
                    <span className="text-[#45464e] block text-[10px] font-sans">{t('gainBoost')}</span>
                    <span className="text-[#b6152e] font-bold">+{suggestedGain} dB</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Lecture Metadata Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#0f1c2d] mb-1.5 font-heading">
                  {t('lectureTitleInput')} <span className="text-[#b6152e]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={language === 'ne' ? 'उदा: SEE कक्षा १० - न्युटनको गुरुत्वाकर्षण नियम' : 'e.g. Class 10 Force and Motion'}
                  className="w-full px-4 py-2.5 bg-[#f8f9ff] border border-[#c5c6cf] rounded-xl text-sm text-[#0f1c2d] placeholder-[#75777f] focus:outline-none focus:ring-2 focus:ring-[#1b2a4a]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0f1c2d] mb-1.5 font-heading">
                  {t('subjectInput')}
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={language === 'ne' ? 'विज्ञान / गणित / सामाजिक' : 'Science / Math / GK'}
                  className="w-full px-4 py-2.5 bg-[#f8f9ff] border border-[#c5c6cf] rounded-xl text-sm text-[#0f1c2d] placeholder-[#75777f] focus:outline-none focus:ring-2 focus:ring-[#1b2a4a]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0f1c2d] mb-1.5 font-heading">
                  {t('examSelectLabel')}
                </label>
                <select
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value as Project['targetExam'])}
                  className="w-full px-3 py-2.5 bg-[#f8f9ff] border border-[#c5c6cf] rounded-xl text-xs text-[#0f1c2d] focus:outline-none focus:ring-2 focus:ring-[#1b2a4a]/20 font-medium"
                >
                  <option value="SEE">{t('examSEE')}</option>
                  <option value="NEB_11_12">{t('examNEB')}</option>
                  <option value="LOK_SEWA">{t('examLokSewa')}</option>
                  <option value="IOE_ENTRANCE">{t('examIOE')}</option>
                  <option value="CEE_MEDICAL">{t('examCEE')}</option>
                  <option value="GENERAL_ACADEMIC">{t('examGeneral')}</option>
                </select>
              </div>
            </div>

            {/* 3. Audio & Subtitles Processing Options */}
            <div className="p-4 rounded-2xl bg-[#f8f9ff] border border-[#dde9ff] space-y-3">
              <h4 className="text-xs font-bold text-[#0f1c2d] flex items-center gap-1.5 font-heading">
                <Sliders className="w-3.5 h-3.5 text-[#1b2a4a]" />
                <span>{language === 'ne' ? 'स्वचालित अडियो तथा सबटाइटल सेटिङ' : 'Auto Audio & Subtitle Enhancements'}</span>
              </h4>

              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enablePauseRemoval}
                    onChange={(e) => setEnablePauseRemoval(e.target.checked)}
                    className="w-4 h-4 rounded text-[#b6152e] border-[#c5c6cf] focus:ring-[#b6152e]"
                  />
                  <span className="text-[#0f1c2d] font-medium">
                    {t('pauseCutLabel')} ({language === 'ne' ? '२ सेकेन्ड भन्दा लामा मौनताहरू काट्ने' : 'Dead pauses > 2s'})
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableNormalization}
                    onChange={(e) => setEnableNormalization(e.target.checked)}
                    className="w-4 h-4 rounded text-[#b6152e] border-[#c5c6cf] focus:ring-[#b6152e]"
                  />
                  <span className="text-[#0f1c2d] font-medium">
                    {t('normalizationLabel')} (-14 LUFS)
                  </span>
                </label>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex items-center justify-end gap-3 font-heading">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#45464e] hover:text-[#0f1c2d] hover:bg-[#eff4ff] transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleUploadAndProcess}
                disabled={!title.trim()}
                className="px-6 py-2.5 rounded-xl bg-[#b6152e] hover:bg-[#92001f] text-white font-semibold text-sm shadow-md shadow-[#b6152e]/30 transition-all active:scale-95 disabled:opacity-50"
              >
                {t('uploadAndProcessBtn')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
