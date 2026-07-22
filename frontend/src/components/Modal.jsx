import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
  // Désactiver le scroll du body quand la modale est ouverte
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  // Fermer la modale si on clique sur l'arrière-plan noir
  const handleOverlayClick = (e) => {
    if (e.target.className === 'modal-overlay') {
      onClose();
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={handleOverlayClick}>
      <div className="modal-container slide-in-bottom">
        <div className="modal-header d-flex justify-between items-center">
          <h2 className="text-h2" style={{ margin: 0 }}>{title}</h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} className="text-muted" />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
