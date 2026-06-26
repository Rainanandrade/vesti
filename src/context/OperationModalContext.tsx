import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import NewOperationModal from '../components/NewOperationModal';

type Ctx = {
  open: () => void;
  close: () => void;
};

const OperationModalCtx = createContext<Ctx | null>(null);

// Ref global pra abrir o modal de fora da árvore React (ex: tab listener).
export const globalOperationModalRef: { current: Ctx | null } = { current: null };

export function OperationModalProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => setVisible(false), []);

  useEffect(() => {
    globalOperationModalRef.current = { open, close };
    return () => {
      globalOperationModalRef.current = null;
    };
  }, [open, close]);

  return (
    <OperationModalCtx.Provider value={{ open, close }}>
      {children}
      <NewOperationModal visible={visible} onClose={close} />
    </OperationModalCtx.Provider>
  );
}

export function useOperationModal(): Ctx {
  const ctx = useContext(OperationModalCtx);
  if (!ctx) {
    return { open: () => {}, close: () => {} };
  }
  return ctx;
}
