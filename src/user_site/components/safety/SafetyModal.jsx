import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const SafetyModal = ({ open, title, subtitle, onClose, children, footer }) => {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="ws-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="ws-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="ws-modal-close" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        <div className="ws-modal-head">
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>

        <div className="ws-modal-content">{children}</div>

        {footer ? <div className="ws-modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
};

export default SafetyModal;
