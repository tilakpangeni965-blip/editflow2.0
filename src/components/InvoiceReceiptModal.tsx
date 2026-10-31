import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { PaymentTransaction } from '../types';
import { formatCurrency, toNepaliNumerals } from '../utils/formatters';
import { X, Printer, CheckCircle2, Building, ShieldCheck } from 'lucide-react';

interface InvoiceReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: PaymentTransaction;
}

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  const { language, t } = useLanguage();

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const vatAmount = Math.round(transaction.amountNpr * 0.13);
  const baseAmount = transaction.amountNpr - vatAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh] print:p-0 print:shadow-none print:w-full print:max-w-none">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors print:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Official Header */}
        <div className="text-center pb-4 border-b-2 border-slate-900">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{t('statusPaid')}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
            शिक्षा स्टुडियो नेपाल प्रा.लि.
          </h2>
          <p className="text-xs text-slate-600 font-medium">
            ShikshyaStudio Nepal Pvt. Ltd. | पुतलीसडक, काठमाडौं, नेपाल
          </p>
          <p className="text-xs font-mono font-semibold text-slate-800 mt-1">
            {t('panNo')} 609841235 • फोन: ०१-४४२३८९०
          </p>
          <h3 className="text-sm font-bold uppercase tracking-wider text-rose-700 mt-2">
            {t('receiptTitle')}
          </h3>
        </div>

        {/* Invoice Metadata */}
        <div className="py-4 border-b border-slate-200 grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block">{t('invoiceNo')}</span>
            <span className="font-mono font-bold text-slate-900">{transaction.invoiceNumber}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 block">{t('dateLabel')}</span>
            <span className="font-semibold text-slate-900">
              {new Date(transaction.createdAt).toLocaleDateString('ne-NP')} ({new Date(transaction.createdAt).toISOString().split('T')[0]})
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">{t('payerNameLabel')}</span>
            <span className="font-bold text-slate-900">{transaction.payerName}</span>
            {transaction.instituteName && (
              <p className="text-[11px] text-slate-600 truncate">{transaction.instituteName}</p>
            )}
          </div>
          <div className="text-right">
            <span className="text-slate-500 block">{t('paidVia')}</span>
            <span className="font-bold text-slate-900 uppercase">
              {transaction.gateway === 'esewa' ? 'eSewa ePay' : 'Khalti Wallet'}
            </span>
            <p className="font-mono text-[10px] text-slate-500 truncate">{transaction.gatewayTransactionId}</p>
          </div>
          {transaction.panNumber && (
            <div className="col-span-2">
              <span className="text-slate-500">{t('customerPan')} </span>
              <span className="font-mono font-bold">{transaction.panNumber}</span>
            </div>
          )}
        </div>

        {/* Line Items Table */}
        <div className="py-4 border-b border-slate-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-300 text-slate-600 font-semibold text-left">
                <th className="pb-2">विवरण (Description)</th>
                <th className="pb-2 text-right">दर (Rate)</th>
                <th className="pb-2 text-right">रकम (Amount)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2.5">
                  <p className="font-bold text-slate-900">
                    {transaction.plan === 'institute_unlimited'
                      ? 'इन्स्टिच्युट अनलिमिटेड सदस्यता (Institute Unlimited)'
                      : 'शिक्षक प्रो सदस्यता (Teacher Pro)'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    अडियो साइलेन्स पज कट, लाउडनेस नर्मालाइजेसन र द्विभाषिक उपशीर्षक ({transaction.billingCycle === 'annual' ? 'वार्षिक' : 'मासिक'})
                  </p>
                </td>
                <td className="py-2.5 text-right font-mono">{formatCurrency(transaction.amountNpr, language)}</td>
                <td className="py-2.5 text-right font-mono font-bold">{formatCurrency(transaction.amountNpr, language)}</td>
              </tr>
            </tbody>
          </table>

          {/* Breakdown */}
          <div className="pt-4 space-y-1.5 text-xs text-right">
            <div className="flex justify-between text-slate-600">
              <span>मूल्य (Taxable Amount):</span>
              <span className="font-mono">{formatCurrency(baseAmount, language)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>१३% मूल्य अभिवृद्धि कर (13% VAT):</span>
              <span className="font-mono">{formatCurrency(vatAmount, language)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-300">
              <span>कुल जम्मा (Grand Total):</span>
              <span className="font-mono text-rose-700">{formatCurrency(transaction.amountNpr, language)}</span>
            </div>
          </div>
        </div>

        {/* Footer & Signature Note */}
        <div className="pt-4 text-center space-y-3">
          <p className="text-[11px] text-slate-500 italic">
            यो कम्प्युटर प्रणालीबाट स्वतः प्रमाणित भएको आधिकारिक विद्युतीय बिजक हो। यसमा भौतिक हस्ताक्षर आवश्यक पर्दैन।
          </p>

          <div className="flex items-center justify-center gap-3 pt-2 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-md transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>{t('printInvoice')}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              {t('close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
