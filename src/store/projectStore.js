import create from 'zustand'

const useProjectStore = create((set) => ({
  projects: [],
  addProject: (project) =>
    set((state) => ({
      projects: [...state.projects, { ...project, id: Date.now() }],
    })),
  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((proj) =>
        proj.id === id ? { ...proj, ...updates } : proj
      ),
    })),
  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((proj) => proj.id !== id),
    })),
}))

export default useProjectStore
