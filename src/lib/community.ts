import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '../firebase';
import type { ProgressSummary } from './hobbyStatus';

export type ConnectionKind = 'friend' | 'sponsor';
export type RelationshipKind = 'friend' | 'sponsorship';
export type ActivityType = 'relapse' | 'progress' | 'milestone';
export type ActivityVisibility = 'public' | 'connections';

export interface CommunityProfile {
  uid: string;
  displayName: string;
  displayNameLower: string;
  photoURL?: string | null;
  isPublic: boolean;
  allowFriendRequests: boolean;
  allowSponsorRequests: boolean;
  shareRelapses: boolean;
  shareProgress: boolean;
  currentStreak: number;
  badgeCount: number;
  progressSummary: ProgressSummary;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ConnectionRequest {
  id: string;
  fromUid: string;
  toUid: string;
  kind: ConnectionKind;
  status: 'pending' | 'accepted' | 'declined';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Relationship {
  id: string;
  requestId: string;
  kind: RelationshipKind;
  status: 'active';
  memberUids: string[];
  requesterUid: string;
  recipientUid: string;
  sponsorUid?: string;
  sponseeUid?: string;
  createdAt?: unknown;
}

export interface CommunityActivity {
  id: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL?: string | null;
  type: ActivityType;
  visibility: ActivityVisibility;
  createdAt?: any;
  details: {
    modelName?: string;
    stageFrom?: string;
    stageTo?: string;
    thumbnailUrl?: string | null;
    achievementTitle?: string;
    achievementDescription?: string;
    reason?: string;
    qty?: number;
    faction?: string;
    gameSystem?: string;
  };
  likes?: string[];
  commentCount?: number;
}

export const EMPTY_PROGRESS_SUMMARY: ProgressSummary = {
  unbuilt: 0,
  assembled: 0,
  primed: 0,
  basicPaint: 0,
  completed: 0,
  total: 0,
};

export function buildCommunityProfileData(
  user: User,
  existingProfile?: Partial<CommunityProfile> | null,
  updates?: Partial<CommunityProfile>,
) {
  const displayName = updates?.displayName || existingProfile?.displayName || user.displayName || 'Anonymous Hobbyist';

  return {
    uid: user.uid,
    displayName,
    displayNameLower: normalizeSearchText(displayName),
    photoURL: updates?.photoURL !== undefined ? updates.photoURL : existingProfile?.photoURL || user.photoURL || null,
    isPublic: updates?.isPublic !== undefined ? updates.isPublic : existingProfile?.isPublic === true,
    allowFriendRequests: updates?.allowFriendRequests !== undefined ? updates.allowFriendRequests : existingProfile?.allowFriendRequests !== false,
    allowSponsorRequests: updates?.allowSponsorRequests !== undefined ? updates.allowSponsorRequests : existingProfile?.allowSponsorRequests !== false,
    shareRelapses: updates?.shareRelapses !== undefined ? updates.shareRelapses : existingProfile?.shareRelapses === true,
    shareProgress: updates?.shareProgress !== undefined ? updates.shareProgress : existingProfile?.shareProgress !== false,
    currentStreak: updates?.currentStreak !== undefined ? updates.currentStreak : existingProfile?.currentStreak || 0,
    badgeCount: updates?.badgeCount !== undefined ? updates.badgeCount : existingProfile?.badgeCount || 0,
    progressSummary: updates?.progressSummary || existingProfile?.progressSummary || EMPTY_PROGRESS_SUMMARY,
    createdAt: existingProfile?.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

export function normalizeSearchText(value: string | null | undefined) {
  return (value || '').trim().toLocaleLowerCase();
}

export function connectionRequestId(fromUid: string, toUid: string, kind: ConnectionKind) {
  return `${fromUid}_${toUid}_${kind}`;
}

export function friendRelationshipId(uidA: string, uidB: string) {
  return [uidA, uidB].sort().join('_') + '_friend';
}

export function sponsorshipRelationshipId(sponseeUid: string, sponsorUid: string) {
  return `${sponseeUid}_${sponsorUid}_sponsorship`;
}

export function relationshipIdForRequest(request: Pick<ConnectionRequest, 'fromUid' | 'toUid' | 'kind'>) {
  if (request.kind === 'friend') {
    return friendRelationshipId(request.fromUid, request.toUid);
  }

  return sponsorshipRelationshipId(request.fromUid, request.toUid);
}

export function relationshipForRequest(request: ConnectionRequest): Omit<Relationship, 'id'> {
  const base = {
    requestId: request.id,
    status: 'active' as const,
    memberUids: [request.fromUid, request.toUid],
    requesterUid: request.fromUid,
    recipientUid: request.toUid,
    createdAt: serverTimestamp(),
  };

  if (request.kind === 'friend') {
    return {
      ...base,
      kind: 'friend',
    };
  }

  return {
    ...base,
    kind: 'sponsorship',
    sponseeUid: request.fromUid,
    sponsorUid: request.toUid,
  };
}

export async function ensureCommunityProfile(user: User, displayName?: string | null) {
  const profileRef = doc(db, 'profiles', user.uid);
  const safeDisplayName = displayName || user.displayName || 'Anonymous Hobbyist';
  let existingProfile: Partial<CommunityProfile> | null = null;

  try {
    const profileSnap = await getDoc(profileRef);
    existingProfile = profileSnap.exists() ? profileSnap.data() as Partial<CommunityProfile> : null;
  } catch (error) {
    console.warn('Could not read community profile during bootstrap:', error);
  }

  await setDoc(profileRef, buildCommunityProfileData(user, existingProfile, {
    displayName: safeDisplayName,
    photoURL: user.photoURL || null,
  }));
}

export async function sendConnectionRequest(fromUid: string, toUid: string, kind: ConnectionKind) {
  const requestRef = doc(db, 'connectionRequests', connectionRequestId(fromUid, toUid, kind));

  await setDoc(requestRef, {
    fromUid,
    toUid,
    kind,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function respondToConnectionRequest(request: ConnectionRequest, status: 'accepted' | 'declined') {
  const batch = writeBatch(db);
  const requestRef = doc(db, 'connectionRequests', request.id);

  batch.update(requestRef, {
    status,
    updatedAt: serverTimestamp(),
  });

  if (status === 'accepted') {
    const relationshipId = relationshipIdForRequest(request);
    const relationshipRef = doc(db, 'relationships', relationshipId);
    batch.set(relationshipRef, relationshipForRequest(request));
  }

  await batch.commit();
}

export async function getCommunityProfile(uid: string) {
  const profileSnap = await getDoc(doc(db, 'profiles', uid));
  return profileSnap.exists() ? profileSnap.data() as CommunityProfile : null;
}

export async function createCommunityActivity(
  user: User,
  type: ActivityType,
  details: CommunityActivity['details'],
  dedupeId?: string,
) {
  const profile = await getCommunityProfile(user.uid);
  if (!profile) return;

  if (type === 'relapse' && !profile.shareRelapses) return;
  if ((type === 'progress' || type === 'milestone') && !profile.shareProgress) return;

  const payload = {
    userId: user.uid,
    userDisplayName: profile.displayName || user.displayName || 'Anonymous Hobbyist',
    userPhotoURL: profile.photoURL || user.photoURL || null,
    type,
    visibility: profile.isPublic ? 'public' : 'connections',
    createdAt: serverTimestamp(),
    details,
    likes: [],
    commentCount: 0,
  };

  if (dedupeId) {
    const activityRef = doc(db, 'activities', dedupeId);
    const existingActivity = await getDoc(activityRef);
    if (existingActivity.exists()) return;
    await setDoc(activityRef, payload, { merge: false });
  } else {
    await addDoc(collection(db, 'activities'), payload);
  }
}

export async function toggleActivityLike(activityId: string, uid: string, isLiked: boolean) {
  await updateDoc(doc(db, 'activities', activityId), {
    likes: isLiked ? arrayRemove(uid) : arrayUnion(uid),
  });
}
