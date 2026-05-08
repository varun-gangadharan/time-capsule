export type Capsule = {
  id: string;
  title: string;
  message: string;
  openDate: string;
  createdAt: string;
  mood?: string;
  tags?: string[];
  prompt?: string;
  status: "draft" | "sealed" | "opened";
};

const STORAGE_KEY = "time-capsule:capsules";

export function getAllCapsules(): Capsule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getCapsule(id: string): Capsule | undefined {
  return getAllCapsules().find((c) => c.id === id);
}

export function saveCapsule(capsule: Capsule): void {
  const all = getAllCapsules();
  const idx = all.findIndex((c) => c.id === capsule.id);
  if (idx >= 0) {
    all[idx] = capsule;
  } else {
    all.push(capsule);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function generateId(): string {
  return `cap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function todayString(): string {
  return new Date().toISOString().split("T")[0];
}
