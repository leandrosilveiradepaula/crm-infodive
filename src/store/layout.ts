import { create } from 'zustand';
import { ReactNode } from 'react';

interface LayoutState {
  headerActions: ReactNode | null;
  setHeaderActions: (actions: ReactNode | null) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  headerActions: null,
  setHeaderActions: (actions) => set({ headerActions: actions }),
}));
