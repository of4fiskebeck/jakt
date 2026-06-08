export default function RewardBadge({ title, description, unlocked, icon }) {
  return (
    <div className={`badge ${unlocked ? 'unlocked' : ''}`}>
      {icon && <img className="reward-image" src={icon} alt="" />}
      <div className="badge-icon">{unlocked ? '🏆' : '🔒'}</div>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}
