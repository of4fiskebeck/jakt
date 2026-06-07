export default function RewardBadge({ title, description, unlocked }) {
  return (
    <div className={`badge ${unlocked ? 'unlocked' : ''}`}>
      <div className="badge-icon">{unlocked ? '🏆' : '🔒'}</div>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}
