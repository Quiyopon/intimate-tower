import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeType = 'natural' | 'classic' | 'custom';
export type Tier = 'tier1' | 'tier2' | 'tier3' | 'tier4';

export const CLASSIC_COLORS: Record<Tier, string> = {
  tier1: '#F59E0B',
  tier2: '#F97316',
  tier3: '#EF4444',
  tier4: '#EC4899',
};



interface ThemeState {
  theme: ThemeType;
  customColors: Record<Tier, string>;
  setTheme: (theme: ThemeType) => void;
  setCustomColor: (tier: Tier, color: string) => void;
  getActiveColors: () => Record<Tier, string>;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'natural',
      customColors: {
        tier1: '#F59E0B',
        tier2: '#F97316',
        tier3: '#EF4444',
        tier4: '#EC4899',
      },
      setTheme: (theme) => set({ theme }),
      setCustomColor: (tier, color) =>
        set((state) => ({
          customColors: { ...state.customColors, [tier]: color },
        })),
      getActiveColors: () => {
        const state = get();
        switch (state.theme) {
          case 'natural': return CLASSIC_COLORS; // Natural uses classic accents for hover
          case 'classic': return CLASSIC_COLORS;
          case 'custom': return state.customColors;
          default: return CLASSIC_COLORS;
        }
      },
    }),
    {
      name: 'jenga-theme-storage',
    }
  )
);
