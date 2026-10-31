import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';
import { getOrCreateProfile, hasActivePaidSubscription } from '../db/users.ts';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  instituteName?: string;
  phone?: string;
  profileImage?: string;
  isEmailVerified: boolean;
  plan: string;
  planStatus: string;
  planExpiresAt?: string;
}

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
  user?: AuthenticatedUser;
  firebaseToken?: DecodedIdToken;
}

/**
 * requireAuth: Authenticates requests via Firebase Bearer ID Token.
 * Syncs user to Cloud SQL PostgreSQL profiles and subscriptions.
 */
export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'अनधिकृत: लगइन टोकन फेला परेन (Unauthorized: Missing token)' });
  }

  const token = authHeader.split('Bearer ')[1].trim();

  try {
    // 1. Try Firebase Admin ID Token verification
    let uid: string;
    let email: string;
    let name: string | undefined;
    let picture: string | undefined;
    let emailVerified = false;

    if (token.startsWith('shikshya-token-')) {
      // Demo / seed account fallback
      uid = token.replace('shikshya-token-', '');
      email = `${uid}@shikshya.edu.np`;
      name = uid.includes('teacher') ? 'रमेश अधिकारी (Teacher)' : 'नेपाल शिक्षक';
      emailVerified = true;
    } else {
      const decoded = await adminAuth.verifyIdToken(token);
      req.firebaseToken = decoded;
      uid = decoded.uid;
      email = decoded.email || `${uid}@editflow.app`;
      name = decoded.name || decoded.displayName || email.split('@')[0];
      picture = decoded.picture;
      emailVerified = decoded.email_verified || false;
    }

    // 2. Synchronize user in PostgreSQL database
    const { profile, subscription } = await getOrCreateProfile(
      uid,
      email,
      name,
      picture
    );

    req.userId = profile.id;
    req.userEmail = profile.email;
    req.user = {
      id: profile.id,
      name: profile.fullName,
      email: profile.email,
      role: profile.role,
      instituteName: profile.instituteName || undefined,
      phone: profile.phone || undefined,
      profileImage: profile.profileImage || undefined,
      isEmailVerified: profile.isEmailVerified || emailVerified,
      plan: subscription?.plan || 'free',
      planStatus: subscription?.status || 'PENDING',
      planExpiresAt: subscription?.expiryDate ? new Date(subscription.expiryDate).toISOString() : undefined,
    };

    next();
  } catch (error) {
    console.error('Authentication verification error:', error);
    return res.status(401).json({ error: 'अवैध वा म्याद सकिएको लगइन टोकन (Invalid or expired authentication token)' });
  }
};

/**
 * requireActiveSubscription:
 * Enforces requirement:
 * - "Users with Pending, Expired, or Cancelled subscriptions must not access paid features."
 * - "Only users with an Active and unexpired subscription can access paid features."
 */
export const requireActiveSubscription = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
  }

  const isActive = await hasActivePaidSubscription(req.userId);
  if (!isActive) {
    return res.status(403).json({
      error: 'यस सुविधाका लागि सक्रिय सदस्यता आवश्यक छ। (Active paid subscription required to access this feature)',
      requiresSubscription: true,
      currentPlan: req.user?.plan || 'free',
      status: req.user?.planStatus || 'PENDING',
    });
  }

  next();
};
