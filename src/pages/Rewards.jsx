import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import RewardBadge from '../components/RewardBadge';

export default function Rewards({ user }) {
  const [huntCount, setHuntCount] = useState(0);
  const [weaponCount, setWeaponCount] = useState(0);
  const [imageCount, setImageCount] = useState(0);
  const [harvestCount, setHarvestCount] = useState(0);
  const [friendCount, setFriendCount] = useState(0);

  useEffect(() => {
    const unsubHunts = onSnapshot(collection(db, 'users', user.uid, 'hunts'), (snap) => {
      const hunts = snap.docs.map((d) => d.data());
      setHuntCount(hunts.length);
      setImageCount(hunts.reduce((sum, h) => sum + (h.imageUrls?.length || 0), 0));
    });
    const unsubWeapons = onSnapshot(collection(db, 'users', user.uid, 'weapons'), (snap) => setWeaponCount(snap.size));
    const unsubHarvests = onSnapshot(collection(db, 'users', user.uid, 'harvests'), (snap) => setHarvestCount(snap.size));
    const unsubFriends = onSnapshot(collection(db, 'users', user.uid, 'friends'), (snap) => setFriendCount(snap.size));
    return () => { unsubHunts(); unsubWeapons(); unsubHarvests(); unsubFriends(); };
  }, [user.uid]);

  const rewards = [
    { title: 'Første jakt', description: 'Registrer din første jakttur.', unlocked: huntCount >= 1 },
    { title: 'Jaktgarderobe', description: 'Legg inn ditt første våpen.', unlocked: weaponCount >= 1 },
    { title: 'Fotominner', description: 'Last opp ditt første jaktbilde.', unlocked: imageCount >= 1 },
    { title: 'Første felt dyr', description: 'Registrer ditt første felte dyr.', unlocked: harvestCount >= 1 },
    { title: 'Jegervenner', description: 'Legg til din første jegervenn.', unlocked: friendCount >= 1 },
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
