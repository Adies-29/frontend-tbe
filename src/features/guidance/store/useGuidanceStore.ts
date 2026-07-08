import { create } from 'zustand';

const STORAGE_KEY = 'guidance_completed_tours';

function getCompletedTours(): string[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function saveCompletedTours(tours: string[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tours));
}

interface GuidanceState {
    // Drawer state
    isHelpDrawerOpen: boolean;
    openHelpDrawer: () => void;
    closeHelpDrawer: () => void;
    toggleHelpDrawer: () => void;

    // Tour state
    activeTour: string | null;
    completedTours: string[];
    startTour: (tourId: string) => void;
    endTour: () => void;
    markTourCompleted: (tourId: string) => void;
    isTourCompleted: (tourId: string) => boolean;
    resetAllTours: () => void;
}

export const useGuidanceStore = create<GuidanceState>((set, get) => ({
    // Drawer
    isHelpDrawerOpen: false,
    openHelpDrawer: () => set({ isHelpDrawerOpen: true }),
    closeHelpDrawer: () => set({ isHelpDrawerOpen: false }),
    toggleHelpDrawer: () => set((state) => ({ isHelpDrawerOpen: !state.isHelpDrawerOpen })),

    // Tour
    activeTour: null,
    completedTours: getCompletedTours(),

    startTour: (tourId: string) => set({ activeTour: tourId, isHelpDrawerOpen: false }),
    endTour: () => set({ activeTour: null }),

    markTourCompleted: (tourId: string) => {
        const current = get().completedTours;
        if (!current.includes(tourId)) {
            const updated = [...current, tourId];
            saveCompletedTours(updated);
            set({ completedTours: updated });
        }
    },

    isTourCompleted: (tourId: string) => {
        return get().completedTours.includes(tourId);
    },

    resetAllTours: () => {
        localStorage.removeItem(STORAGE_KEY);
        set({ completedTours: [], activeTour: null });
    },
}));
