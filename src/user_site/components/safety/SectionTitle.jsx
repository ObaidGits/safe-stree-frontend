import React from 'react';

const SectionTitle = ({ eyebrow, title, description, align = 'left' }) => {
  return (
    <header className={`ws-section-title ${align === 'center' ? 'center' : ''}`}>
      {eyebrow ? <p className="ws-eyebrow">{eyebrow}</p> : null}
      <h2>{title}</h2>
      {description ? <p className="ws-description">{description}</p> : null}
    </header>
  );
};

export default SectionTitle;
