import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { PaymentTransaction } from '../types';
import { formatCurrency, toNepaliNumerals } from '../utils/formatters';
import { InvoiceReceiptModal } from './InvoiceReceiptModal';
import {
  Sparkles,
  Receipt,
  CheckCircle2,
} from 'lucide-react';

interface BillingHistoryViewProps {
  onOpenPricing: () => void;
}

export const BillingHistoryView: React.FC<BillingHistoryViewProps> = ({ onOpenPricing }) => {
  const { language, t } = useLanguage();
  const { user, token } = useAuth();

  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [selectedTxn, setSelectedTxn] = useState<PaymentTransaction | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch('/api/payments/transactions', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.transactions) setTransactions(data.transactions);
        }
      } catch (err) {
        console.warn('Failed to load transactions:', err);
      }
    };
    fetchTransactions();
  }, [token, user?.plan]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 font-bilingual">
      {/* Active Plan Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#1b2a4a] text-white shadow-xl border border-[#041534] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-[#b7c6ee] uppercase tracking-wider block mb-1 font-heading">
            {t('currentPlanBadge')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
            {user?.plan === 'institute_unlimited'
              ? 'इन्स्टिच्युट अनलिमिटेड (Institute Unlimited)'
              : user?.plan === 'teacher_pro'
              ? 'शिक्षक प्रो (Teacher Pro)'
              : 'नि:शुल्क सुरुवाती (Free Starter)'}
          </h2>
          <p className="text-xs text-[#cddbf2] mt-1.5">
            {user?.planExpiresAt
              ? `${language === 'ne' ? 'योजनाको म्याद' : 'Valid until'}: ${new Date(user.planExpiresAt).toLocaleDateString('ne-NP')}`
              : language === 'ne'
              ? 'नि:शुल्क आधारभूत सुविधा सक्रिय छ'
              : 'Free basic plan active'}
          </p>
        </div>

        <button
          onClick={onOpenPricing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#b6152e] hover:bg-[#92001f] text-white text-xs font-bold shadow-md shadow-[#041534]/50 transition-all active:scale-95 font-heading"
        >
          <Sparkles className="w-4 h-4 text-[#ffdcc5]" />
          <span>{language === 'ne' ? 'योजना परिवर्तन वा नविकरण' : 'Upgrade / Renew Plan'}</span>
        </button>
      </div>

      {/* Nepal Payment Gateways Assurance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#dde9ff] flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#60bb46] text-white font-extrabold flex items-center justify-center text-sm shadow-sm">
            e
          </div>
          <div className="text-xs">
            <p className="font-bold text-[#2d7d1b] font-heading">{t('gatewayEsewa')}</p>
            <p className="text-[#45464e] text-[11px]">ePay UAT / Live Instant Server Verification</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#dde9ff] flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#5c2d91] text-white font-extrabold flex items-center justify-center text-sm shadow-sm">
            K
          </div>
          <div className="text-xs">
            <p className="font-bold text-[#5c2d91] font-heading">{t('gatewayKhalti')}</p>
            <p className="text-[#45464e] text-[11px]">Khalti Digital Wallet OTP Verification</p>
          </div>
        </div>
      </div>

      {/* Transactions & Invoices Table */}
      <div className="p-6 rounded-3xl bg-white border border-[#dde9ff] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#0f1c2d] flex items-center gap-2 font-heading">
            <Receipt className="w-4 h-4 text-[#b6152e]" />
            <span>{language === 'ne' ? 'भुक्तानी तथा कर बिजक इतिहास (Invoices)' : 'Payment & VAT Invoice History'}</span>
          </h3>
          <span className="text-xs text-[#45464e] font-mono">
            {transactions.length} {language === 'ne' ? 'रसिदहरू' : 'receipts'}
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#75777f]">
            {language === 'ne' ? 'हालसम्म कुनै कारोबार भेटिएन।' : 'No payment transactions yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#dde9ff] text-[#45464e] font-bold font-heading">
                  <th className="pb-3">{t('invoiceNo')}</th>
                  <th className="pb-3">{t('dateLabel')}</th>
                  <th className="pb-3">योजना (Plan)</th>
                  <th className="pb-3">{t('paidVia')}</th>
                  <th className="pb-3 text-right">रकम (Amount)</th>
                  <th className="pb-3 text-center">{t('status')}</th>
                  <th className="pb-3 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0] font-mono">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#f8f9ff] transition-colors">
                    <td className="py-3 font-bold text-[#0f1c2d]">{tx.invoiceNumber}</td>
                    <td className="py-3 text-[#45464e] font-sans">
                      {new Date(tx.createdAt).toLocaleDateString('ne-NP')}
                    </td>
                    <td className="py-3 font-sans">
                      <span className="font-semibold text-[#1b2a4a]">
                        {tx.plan === 'institute_unlimited' ? 'इन्स्टिच्युट' : 'शिक्षक प्रो'}
                      </span>
                    </td>
                    <td className="py-3 uppercase font-sans font-bold text-[#45464e]">
                      {tx.gateway === 'esewa' ? (
                        <span className="text-[#2d7d1b]">eSewa</span>
                      ) : (
                        <span className="text-[#5c2d91]">Khalti</span>
                      )}
                    </td>
                    <td className="py-3 text-right font-bold text-emerald-700">
                      {formatCurrency(tx.amountNpr, language)}
                    </td>
                    <td className="py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold font-heading">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        VERIFIED
                      </span>
                    </td>
                    <td className="py-3 text-right font-sans">
                      <button
                        onClick={() => setSelectedTxn(tx)}
                        className="px-2.5 py-1 rounded-lg bg-[#eff4ff] hover:bg-[#dde9ff] text-[#1b2a4a] text-xs font-semibold border border-[#cddbf2] transition-colors font-heading"
                      >
                        {t('viewTaxReceipt')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      {selectedTxn && (
        <InvoiceReceiptModal
          isOpen={!!selectedTxn}
          onClose={() => setSelectedTxn(null)}
          transaction={selectedTxn}
        />
      )}
    </div>
  );
};
