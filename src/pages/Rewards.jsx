import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import RewardBadge from '../components/RewardBadge';

export default function Rewards({ user }) {
  const [huntCount, setHuntCount] = useState(0);
  const [weaponCount, setWeaponCount] = useState(0);
  const [imageCount, setImageCount] = useState(0);

  useEffect(() => {
    const unsubHunts = onSnapshot(collection(db, 'users', user.uid, 'hunts'), (snap) => {
      const hunts = snap.docs.map((d) => d.data());
      setHuntCount(hunts.length);
      setImageCount(hunts.reduce((sum, h) => sum + (h.imageUrls?.length || 0), 0));
    });
    const unsubWeapons = onSnapshot(collection(db, 'users', user.uid, 'weapons'), (snap) => setWeaponCount(snap.size));
    return () => {
      unsubHunts();
      unsubWeapons();
    };
  }, [user.uid]);

  const rewards = [
    { title: 'Første jakt', description: 'Registrer din første jakttur.', unlocked: huntCount >= 1 },
    { title: 'Jaktgarderobe', description: 'Legg inn ditt første våpen.', unlocked: weaponCount >= 1 },
    { title: 'Fotominner', description: 'Last opp ditt første jaktbilde.', unlocked: imageCount >= 1 },
    { title: 'Erfaren jeger', description: 'Registrer fem jaktturer.', unlocked: huntCount >= 5 },
    { title: 'Våpensamler', description: 'Legg inn tre våpen i jaktgarderoben.', unlocked: weaponCount >= 3 }
  ];

  return (
    <div>
      <h1>Rewards</h1>
      <div className="grid three">
        {rewards.map((reward) => <RewardBadge key={reward.title} {...reward} />)}
      </div>
    </div>
  );
}
