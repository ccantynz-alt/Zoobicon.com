export interface SavedProject {
  id: string;
  name: string;
  prompt: string;
  code: string;
  template?: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "zoobicon_projects";

export function getProjects(): SavedProject[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveProject(project: Omit<SavedProject, "id" | "createdAt" | "updatedAt">): SavedProject {
  const projects = getProjects();
  const newProject: SavedProject = {
    ...project,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  projects.unshift(newProject);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(projects)); } catch {}
  return newProject;
}

export function updateProject(id: string, updates: Partial<Pick<SavedProject, "name" | "code" | "prompt">>): SavedProject | null {
  const projects = getProjects();
  const index = projects.findIndex((p) => p.id === id);
  if (index === -1) return null;
  projects[index] = { ...projects[index], ...updates, updatedAt: Date.now() };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(projects)); } catch {}
  return projects[index];
}

export function deleteProject(id: string): boolean {
  const projects = getProjects();
  const filtered = projects.filter((p) => p.id !== id);
  if (filtered.length === projects.length) return false;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered)); } catch {}
  return true;
}

export function getProject(id: string): SavedProject | null {
  return getProjects().find((p) => p.id === id) || null;
}
