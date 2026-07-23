import { create } from "zustand";

const useEventStore = create((set) => ({
  events: [],
  selectedEvent: null,
  isLoading: false,
  error: null,

  setEvents: (events) => set({ events }),

  setSelectedEvent: (event) => set({ selectedEvent: event }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  clearSelectedEvent: () => set({ selectedEvent: null }),

  addEvent: (event) =>
    set((state) => ({
      events: [event, ...state.events],
    })),

  updateEvent: (id, updatedData) =>
    set((state) => ({
      events: state.events.map((event) =>
        event.id === id ? { ...event, ...updatedData } : event
      ),
      selectedEvent:
        state.selectedEvent?.id === id
          ? { ...state.selectedEvent, ...updatedData }
          : state.selectedEvent,
    })),

  removeEvent: (id) =>
    set((state) => ({
      events: state.events.filter((event) => event.id !== id),
      selectedEvent:
        state.selectedEvent?.id === id ? null : state.selectedEvent,
    })),
}));

export default useEventStore;