import { supabase } from "./supabase";

export type Capsule = {
  id: string;
  userId?: string;
  title: string;
  message: string;
  openDate: string;
  createdAt: string;
  updatedAt: string;
  mood?: string;
  tags?: string[];
  prompt?: string;
  status: "draft" | "sealed" | "opened";
  vessel?: string;
  isReady?: boolean;
  isPrivate?: boolean;
  shareToken?: string;
  sharedAt?: string;
  sharedWithEmail?: string;
};

export type AppSettings = {
  theme: "calm" | "expressive";
  emailNotifications: boolean;
};

const DEFAULT_SETTINGS: AppSettings = { theme: "expressive", emailNotifications: true };

// --- ID & date helpers (unchanged) ---

export function generateId(): string {
  return `cap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

// --- Row mapping (snake_case DB → camelCase app) ---

type DbCapsuleRow = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  open_date: string | null;
  created_at: string;
  updated_at: string;
  mood: string | null;
  tags: string[] | null;
  prompt: string | null;
  status: "draft" | "sealed" | "opened";
  vessel: string | null;
  is_private: boolean;
  share_token: string | null;
  shared_at: string | null;
  shared_with_email: string | null;
  is_ready?: boolean;
};

function rowToCapsule(row: DbCapsuleRow): Capsule {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    openDate: row.open_date ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    mood: row.mood ?? undefined,
    tags: row.tags ?? undefined,
    prompt: row.prompt ?? undefined,
    status: row.status,
    vessel: row.vessel ?? undefined,
    isReady: row.is_ready ?? undefined,
    isPrivate: row.is_private,
    shareToken: row.share_token ?? undefined,
    sharedAt: row.shared_at ?? undefined,
    sharedWithEmail: row.shared_with_email ?? undefined,
  };
}

// --- CRUD (async, Supabase-backed) ---

export async function getAllCapsules(): Promise<Capsule[]> {
  const { data, error } = await supabase
    .from("capsules_safe")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToCapsule);
}

export async function getCapsule(id: string): Promise<Capsule | undefined> {
  const { data, error } = await supabase
    .from("capsules_safe")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? rowToCapsule(data) : undefined;
}

export async function saveCapsule(capsule: Capsule): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("capsules").upsert({
    id: capsule.id,
    user_id: user.id,
    title: capsule.title,
    message: capsule.message,
    open_date: capsule.openDate || null,
    created_at: capsule.createdAt,
    updated_at: capsule.updatedAt,
    mood: capsule.mood || null,
    tags: capsule.tags ?? [],
    prompt: capsule.prompt || null,
    status: capsule.status,
    vessel: capsule.vessel || "capsule",
    is_private: capsule.isPrivate ?? true,
  });

  if (error) throw new Error(error.message);
}

export async function deleteCapsule(id: string): Promise<void> {
  const { error } = await supabase.from("capsules").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function openCapsule(id: string): Promise<void> {
  const { error } = await supabase.rpc("open_capsule", { capsule_id: id });
  if (error) throw new Error(error.message);
}

// --- Sharing ---

export type ShareCapsuleResult = {
  token: string;
  emailSent: boolean;
  emailError?: string;
};

export async function shareCapsuleWithEmail(capsuleId: string, email: string): Promise<ShareCapsuleResult> {
  const token = crypto.randomUUID();
  const recipientEmail = email.toLowerCase().trim();

  const { error } = await supabase
    .from("capsules")
    .update({
      share_token: token,
      shared_at: new Date().toISOString(),
      shared_with_email: recipientEmail,
      is_private: false,
    })
    .eq("id", capsuleId);

  if (error) throw new Error(error.message);

  const { data: emailData, error: emailError } = await supabase.functions.invoke("send-share-invite", {
    body: { capsuleId },
  });

  const emailSent = emailData?.sent === true && !emailError;

  return {
    token,
    emailSent,
    emailError: emailError ? await getFunctionErrorMessage(emailError) : emailData?.error,
  };
}

async function getFunctionErrorMessage(error: unknown): Promise<string> {
  const context = error && typeof error === "object" && "context" in error
    ? (error as { context?: unknown }).context
    : undefined;

  if (context instanceof Response) {
    try {
      const body = await context.clone().json();
      if (body && typeof body.error === "string") return body.error;
    } catch {
      try {
        const text = await context.clone().text();
        if (text) return text;
      } catch {}
    }
  }

  return error instanceof Error ? error.message : "Invite email failed.";
}

export async function revokeShare(capsuleId: string): Promise<void> {
  const { error } = await supabase
    .from("capsules")
    .update({
      share_token: null,
      shared_at: null,
      shared_with_email: null,
      is_private: true,
    })
    .eq("id", capsuleId);

  if (error) throw new Error(error.message);
}

export type ShareInfo = {
  exists: boolean;
  email_hint?: string;
  title?: string;
  status?: string;
  is_ready?: boolean;
  open_date?: string;
};

export async function getShareInfo(token: string): Promise<ShareInfo> {
  const { data, error } = await supabase.rpc("get_share_info", { p_share_token: token });
  if (error) throw new Error(error.message);
  return data as ShareInfo;
}

export async function getCapsuleByToken(token: string): Promise<Capsule | undefined> {
  const { data, error } = await supabase
    .from("capsules_safe")
    .select("*")
    .eq("share_token", token)
    .eq("is_private", false)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? rowToCapsule(data) : undefined;
}

export async function openSharedCapsule(token: string): Promise<void> {
  const { error } = await supabase.rpc("open_shared_capsule", { p_share_token: token });
  if (error) throw new Error(error.message);
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

export async function exportCapsules(): Promise<string> {
  const capsules = await getAllCapsules();
  return JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      capsules,
    },
    null,
    2
  );
}

export type ImportResult = {
  added: number;
  skipped: number;
  invalid: number;
};

export async function importCapsules(json: string): Promise<ImportResult> {
  const parsed = JSON.parse(json);

  let incoming: unknown[];
  if (Array.isArray(parsed)) {
    incoming = parsed;
  } else if (parsed && Array.isArray(parsed.capsules)) {
    incoming = parsed.capsules;
  } else {
    throw new Error("No capsules found in file");
  }

  const existing = await getAllCapsules();
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
    if (!item.updatedAt) {
      item.updatedAt = item.createdAt;
    }
    await saveCapsule(item);
    added++;
  }

  return { added, skipped, invalid };
}

export async function clearAllCapsules(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("capsules")
    .delete()
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
}

// --- Settings (stored in profiles table) ---

export async function getSettings(): Promise<AppSettings> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return DEFAULT_SETTINGS;

  const { data, error } = await supabase
    .from("profiles")
    .select("theme, email_notifications")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return DEFAULT_SETTINGS;
  return {
    theme: data.theme as AppSettings["theme"],
    emailNotifications: data.email_notifications ?? true,
  };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({
      theme: settings.theme,
      email_notifications: settings.emailNotifications,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (error) throw new Error(error.message);
}

// --- localStorage helpers for migration ---

const LOCAL_STORAGE_KEY = "time-capsule:capsules";
const LOCAL_SETTINGS_KEY = "time-capsule:settings";

export function getLocalCapsules(): Capsule[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearLocalData(): void {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
  localStorage.removeItem(LOCAL_SETTINGS_KEY);
}
