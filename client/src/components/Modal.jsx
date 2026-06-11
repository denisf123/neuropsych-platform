import { useUI } from '../context/UIContext';

export default function Modal() {
  const { modal, closeModal } = useUI();
  if (!modal) return null;

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {modal}
      </div>
    </div>
  );
}
