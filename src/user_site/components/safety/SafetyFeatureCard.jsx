import React from 'react';

const SafetyFeatureCard = ({
  icon: Icon,
  title,
  description,
  badge,
  metric,
  cta,
  onCtaClick,
  className = '',
  style,
}) => {
  return (
    <article className={`ws-card ${className}`.trim()} style={style}>
      <div className="ws-card-top">
        <span className="ws-card-icon">{Icon ? <Icon size={20} strokeWidth={2.4} /> : null}</span>
        {badge ? <span className="ws-card-badge">{badge}</span> : null}
      </div>

      <h3>{title}</h3>
      <p>{description}</p>

      {metric ? <div className="ws-card-metric">{metric}</div> : null}

      {cta ? (
        onCtaClick ? (
          <button type="button" className="ws-card-cta" onClick={onCtaClick}>
            {cta}
          </button>
        ) : (
          <div className="ws-card-cta ws-card-cta-static">{cta}</div>
        )
      ) : null}
    </article>
  );
};

export default SafetyFeatureCard;
