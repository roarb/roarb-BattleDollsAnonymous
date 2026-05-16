import { useEffect } from 'react';
import { collection, doc, getDoc, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { buildCommunityProfileData, CommunityProfile } from '../lib/community';
import { summarizeProgress } from '../lib/hobbyStatus';

export function useCommunityProfileSync() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    let userData: any = null;
    let models: any[] = [];
    let hasUserData = false;
    let hasModels = false;

    const syncProfile = async () => {
      if (!hasUserData || !hasModels) return;

      const displayName = userData?.displayName || user.displayName || 'Anonymous Hobbyist';
      const profileRef = doc(db, 'profiles', user.uid);
      let existingProfile: Partial<CommunityProfile> | null = null;

      try {
        const profileSnap = await getDoc(profileRef);
        existingProfile = profileSnap.exists() ? profileSnap.data() as Partial<CommunityProfile> : null;
      } catch (error) {
        console.warn('Could not read community profile before sync:', error);
      }

      await setDoc(profileRef, buildCommunityProfileData(user, existingProfile, {
        displayName,
        photoURL: user.photoURL || null,
        currentStreak: userData?.currentStreak || 0,
        badgeCount: Array.isArray(userData?.unlockedAchievements) ? userData.unlockedAchievements.length : 0,
        progressSummary: summarizeProgress(models),
      }));
    };

    const userUnsub = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      userData = snapshot.exists() ? snapshot.data() : {};
      hasUserData = true;
      syncProfile().catch((error) => console.error('Failed to sync community profile:', error));
    });

    const modelsUnsub = onSnapshot(query(collection(db, 'collection'), where('uid', '==', user.uid)), (snapshot) => {
      models = snapshot.docs.map((item) => item.data());
      hasModels = true;
      syncProfile().catch((error) => console.error('Failed to sync community profile:', error));
    });

    return () => {
      userUnsub();
      modelsUnsub();
    };
  }, [user]);
}
