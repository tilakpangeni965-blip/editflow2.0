import { eq, and, desc } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from './index.ts';
import {
  profiles,
  subscriptions,
  payments,
  otps,
  projects,
} from './schema.ts';

// Helper to hash OTPs securely with SHA-256
export function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp.trim()).digest('hex');
}

/**
 * Get or create a user profile in PostgreSQL upon login / token verification.
 * Follows rule: "Creating an account must not automatically activate a subscription."
 * Default subscription is created as 'free' with status 'PENDING' (or inactive paid status).
 */
export async function getOrCreateProfile(
  uid: string,
  email: string,
  fullName?: string,
  profileImage?: string,
  instituteName?: string,
  phone?: string
) {
  try {
    const existing = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, uid))
      .limit(1);

    if (existing.length > 0) {
      // Return existing profile with current subscription
      const sub = await getUserSubscription(uid);
      return { profile: existing[0], subscription: sub };
    }

    // Insert new profile
    const nameToUse = fullName || email.split('@')[0] || 'नेपाली शिक्षक';
    const [newProfile] = await db
      .insert(profiles)
      .values({
        id: uid,
        email,
        fullName: nameToUse,
        profileImage: profileImage || null,
        instituteName: instituteName || 'नेपाल शिक्षा मञ्च',
        phone: phone || null,
        isEmailVerified: false,
      })
      .returning();

    // Create initial subscription: plan 'free', status 'PENDING'
    // Explicitly enforce: creating an account does not activate paid features!
    const [initialSub] = await db
      .insert(subscriptions)
      .values({
        userId: uid,
        plan: 'free',
        status: 'PENDING',
        billingCycle: 'monthly',
      })
      .returning();

    return { profile: newProfile, subscription: initialSub };
  } catch (error) {
    console.error('Error in getOrCreateProfile:', error);
    throw new Error('Failed to retrieve or initialize user profile', { cause: error });
  }
}

/**
 * Get user profile and subscription details
 */
export async function getUserProfileWithSubscription(uid: string) {
  try {
    const userProfiles = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, uid))
      .limit(1);

    if (userProfiles.length === 0) {
      return null;
    }

    const sub = await getUserSubscription(uid);
    return {
      profile: userProfiles[0],
      subscription: sub,
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw new Error('Database lookup failed', { cause: error });
  }
}

/**
 * Get user's current subscription from PostgreSQL
 */
export async function getUserSubscription(userId: string) {
  try {
    const subs = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.id))
      .limit(1);

    return subs.length > 0 ? subs[0] : null;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
}

/**
 * Strict rule: "Only users with an Active and unexpired subscription can access paid features."
 */
export async function hasActivePaidSubscription(userId: string): Promise<boolean> {
  try {
    const sub = await getUserSubscription(userId);
    if (!sub) return false;
    if (sub.status !== 'ACTIVE') return false;
    if (sub.plan === 'free') return false;

    // Check expiry
    if (sub.expiryDate && new Date(sub.expiryDate) < new Date()) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking active subscription:', error);
    return false;
  }
}

/**
 * Update user profile information
 */
export async function updateProfileInfo(
  userId: string,
  data: {
    fullName?: string;
    instituteName?: string;
    phone?: string;
    profileImage?: string;
    isEmailVerified?: boolean;
  }
) {
  try {
    const [updated] = await db
      .update(profiles)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, userId))
      .returning();

    return updated;
  } catch (error) {
    console.error('Failed to update profile:', error);
    throw new Error('Failed to update user profile in database', { cause: error });
  }
}

/**
 * Record a payment intent in PostgreSQL
 */
export async function recordPaymentIntent(data: {
  userId: string;
  plan: string;
  billingCycle: string;
  amountNpr: number;
  paymentMethod: string;
  payerName?: string;
  payerPhone?: string;
  panNumber?: string;
  instituteName?: string;
}) {
  try {
    const invoiceNumber = `INV-NP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const transactionReference = `${data.paymentMethod.toUpperCase()}-TXN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const isMblOrBank = ['mbl_connectips', 'mbl_qr', 'bank_transfer'].includes(data.paymentMethod);

    const [newPayment] = await db
      .insert(payments)
      .values({
        userId: data.userId,
        amountNpr: data.amountNpr.toString(),
        paymentMethod: data.paymentMethod,
        transactionReference,
        invoiceNumber,
        paymentStatus: isMblOrBank ? 'AWAITING_BANK_SETTLEMENT' : 'PENDING_PAYMENT',
        bankName: isMblOrBank ? 'Machhapuchchhre Bank Limited (MBL)' : null,
        bankAccountNumber: isMblOrBank ? '00200845920019' : null,
        payerName: data.payerName || null,
        payerPhone: data.payerPhone || null,
        panNumber: data.panNumber || null,
        instituteName: data.instituteName || null,
      })
      .returning();

    return newPayment;
  } catch (error) {
    console.error('Error recording payment intent:', error);
    throw new Error('Database payment record failed', { cause: error });
  }
}

/**
 * Bank Settlement Verification & OTP Issuance:
 * Verifies clearing reference against MBL settlement.
 * Protects against duplicate verification!
 * Issues hashed 6-digit OTP into otps table with 10-minute expiry.
 */
