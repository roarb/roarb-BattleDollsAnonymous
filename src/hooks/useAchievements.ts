import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc, arrayUnion } from 'firebase/firestore';
import { ACHIEVEMENTS, Achievement } from '../data/achievements';

const attemptedUnlocks = new Set<string>();

export function useAchievements() {
  const { user } = useAuth();
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [recentUnlock, setRecentUnlock] = useState<Achievement | null>(null);

  useEffect(() => {
    if (!user) return;

    let currentUnlockedIds: string[] = [];
    let models: any[] = [];
    let relapseCount = 0;
    let bestUserStreak = 0;

    const evaluateAchievements = async () => {
      if (!user) return;

      const newUnlocks: string[] = [];
      const totalModels = models.reduce((acc, m) => acc + m.qty, 0);
      const statusCounts = models.reduce((acc, m) => {
        acc[m.status] = (acc[m.status] || 0) + m.qty;
        return acc;
      }, {} as Record<string, number>);
      

      for (const achievement of ACHIEVEMENTS) {
        if (currentUnlockedIds.includes(achievement.id) || attemptedUnlocks.has(achievement.id)) continue;

        let isUnlocked = false;

        switch (achievement.conditionType) {
          case 'modelCount':
            isUnlocked = totalModels >= achievement.conditionValue;
            break;
          case 'statusCount':
            if (achievement.conditionStatus) {
              isUnlocked = (statusCounts[achievement.conditionStatus] || 0) >= achievement.conditionValue;
            }
            break;
          case 'streak':
            isUnlocked = bestUserStreak >= achievement.conditionValue;
            break;
          case 'relapseCount':
            isUnlocked = relapseCount >= achievement.conditionValue;
            break;
        }

        if (isUnlocked) {
          newUnlocks.push(achievement.id);
          attemptedUnlocks.add(achievement.id);
          setRecentUnlock(achievement);
        }
      }

      if (newUnlocks.length > 0) {
        currentUnlockedIds.push(...newUnlocks);
        // Update Firestore
        try {
          await setDoc(doc(db, 'users', user.uid), {
            unlockedAchievements: arrayUnion(...newUnlocks)
          }, { merge: true });
        } catch (err) {
          console.error("Failed to unlock achievement:", err);
        }
      }
    };

    const userUnsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        currentUnlockedIds = data.unlockedAchievements || [];
        bestUserStreak = data.bestStreak || 0;
        setUnlockedIds(currentUnlockedIds);
        evaluateAchievements();
      }
    });

    const modelsUnsub = onSnapshot(query(collection(db, 'collection'), where('uid', '==', user.uid)), (snapshot) => {
      models = [];
      snapshot.forEach(doc => models.push(doc.data()));
      evaluateAchievements();
    });

    const relapsesUnsub = onSnapshot(query(collection(db, 'relapses'), where('uid', '==', user.uid)), (snapshot) => {
      relapseCount = snapshot.size;
      evaluateAchievements();
    });

    return () => {
      userUnsub();
      modelsUnsub();
      relapsesUnsub();
    };
  }, [user]);

  const clearRecentUnlock = () => setRecentUnlock(null);

  return { unlockedIds, recentUnlock, clearRecentUnlock };
}
