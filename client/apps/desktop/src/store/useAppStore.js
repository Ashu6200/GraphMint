import { create } from 'zustand';

/**
 * Zustand Global Store for Desktop App State Management
 */
export const useAppStore = create((set) => ({
  // Counter & Demo State
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: Math.max(0, state.count - 1) })),
  resetCount: () => set({ count: 0 }),

  // Navigation & UI State
  activeTab: 'overview',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Graph Canvas State
  selectedNode: null,
  setSelectedNode: (node) => set({ selectedNode: node }),
  zoomLevel: 100,
  setZoomLevel: (zoom) => set({ zoomLevel: zoom }),

  // Filters & Search
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Notifications / Activity Log
  activityLogs: [
    { id: 1, action: 'Initialized Desktop App', time: 'Just now', type: 'info' },
    { id: 2, action: 'Registered shared @repo/api & @repo/ui packages', time: 'Just now', type: 'success' },
  ],
  addActivityLog: (action, type = 'info') =>
    set((state) => ({
      activityLogs: [
        { id: Date.now(), action, time: new Date().toLocaleTimeString(), type },
        ...state.activityLogs,
      ],
    })),
}));
