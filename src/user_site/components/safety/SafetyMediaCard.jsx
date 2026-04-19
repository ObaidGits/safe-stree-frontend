import React from 'react';

const SafetyMediaCard = ({ image, title, description, tag, className = '', style }) => {
  return (
    <article className={`ws-media-card ${className}`.trim()} style={style}>
      <img src={image} alt={title} loading="lazy" />
      <div className="ws-media-overlay">
        {tag ? <span>{tag}</span> : null}
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </article>
  );
};

export default SafetyMediaCard;