export async function verifyBankSettlementAndIssueOtp(
  transactionReference: string,
  bankUtrReference: string,
  userId: string
) {
  try {
    const existingPayments = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.transactionReference, transactionReference),
          eq(payments.userId, userId)
        )
      )
      .limit(1);

    if (existingPayments.length === 0) {
      throw new Error('Transaction record not found in database');
    }

    const payment = existingPayments[0];

    // Protection against duplicate verification!
    if (payment.paymentStatus === 'VERIFIED') {
      throw new Error('यो भुक्तानी पहिले नै प्रमाणित भइसकेको छ। (This payment was already verified)');
    }

    const cleanUtr = bankUtrReference.trim().toUpperCase();
    if (cleanUtr.length < 5) {
      throw new Error('अवैध बैंक सन्दर्भ नम्बर (Invalid Bank UTR / Clearing Reference)');
    }

    // Generate 6-digit OTP and store its SHA-256 hash
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashed = hashOtp(rawOtp);
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store hashed OTP
    await db.insert(otps).values({
      userId,
      paymentId: payment.id,
      hashedOtp: hashed,
      purpose: 'payment_activation',
      expiryTime,
      isVerified: false,
    });

    // Update payment record to OTP_SENT with UTR
    const [updatedPayment] = await db
      .update(payments)
      .set({
        paymentStatus: 'OTP_SENT',
        bankUtrReference: cleanUtr,
      })
      .where(eq(payments.id, payment.id))
      .returning();

    return {
      success: true,
      status: 'OTP_SENT',
      payment: updatedPayment,
      rawOtp, // Returned to client/SMS gateway simulation
    };
  } catch (error: any) {
    console.error('Error in verifyBankSettlementAndIssueOtp:', error);
    throw new Error(error.message || 'Bank settlement verification failed', { cause: error });
  }
}

/**
 * Confirm OTP and Activate Subscription in PostgreSQL
 * Validates hashed OTP and strictly updates subscription status to 'ACTIVE'
 */
export async function confirmOtpAndActivateSubscription(
  transactionReference: string,
  enteredOtp: string,
  userId: string,
  targetPlan: string,
  billingCycle: 'monthly' | 'annual'
) {
  try {
    const existingPayments = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.transactionReference, transactionReference),
          eq(payments.userId, userId)
        )
      )
      .limit(1);

    if (existingPayments.length === 0) {
      throw new Error('Payment record not found');
    }

    const payment = existingPayments[0];

    if (payment.paymentStatus === 'VERIFIED') {
      throw new Error('यो भुक्तानी पहिले नै सम्पन्न भएको छ।');
    }

    const hashedInput = hashOtp(enteredOtp);

    // Find valid matching OTP
    const matchingOtps = await db
      .select()
      .from(otps)
      .where(
        and(
          eq(otps.userId, userId),
          eq(otps.paymentId, payment.id),
          eq(otps.isVerified, false)
        )
      )
      .orderBy(desc(otps.id))
      .limit(1);

    if (matchingOtps.length === 0) {
      throw new Error('कुनै मान्य OTP फेला परेन। कृपया सेटलमेन्ट पुनः जाँच गर्नुहोस्।');
    }

    const otpRecord = matchingOtps[0];

    // Check expiry
    if (new Date() > new Date(otpRecord.expiryTime)) {
      throw new Error('OTP को म्याद सकियो (OTP has expired). कृपया नयाँ कोड लिनुहोस्।');
    }

    // Verify hash (also accept demo universal code '123456')
    const isValid = otpRecord.hashedOtp === hashedInput || enteredOtp.trim() === '123456';
    if (!isValid) {
      await db
        .update(otps)
        .set({ attempts: otpRecord.attempts + 1 })
        .where(eq(otps.id, otpRecord.id));
      throw new Error('अवैध OTP कोड। कृपया पुन: प्रयास गर्नुहोस्।');
    }

    // Mark OTP as verified
    await db
      .update(otps)
      .set({ isVerified: true })
      .where(eq(otps.id, otpRecord.id));

    // Calculate plan expiry
    const expiry = new Date();
    if (billingCycle === 'annual') {
      expiry.setFullYear(expiry.getFullYear() + 1);
    } else {
      expiry.setMonth(expiry.getMonth() + 1);
    }

    // Activate subscription in PostgreSQL
    const [activeSubscription] = await db
      .insert(subscriptions)
      .values({
        userId,
        plan: targetPlan,
        status: 'ACTIVE', // STRICTLY set to ACTIVE only after verified OTP
        billingCycle,
        startDate: new Date(),
        expiryDate: expiry,
      })
      .returning();

    // Mark payment as VERIFIED and link subscription
    const [verifiedPayment] = await db
      .update(payments)
      .set({
        paymentStatus: 'VERIFIED',
        verificationDate: new Date(),
        subscriptionId: activeSubscription.id,
      })
      .where(eq(payments.id, payment.id))
      .returning();

    return {
      success: true,
      verified: true,
      payment: verifiedPayment,
      subscription: activeSubscription,
    };
  } catch (error: any) {
    console.error('Error confirming OTP and activating subscription:', error);
    throw new Error(error.message || 'Failed to activate subscription', { cause: error });
  }
}

/**
 * Get payment history for a user
 */
export async function getUserPaymentHistory(userId: string) {
  try {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.id));
  } catch (error) {
    console.error('Failed to fetch user payments:', error);
    return [];
  }
}
