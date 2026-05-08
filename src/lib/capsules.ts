export type Capsule = {
  id: string;
  title: string;
  message: string;
  openDate: string;
  createdAt: string;
  updatedAt: string;
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

export function deleteCapsule(id: string): void {
  const all = getAllCapsules().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function generateId(): string {
  return `cap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

// --- Backup & restore ---

const VALID_STATUSES = ["draft", "sealed", "opened"] as const;

function isValidCapsule(obj: unknown): obj is Capsule {
  if (!obj || typeof obj !== "object") return false;
  const c = obj as Record<string, unknown>;
  return (
    typeof c.id === "string" &&
    typeof c.title === "string" &&
    typeof c.message === "string" &&
    typeof c.openDate === "string" &&
    typeof c.createdAt === "string" &&
    typeof c.status === "string" &&
    (VALID_STATUSES as readonly string[]).includes(c.status)
  );
}

export function exportCapsules(): string {
  const capsules = getAllCapsules();
  return JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    capsules,
  }, null, 2);
}

export type ImportResult = {
  added: number;
  skipped: number;
  invalid: number;
};

export function importCapsules(json: string): ImportResult {
  const parsed = JSON.parse(json);

  let incoming: unknown[];
  if (Array.isArray(parsed)) {
    incoming = parsed;
  } else if (parsed && Array.isArray(parsed.capsules)) {
    incoming = parsed.capsules;
  } else {
    throw new Error("No capsules found in file");
  }

  const existing = getAllCapsules();
  const existingIds = new Set(existing.map((c) => c.id));
  let added = 0;
  let skipped = 0;
  let invalid = 0;

  for (const item of incoming) {
    if (!isValidCapsule(item)) {
      invalid++;
      continue;
    }
    if (existingIds.has(item.id)) {
      skipped++;
      continue;
    }
    // Ensure updatedAt exists
    if (!item.updatedAt) {
      item.updatedAt = item.createdAt;
    }
    existing.push(item);
    existingIds.add(item.id);
    added++;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  return { added, skipped, invalid };
}

export function clearAllCapsules(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// --- Settings persistence ---

const SETTINGS_KEY = "time-capsule:settings";

export type AppSettings = {
  theme: "calm" | "expressive";
};

const DEFAULT_SETTINGS: AppSettings = { theme: "expressive" };

export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
