import { createContext, useContext, useState, useCallback, useRef } from 'react';

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [modal, setModal] = useState(null);
  const toastId = useRef(0);

  const toast = useCallback((message, type = 'success') => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3800);
  }, []);

  const showModal = useCallback((content) => setModal(content), []);
  const closeModal = useCallback(() => setModal(null), []);

  return (
    <UIContext.Provider value={{ toasts, toast, modal, showModal, closeModal }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}
