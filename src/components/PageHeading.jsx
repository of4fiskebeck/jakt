import IconBadge from './IconBadge';

export default function PageHeading({ icon, eyebrow, title, children }) {
  return (
    <div className="page-heading with-icon">
      {icon && <IconBadge src={icon} alt="" size="page" />}
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {children && <p>{children}</p>}
      </div>
    </div>
  );
}
