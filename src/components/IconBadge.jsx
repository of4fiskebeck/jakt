export default function IconBadge({ src, alt = '', size = 'page', className = '' }) {
  return <img className={`icon-badge icon-badge-${size} ${className}`.trim()} src={src} alt={alt} loading="lazy" />;
}
