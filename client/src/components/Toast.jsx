import { useUI } from '../context/UIContext';

const icons = { success: '✅', error: '❌', warning: '⚠️' };

export default function ToastContainer() {
  const { toasts } = useUI();

  return (
    <div className="toast-container" id="toastContainer">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{icons[t.type] || ''}</span> {t.message}
        </div>
      ))}
    </div>
  );
}
