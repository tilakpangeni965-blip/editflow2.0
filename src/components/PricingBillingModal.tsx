import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { PlanType, PaymentGateway, PaymentTransaction } from '../types';
import { formatCurrency, toNepaliNumerals } from '../utils/formatters';
import { InvoiceReceiptModal } from './InvoiceReceiptModal';
import confetti from 'canvas-confetti';
import {
  X,
  Check,
  Sparkles,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building,
  ArrowRight,
  Receipt,
  QrCode,
  Copy,
  Lock,
  KeyRound,
  Send,
  Building2,
  CheckCircle,
} from 'lucide-react';

interface PricingBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PricingBillingModal: React.FC<PricingBillingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { language, t } = useLanguage();
  const { user, token, updateUserPlan } = useAuth();

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway>('mbl_connectips');

  // Checkout inputs
  const [payerName, setPayerName] = useState(user?.name || '');
  const [payerPhone, setPayerPhone] = useState(user?.phone || '9841234567');
  const [panNumber, setPanNumber] = useState('');
  const [instituteName, setInstituteName] = useState(user?.instituteName || '');

  // Active Transaction for Multi-stage Flow
  const [activeTxn, setActiveTxn] = useState<PaymentTransaction | null>(null);

  // MBL Stage tracking: 'INITIATED' -> 'AWAITING_SETTLEMENT' -> 'OTP_ISSUED' -> 'VERIFIED'
  const [mblStage, setMblStage] = useState<'form' | 'settlement' | 'otp' | 'done'>('form');
  const [bankUtrReference, setBankUtrReference] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [lastIssuedOtp, setLastIssuedOtp] = useState('');
  const [copiedAcc, setCopiedAcc] = useState(false);

  // Gateway Simulation credentials (for eSewa / Khalti)
  const [gatewayMobile, setGatewayMobile] = useState('9841234567');
  const [gatewayMpin, setGatewayMpin] = useState('1234');
  const [khaltiOtp, setKhaltiOtp] = useState('892341');

  // Statuses
  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verifiedTransaction, setVerifiedTransaction] = useState<PaymentTransaction | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const currentPlan = user?.plan || 'free';

  const handleSelectPlan = (plan: PlanType) => {
    if (plan === 'free') return;
    setSelectedPlan(plan);
    setErrorMsg('');
    setMblStage('form');
    setActiveTxn(null);
  };

  const copyAccountNumber = () => {
    navigator.clipboard.writeText('00200845920019');
    setCopiedAcc(true);
    setTimeout(() => setCopiedAcc(false), 2500);
  };

  // Step 1: Initiate Payment
  const handleInitiatePayment = async () => {
    if (!selectedPlan) return;
    setIsProcessing(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan: selectedPlan,
          gateway: selectedGateway,
          billingCycle,
          payerName: payerName || user?.name || 'नेपाली शिक्षक',
          payerPhone: payerPhone || '9841234567',
          panNumber,
          instituteName: instituteName || user?.instituteName,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.transaction) {
        throw new Error(data.error || 'Failed to initiate payment');
      }

      const txn = data.transaction as PaymentTransaction;
      setActiveTxn(txn);

      const isMblOrBank = ['mbl_connectips', 'mbl_qr', 'bank_transfer'].includes(selectedGateway);

      if (isMblOrBank) {
        setMblStage('settlement');
        // Pre-fill demo UTR for quick testing
        setBankUtrReference(`MBL-UTR-${Math.floor(10000000 + Math.random() * 90000000)}`);
      } else {
        // eSewa or Khalti instant verification
        await handleVerifyWalletPayment(txn);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2-MBL: Submit Bank UTR to Server for Bank Settlement Verification
  const handleVerifyBankSettlement = async () => {
    if (!activeTxn || !bankUtrReference) {
      setErrorMsg('कृपया बैंक भौचर / UTR सन्दर्भ नम्बर हाल्नुहोस्');
      return;
    }
    setIsProcessing(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/payments/mbl/verify-settlement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          transactionId: activeTxn.id,
          bankUtrReference,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'बैंक सेटलमेन्ट प्रमाणीकरण असफल भयो।');
      }

      // Bank confirmed receipt in MBL Account 00200845920019!
      // Server issued OTP
      setActiveTxn(data.transaction);
      setLastIssuedOtp(data.otpIssued || '');
      setEnteredOtp(data.otpIssued || ''); // Auto-fill for test convenience
      setMblStage('otp');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 3-MBL: Confirm OTP and Activate Plan
  const handleConfirmOtpAndActivate = async () => {
    if (!activeTxn || !enteredOtp) {
      setErrorMsg('कृपया ६-अङ्कको सुरक्षा OTP हाल्नुहोस्');
      return;
    }
    setIsProcessing(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/payments/mbl/confirm-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          transactionId: activeTxn.id,
          otp: enteredOtp,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.verified) {
        throw new Error(data.error || 'अवैध OTP कोड');
      }

      updateUserPlan(selectedPlan!, data.updatedUser?.planExpiresAt);
      setVerifiedTransaction(data.transaction);
      setVerificationSuccess(true);
      setMblStage('done');
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Wallet payment verification (eSewa / Khalti)
  const handleVerifyWalletPayment = async (txn: PaymentTransaction) => {
    let verifyEndpoint = '/api/payments/verify-esewa';
    let verifyBody: Record<string, unknown> = {
      transactionId: txn.gatewayTransactionId,
      esewaRefId: `ESEWA-REF-${Math.floor(10000000 + Math.random() * 90000000)}`,
      amount: txn.amountNpr,
    };

    if (selectedGateway === 'khalti') {
      verifyEndpoint = '/api/payments/verify-khalti';
      verifyBody = {
        transactionId: txn.gatewayTransactionId,
        khaltiToken: `KHALTI-PIDX-${Math.floor(10000000 + Math.random() * 90000000)}`,
        mobile: gatewayMobile,
        otp: khaltiOtp,
      };
    }

    const verifyRes = await fetch(verifyEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(verifyBody),
    });

    const verifyData = await verifyRes.json();
    if (!verifyRes.ok || !verifyData.verified) {
      throw new Error(verifyData.error || t('serverVerificationFailed'));
    }

    updateUserPlan(selectedPlan!, verifyData.updatedUser?.planExpiresAt);
    setVerifiedTransaction(verifyData.transaction);
    setVerificationSuccess(true);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#041534]/70 backdrop-blur-sm animate-in fade-in duration-150 font-bilingual">
        <div className="relative w-full max-w-4xl bg-white border border-[#dde9ff] rounded-3xl p-6 sm:p-8 shadow-2xl text-[#0f1c2d] max-h-[90vh] overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-[#75777f] hover:text-[#0f1c2d] hover:bg-[#eff4ff] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Verification Success View */}
          {verificationSuccess && verifiedTransaction ? (
            <div className="py-10 px-6 text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 mb-2">
                  Machhapuchchhre Bank / NCHL Verified
                </span>
                <h3 className="text-2xl font-bold text-[#0f1c2d] font-heading">
                  {t('serverVerifiedSuccess')}
                </h3>
                <p className="text-sm text-[#45464e] mt-1 max-w-md mx-auto">
                  {language === 'ne'
                    ? `तपाईंको योजना "${verifiedTransaction.plan === 'teacher_pro' ? 'शिक्षक प्रो' : 'इन्स्टिच्युट अनलिमिटेड'}" सफलतापूर्वक सक्रिय भएको छ। बिजक र कर रसिद जारी भइसकेको छ।`
                    : `Your plan has been activated. Tax invoice #${verifiedTransaction.invoiceNumber} is issued and recorded with VAT/PAN details.`}
                </p>
              </div>

              {/* Transaction Summary Card */}
              <div className="max-w-md mx-auto bg-[#f8f9ff] border border-[#dde9ff] rounded-2xl p-4 text-left text-xs space-y-2">
                <div className="flex justify-between border-b border-[#dde9ff] pb-2 font-mono">
                  <span className="text-[#45464e]">{t('invoiceNo')}</span>
                  <span className="font-bold text-[#0f1c2d]">{verifiedTransaction.invoiceNumber}</span>
                </div>
                <div className="flex justify-between border-b border-[#dde9ff] pb-2">
                  <span className="text-[#45464e]">{t('paidVia')}</span>
                  <span className="font-bold uppercase text-[#1b2a4a]">
                    {verifiedTransaction.bankName || verifiedTransaction.gateway}
                  </span>
                </div>
                {verifiedTransaction.bankUtrReference && (
                  <div className="flex justify-between border-b border-[#dde9ff] pb-2 font-mono">
                    <span className="text-[#45464e]">Bank UTR / Clearing:</span>
                    <span className="font-bold text-[#2d7d1b]">{verifiedTransaction.bankUtrReference}</span>
                  </div>
                )}
                {verifiedTransaction.bankAccountNumber && (
                  <div className="flex justify-between border-b border-[#dde9ff] pb-2 font-mono">
                    <span className="text-[#45464e]">Settlement Account:</span>
                    <span className="font-bold text-[#0f1c2d]">MBL {verifiedTransaction.bankAccountNumber}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1">
                  <span className="text-[#45464e]">कुल भुक्तानी रकम:</span>
                  <span className="font-bold text-[#b6152e] text-sm font-mono">
                    {formatCurrency(verifiedTransaction.amountNpr, language)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setShowInvoiceModal(true)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#1b2a4a] hover:bg-[#041534] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm font-heading"
                >
                  <Receipt className="w-4 h-4 text-[#ffdad9]" />
                  <span>{t('viewTaxReceipt')}</span>
                </button>
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-[#dde9ff] hover:bg-[#eff4ff] text-[#0f1c2d] text-xs font-medium"
                >
                  {language === 'ne' ? 'स्टुडियोमा फर्किनुहोस्' : 'Return to Studio'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="text-center max-w-xl mx-auto mb-6">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#b6152e]/10 text-[#b6152e] border border-[#b6152e]/20 mb-2">
                  <Building2 className="w-3.5 h-3.5 text-[#b6152e]" />
                  <span>माछापुच्छ्रे बैंक तथा नेपाल भुक्तानी गेटवे</span>
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#0f1c2d] tracking-tight font-heading">
                  {t('billingTitle')}
                </h2>
                <p className="text-xs text-[#45464e] mt-1 font-bilingual leading-relaxed">
                  {t('billingSub')}
                </p>

                {/* Billing Cycle Toggle */}
                <div className="mt-4 inline-flex items-center bg-[#eff4ff] p-1 rounded-xl border border-[#dde9ff]">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      billingCycle === 'monthly'
                        ? 'bg-white text-[#1b2a4a] shadow-sm'
                        : 'text-[#45464e] hover:text-[#0f1c2d]'
                    }`}
                  >
                    {t('monthlyBilling')}
                  </button>
                  <button
                    onClick={() => setBillingCycle('annual')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      billingCycle === 'annual'
                        ? 'bg-[#1b2a4a] text-white shadow-sm'
                        : 'text-[#45464e] hover:text-[#0f1c2d]'
                    }`}
                  >
                    <span>{t('annualBilling')}</span>
                    <span className="text-[10px] bg-[#e07a1e] text-white px-1.5 py-0.2 rounded-full font-bold">
                      -१६%
                    </span>
                  </button>
                </div>
              </div>

              {/* Step 1: Plan Selection Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* 1. Free Starter */}
                <div
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                    currentPlan === 'free'
                      ? 'border-[#041534] bg-[#eff4ff]/60'
                      : 'border-[#dde9ff] bg-white opacity-85'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-[#1b2a4a] text-sm font-heading">
                        {t('planFreeTitle')}
                      </span>
                      {currentPlan === 'free' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1b2a4a] text-white font-medium">
                          {t('currentPlanBadge')}
                        </span>
                      )}
                    </div>
                    <div className="mb-3">
                      <span className="text-2xl font-black text-[#0f1c2d] font-mono">
                        {t('planFreePrice')}
                      </span>
                      <span className="text-xs text-[#75777f] ml-1">{t('planFreePeriod')}</span>
                    </div>
                    <ul className="space-y-2 text-xs text-[#45464e]">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{t('planFreeF1')}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{t('planFreeF2')}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{t('planFreeF3')}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{t('planFreeF4')}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#dde9ff]">
                    <button
                      disabled
                      className="w-full py-2 rounded-xl border border-[#c5c6cf] text-[#75777f] text-xs font-medium cursor-not-allowed"
                    >
                      {currentPlan === 'free' ? t('currentPlanBadge') : 'आधारभूत'}
                    </button>
                  </div>
                </div>

                {/* 2. Teacher Pro (Popular) */}
                <div
                  className={`relative p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                    selectedPlan === 'teacher_pro'
                      ? 'border-[#e07a1e] bg-amber-50/40 shadow-lg ring-2 ring-[#e07a1e]/20'
                      : currentPlan === 'teacher_pro'
                      ? 'border-emerald-500 bg-emerald-50/20'
                      : 'border-[#dde9ff] hover:border-[#e07a1e]/50 bg-white'
                  }`}
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#e07a1e] text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-sm">
                    शिक्षकहरूका लागि लोकप्रिय (Most Popular)
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-[#e07a1e] text-sm font-heading">
                        {t('planProTitle')}
                      </span>
                      {currentPlan === 'teacher_pro' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-medium">
                          {t('currentPlanBadge')}
                        </span>
                      )}
                    </div>
                    <div className="mb-3">
                      <span className="text-2xl font-black text-[#0f1c2d] font-mono">
                        {billingCycle === 'annual'
                          ? formatCurrency(12999, language)
                          : formatCurrency(1499, language)}
                      </span>
                      <span className="text-xs text-[#75777f] ml-1">
                        {billingCycle === 'annual' ? '/ वर्ष' : t('planProPeriod')}
                      </span>
                    </div>
                    <ul className="space-y-2 text-xs text-[#45464e]">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#e07a1e] shrink-0" />
                        <span className="font-semibold text-[#0f1c2d]">{t('planProF1')}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#e07a1e] shrink-0" />
                        <span>{t('planProF2')}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#e07a1e] shrink-0" />
                        <span>{t('planProF3')}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#e07a1e] shrink-0" />
                        <span className="font-semibold text-[#0f1c2d]">{t('planProF4')}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#e07a1e] shrink-0" />
                        <span>{t('planProF5')}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#dde9ff]">
                    <button
                      onClick={() => handleSelectPlan('teacher_pro')}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 ${
                        selectedPlan === 'teacher_pro'
                          ? 'bg-[#e07a1e] text-white shadow-md'
                          : 'bg-[#eff4ff] hover:bg-[#e07a1e] hover:text-white text-[#1b2a4a]'
                      } font-heading`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{selectedPlan === 'teacher_pro' ? 'योजना छानियो (Selected)' : t('upgradeBtn')}</span>
                    </button>
                  </div>
                </div>

                {/* 3. Institute Unlimited */}
                <div
                  className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                    selectedPlan === 'institute_unlimited'
                      ? 'border-[#5c2d91] bg-purple-50/40 shadow-lg ring-2 ring-[#5c2d91]/20'
                      : currentPlan === 'institute_unlimited'
                      ? 'border-emerald-500 bg-emerald-50/20'
                      : 'border-[#dde9ff] hover:border-[#5c2d91]/50 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-[#5c2d91] text-sm font-heading">
                        {t('planInstituteTitle')}
                      </span>
                      {currentPlan === 'institute_unlimited' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-medium">
                          {t('currentPlanBadge')}
                        </span>
                      )}
                    </div>
                    <div className="mb-3">
                      <span className="text-2xl font-black text-[#0f1c2d] font-mono">
                        {billingCycle === 'annual'
                          ? formatCurrency(44999, language)
                          : formatCurrency(4999, language)}
                      </span>
                      <span className="text-xs text-[#75777f] ml-1">
                        {billingCycle === 'annual' ? '/ वर्ष' : t('planInstitutePeriod')}
                      </span>
                    </div>
                    <ul className="space-y-2 text-xs text-[#45464e]">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#5c2d91] shrink-0" />
                        <span className="font-semibold text-[#0f1c2d]">{t('planInstituteF1')}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#5c2d91] shrink-0" />
                        <span>{t('planInstituteF2')}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#5c2d91] shrink-0" />
                        <span>{t('planInstituteF3')}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#5c2d91] shrink-0" />
                        <span>{t('planInstituteF4')}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#5c2d91] shrink-0" />
                        <span className="font-semibold text-[#0f1c2d]">{t('planInstituteF5')}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#dde9ff]">
                    <button
                      onClick={() => handleSelectPlan('institute_unlimited')}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 ${
                        selectedPlan === 'institute_unlimited'
                          ? 'bg-[#5c2d91] text-white shadow-md'
                          : 'bg-[#eff4ff] hover:bg-[#5c2d91] hover:text-white text-[#1b2a4a]'
                      } font-heading`}
                    >
                      <Building className="w-3.5 h-3.5" />
                      <span>{selectedPlan === 'institute_unlimited' ? 'योजना छानियो (Selected)' : t('upgradeBtn')}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Checkout & Gateway Section */}
              {selectedPlan && (
                <div className="bg-[#eff4ff]/60 border border-[#dde9ff] rounded-2xl p-5 sm:p-6 space-y-5 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-[#dde9ff] gap-2">
                    <div>
                      <h3 className="font-bold text-base text-[#0f1c2d] font-heading flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-[#b6152e]" />
                        <span>{t('checkoutTitle')}</span>
                      </h3>
                      <p className="text-xs text-[#45464e]">{t('checkoutSub')}</p>
                    </div>

                    {/* Multi-step progress indicator */}
                    <div className="flex items-center gap-1.5 text-[11px] font-mono">
                      <span className={`px-2 py-0.5 rounded-md font-bold ${mblStage === 'form' ? 'bg-[#1b2a4a] text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                        1. Initiate
                      </span>
                      <span>→</span>
                      <span className={`px-2 py-0.5 rounded-md font-bold ${mblStage === 'settlement' ? 'bg-[#b6152e] text-white' : mblStage === 'otp' || mblStage === 'done' ? 'bg-emerald-100 text-emerald-800' : 'bg-[#c5c6cf]/40 text-[#75777f]'}`}>
                        2. Bank Settlement
                      </span>
                      <span>→</span>
                      <span className={`px-2 py-0.5 rounded-md font-bold ${mblStage === 'otp' ? 'bg-[#e07a1e] text-white' : mblStage === 'done' ? 'bg-emerald-100 text-emerald-800' : 'bg-[#c5c6cf]/40 text-[#75777f]'}`}>
                        3. OTP Activation
                      </span>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Gateway selector tabs */}
                  {mblStage === 'form' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-[#0f1c2d] mb-2 font-heading">
                          {t('selectGateway')}
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {/* Machhapuchchhre Bank connectIPS */}
                          <button
                            type="button"
                            onClick={() => setSelectedGateway('mbl_connectips')}
                            className={`p-3 rounded-xl border text-left transition-all relative ${
                              selectedGateway === 'mbl_connectips'
                                ? 'border-[#1b2a4a] bg-white ring-2 ring-[#1b2a4a]/20 shadow-sm'
                                : 'border-[#c5c6cf] bg-white/70 hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 text-xs font-bold text-[#1b2a4a] mb-1">
                              <Building2 className="w-4 h-4 text-[#b6152e]" />
                              <span>MBL connectIPS</span>
                            </div>
                            <p className="text-[10px] text-[#45464e] leading-tight">
                              माछापुच्छ्रे बैंक सिधै खाता
                            </p>
                          </button>

                          {/* NepalPay / Fonepay Smart QR */}
                          <button
                            type="button"
                            onClick={() => setSelectedGateway('mbl_qr')}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              selectedGateway === 'mbl_qr'
                                ? 'border-[#1b2a4a] bg-white ring-2 ring-[#1b2a4a]/20 shadow-sm'
                                : 'border-[#c5c6cf] bg-white/70 hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 text-xs font-bold text-[#1b2a4a] mb-1">
                              <QrCode className="w-4 h-4 text-[#e07a1e]" />
                              <span>NepalPay Smart QR</span>
                            </div>
                            <p className="text-[10px] text-[#45464e] leading-tight">
                              MBL खातामा मोबाइल स्क्यान
                            </p>
                          </button>

                          {/* eSewa */}
                          <button
                            type="button"
                            onClick={() => setSelectedGateway('esewa')}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              selectedGateway === 'esewa'
                                ? 'border-[#60bb46] bg-white ring-2 ring-[#60bb46]/20 shadow-sm'
                                : 'border-[#c5c6cf] bg-white/70 hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 text-xs font-bold text-[#2d7d1b] mb-1">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#60bb46]" />
                              <span>eSewa Wallet</span>
                            </div>
                            <p className="text-[10px] text-[#45464e] leading-tight">
                              ईसेवा अनलाइन भुक्तानी
                            </p>
                          </button>

                          {/* Khalti */}
                          <button
                            type="button"
                            onClick={() => setSelectedGateway('khalti')}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              selectedGateway === 'khalti'
                                ? 'border-[#5c2d91] bg-white ring-2 ring-[#5c2d91]/20 shadow-sm'
                                : 'border-[#c5c6cf] bg-white/70 hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 text-xs font-bold text-[#5c2d91] mb-1">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#5c2d91]" />
                              <span>Khalti Wallet</span>
                            </div>
                            <p className="text-[10px] text-[#45464e] leading-tight">
                              खल्ती डिजिटल वालेट
                            </p>
                          </button>
                        </div>
                      </div>

                      {/* Payer Information Form */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block font-semibold text-[#0f1c2d] mb-1 font-heading">
                            {t('payerNameLabel')}
                          </label>
                          <input
                            type="text"
                            value={payerName}
                            onChange={(e) => setPayerName(e.target.value)}
                            placeholder="तपाईंको पुरा नाम"
                            className="w-full px-3.5 py-2 bg-white border border-[#c5c6cf] rounded-xl text-xs text-[#0f1c2d] focus:outline-none focus:ring-2 focus:ring-[#1b2a4a]/20"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-[#0f1c2d] mb-1 font-heading">
                            {t('payerPhoneLabel')}
                          </label>
                          <input
                            type="tel"
                            value={payerPhone}
                            onChange={(e) => setPayerPhone(e.target.value)}
                            placeholder="98XXXXXXXX"
                            className="w-full px-3.5 py-2 bg-white border border-[#c5c6cf] rounded-xl text-xs text-[#0f1c2d] focus:outline-none focus:ring-2 focus:ring-[#1b2a4a]/20"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-[#0f1c2d] mb-1 font-heading">
                            {t('payerPanLabel')}
                          </label>
                          <input
                            type="text"
                            value={panNumber}
                            onChange={(e) => setPanNumber(e.target.value)}
                            placeholder="उदा: 601239845"
                            className="w-full px-3.5 py-2 bg-white border border-[#c5c6cf] rounded-xl text-xs text-[#0f1c2d] focus:outline-none focus:ring-2 focus:ring-[#1b2a4a]/20"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-[#0f1c2d] mb-1 font-heading">
                            {t('authInstituteName')}
                          </label>
                          <input
                            type="text"
                            value={instituteName}
                            onChange={(e) => setInstituteName(e.target.value)}
                            placeholder="श्री माध्यमिक विद्यालय / इन्स्टिच्युट"
                            className="w-full px-3.5 py-2 bg-white border border-[#c5c6cf] rounded-xl text-xs text-[#0f1c2d] focus:outline-none focus:ring-2 focus:ring-[#1b2a4a]/20"
                          />
                        </div>
                      </div>

                      {/* Total and Initiate CTA */}
                      <div className="p-4 rounded-2xl bg-white border border-[#dde9ff] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <span className="text-xs text-[#45464e] block">{t('totalAmountNpr')}</span>
                          <span className="text-xl sm:text-2xl font-black text-[#b6152e] font-mono">
                            {formatCurrency(
                              selectedPlan === 'teacher_pro'
                                ? billingCycle === 'annual' ? 12999 : 1499
                                : billingCycle === 'annual' ? 44999 : 4999,
                              language
                            )}
                          </span>
                          <span className="text-[11px] text-[#75777f] ml-2">
                            ({billingCycle === 'annual' ? 'वार्षिक बिलिङ - २ महिना छुट' : 'मासिक बिलिङ'})
                          </span>
                        </div>

                        <button
                          onClick={handleInitiatePayment}
                          disabled={isProcessing}
                          className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 bg-[#1b2a4a] hover:bg-[#041534] text-white disabled:opacity-50 font-heading"
                        >
                          {isProcessing ? (
                            <>
                              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                              <span>{t('serverVerifying')}</span>
                            </>
                          ) : (
                            <>
                              <span>{t('proceedToPayment')}</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Stage 2: Machhapuchchhre Bank Direct Settlement & UTR Reference Verification */}
                  {mblStage === 'settlement' && (
                    <div className="space-y-4 animate-in fade-in">
                      {/* Notice */}
                      <div className="p-4 rounded-2xl bg-[#eff4ff] border border-[#1b2a4a]/20 text-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#1b2a4a] flex items-center gap-2 text-sm font-heading">
                            <Building2 className="w-5 h-5 text-[#b6152e]" />
                            <span>{t('mblAccountDetailsTitle')}</span>
                          </span>
                          <span className="text-[10px] bg-[#2d7d1b]/15 text-[#2d7d1b] px-2 py-0.5 rounded-full font-bold">
                            NCHL Clearing Active
                          </span>
                        </div>

                        {/* MBL Account Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-4 rounded-xl border border-[#dde9ff]">
                          <div className="space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-[#45464e]">बैंकको नाम:</span>
                              <span className="font-bold text-[#0f1c2d]">Machhapuchchhre Bank Limited (MBL)</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[#45464e]">खातावाला (Account Name):</span>
                              <span className="font-bold text-[#0f1c2d]">Editflow Technologies Pvt. Ltd.</span>
                            </div>
                            <div className="flex items-center justify-between bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                              <span className="text-[#703700] font-semibold">आधिकारिक खाता नम्बर:</span>
                              <div className="flex items-center gap-1.5 font-mono font-black text-[#0f1c2d]">
                                <span>00200845920019</span>
                                <button
                                  onClick={copyAccountNumber}
                                  className="p-1 hover:bg-amber-200/50 rounded text-xs text-[#b6152e]"
                                  title="खाता नम्बर कपी गर्नुहोस्"
                                >
                                  {copiedAcc ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[#45464e]">शाखा:</span>
                              <span className="text-[#0f1c2d] font-medium">पुतलीसडक शाखा, काठमाडौं</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[#45464e]">SWIFT Code:</span>
                              <span className="text-[#0f1c2d] font-mono font-medium">MBLNNPKA</span>
                            </div>
                          </div>

                          {/* NepalPay / connectIPS QR Mockup */}
                          <div className="flex flex-col items-center justify-center p-3 bg-[#f8f9ff] rounded-xl border border-[#dde9ff] text-center">
                            <div className="w-28 h-28 bg-white border-2 border-[#1b2a4a] rounded-xl p-2 flex flex-col items-center justify-center shadow-inner mb-2">
                              <QrCode className="w-16 h-16 text-[#1b2a4a]" />
                              <span className="text-[8px] font-mono font-bold text-[#b6152e]">NepalPay SMART QR</span>
                            </div>
                            <span className="text-[11px] font-bold text-[#0f1c2d]">
                              रु. {selectedPlan === 'teacher_pro' ? (billingCycle === 'annual' ? '१२,९९९' : '१,४९९') : (billingCycle === 'annual' ? '४४,९९९' : '४,९९९')}
                            </span>
                            <span className="text-[10px] text-[#45464e]">
                              कुनै पनि मोबाइल बैंकिङ वा connectIPS बाट स्क्यान गर्नुहोस्
                            </span>
                          </div>
                        </div>

                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs">
                          <p className="font-semibold">{t('bankStage1')}</p>
                          <p className="text-[11px] text-blue-700 mt-0.5">
                            नियम: बैंक खातामा रकम जम्मा भएको सर्भरले निश्चित गरेपछि मात्र तपाईंको फोनमा ६-अङ्कको सुरक्षा OTP जारी हुनेछ। स्क्रिनसट वा नक्कली विवरणले सदस्यता सक्रिय हुँदैन।
                          </p>
                        </div>
                      </div>

                      {/* UTR Input Form */}
                      <div className="p-4 bg-white border border-[#dde9ff] rounded-2xl space-y-3 text-xs">
                        <div>
                          <label className="block font-bold text-[#0f1c2d] mb-1 font-heading">
                            बैंक भौचर / connectIPS Clearing Reference / UTR नम्बर:
                          </label>
                          <input
                            type="text"
                            value={bankUtrReference}
                            onChange={(e) => setBankUtrReference(e.target.value)}
                            placeholder="उदा: MBL-UTR-893421 वा TXN7849102"
                            className="w-full px-3.5 py-2.5 bg-[#f8f9ff] border border-[#c5c6cf] rounded-xl text-xs font-mono font-bold text-[#0f1c2d] uppercase focus:outline-none focus:ring-2 focus:ring-[#1b2a4a]/20"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <button
                            type="button"
                            onClick={() => setMblStage('form')}
                            className="px-4 py-2 rounded-xl text-[#75777f] hover:text-[#0f1c2d] text-xs font-medium"
                          >
                            ← फिर्ता
                          </button>

                          <button
                            type="button"
                            onClick={handleVerifyBankSettlement}
                            disabled={isProcessing}
                            className="px-6 py-2.5 rounded-xl font-bold text-xs bg-[#b6152e] hover:bg-[#92001f] text-white shadow-md transition-all flex items-center gap-2 disabled:opacity-50 font-heading"
                          >
                            {isProcessing ? (
                              <>
                                <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                <span>{t('serverVerifying')}</span>
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="w-4 h-4" />
                                <span>बैंक सेटलमेन्ट प्रमाणीकरण गर्नुहोस् (Verify Settlement)</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stage 3: OTP Activation */}
                  {mblStage === 'otp' && (
                    <div className="space-y-4 animate-in fade-in">
                      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-2">
                        <div className="flex items-center gap-2 text-amber-900 font-bold font-heading">
                          <KeyRound className="w-4 h-4 text-[#e07a1e]" />
                          <span>{t('bankStage2')}</span>
                        </div>
                        <p className="text-[11px] text-amber-800">
                          माछापुच्छ्रे बैंक खाता ००२००८४५९२००१९ मा रकम प्राप्त भएको प्रमाणीकरण भयो। तपाईंको योजना सक्रिय गर्न कृपया मोबाइल / इमेलमा पठाइएको ६-अङ्कको सुरक्षा OTP हाल्नुहोस्:
                        </p>
                        {lastIssuedOtp && (
                          <div className="p-2 bg-white/80 rounded-lg border border-amber-300 text-[11px] text-amber-950 font-mono flex items-center justify-between">
                            <span>सुरक्षा OTP कोड (SMS Gateway Issued): <strong>{lastIssuedOtp}</strong></span>
                            <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                              Verified at MBL
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-4 bg-white border border-[#dde9ff] rounded-2xl space-y-3 text-xs">
                        <div>
                          <label className="block font-bold text-[#0f1c2d] mb-1 font-heading">
                            {t('enterOtpLabel')}
                          </label>
                          <input
                            type="text"
                            maxLength={6}
                            value={enteredOtp}
                            onChange={(e) => setEnteredOtp(e.target.value)}
                            placeholder="१२३४५६"
                            className="w-full px-3.5 py-3 bg-[#f8f9ff] border-2 border-[#e07a1e] rounded-xl text-lg font-mono font-black text-center tracking-widest text-[#0f1c2d] focus:outline-none focus:ring-2 focus:ring-[#e07a1e]/40"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <button
                            type="button"
                            onClick={() => setMblStage('settlement')}
                            className="px-4 py-2 rounded-xl text-[#75777f] hover:text-[#0f1c2d] text-xs font-medium"
                          >
                            ← सेटलमेन्ट विवरण
                          </button>

                          <button
                            type="button"
                            onClick={handleConfirmOtpAndActivate}
                            disabled={isProcessing}
                            className="px-6 py-3 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all flex items-center gap-2 disabled:opacity-50 font-heading"
                          >
                            {isProcessing ? (
                              <>
                                <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                <span>सक्रिय गर्दै...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>{t('confirmOtpAndActivate')}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* VAT Tax Receipt Modal */}
      {showInvoiceModal && verifiedTransaction && (
        <InvoiceReceiptModal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          transaction={verifiedTransaction}
        />
      )}
    </>
  );
};
