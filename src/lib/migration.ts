import { supabase } from "./supabase";
import { getLocalCapsules, clearLocalData } from "./capsules";
import type { Capsule } from "./capsules";

export type MigrationResult = {
  migrated: number;
  failed: number;
  errors: string[];
};

export function checkLocalCapsules(): Capsule[] | null {
  const capsules = getLocalCapsules();
  return capsules.length > 0 ? capsules : null;
}

export async function migrateToBackend(
  capsules: Capsule[],
  userId: string
): Promise<MigrationResult> {
  let migrated = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const capsule of capsules) {
    const { error } = await supabase.from("capsules").upsert({
      id: capsule.id,
      user_id: userId,
      title: capsule.title,
      message: capsule.message,
      open_date: capsule.openDate || null,
      created_at: capsule.createdAt,
      updated_at: capsule.updatedAt || capsule.createdAt,
      mood: capsule.mood || null,
      tags: capsule.tags ?? [],
      prompt: capsule.prompt || null,
      status: capsule.status,
      vessel: "capsule",
      is_private: true,
    });

    if (error) {
      failed++;
      errors.push(`${capsule.id}: ${error.message}`);
    } else {
      migrated++;
    }
  }

  return { migrated, failed, errors };
}

export function clearLocalAfterMigration(): void {
  clearLocalData();
}
