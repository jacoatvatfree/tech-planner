import create from 'zustand'

const useEngineerStore = create((set) => ({
  engineers: [],
  addEngineer: (engineer) =>
    set((state) => ({
      engineers: [...state.engineers, { ...engineer, id: Date.now() }],
    })),
  updateEngineer: (id, updates) =>
    set((state) => ({
      engineers: state.engineers.map((eng) =>
        eng.id === id ? { ...eng, ...updates } : eng
      ),
    })),
  removeEngineer: (id) =>
    set((state) => ({
      engineers: state.engineers.filter((eng) => eng.id !== id),
    })),
}))

export default useEngineerStore
