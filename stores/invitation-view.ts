import { create } from 'zustand';

interface InvitationViewStore {
  isPremium: boolean;
  setIsPremium: (value: boolean) => void;
  isCtaVisible: boolean;
  setCtaVisible: (value: boolean) => void;
}

export const useInvitationView = create<InvitationViewStore>((set) => ({
  isPremium: false,
  setIsPremium: (value) => set({ isPremium: value }),
  isCtaVisible: false,
  setCtaVisible: (value) => set({ isCtaVisible: value }),
}));
