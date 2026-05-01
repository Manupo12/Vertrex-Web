"use server";

import { eq, and } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { workspaceSettings } from "@/lib/db/schema";
import {
  type SettingsCategory,
  defaultSettings,
} from "@/lib/settings/settings-types";

export async function getSettingsByCategory(category: SettingsCategory): Promise<Record<string, unknown>> {
  const db = getDb();
  const settings = await db
    .select()
    .from(workspaceSettings)
    .where(eq(workspaceSettings.category, category));

  const result = { ...defaultSettings[category] };
  
  for (const setting of settings) {
    Object.assign(result, setting.value);
  }

  return result;
}

export async function getAllSettings(): Promise<Record<SettingsCategory, Record<string, unknown>>> {
  const db = getDb();
  const allSettings = await db.select().from(workspaceSettings);
  
  const result: Record<SettingsCategory, Record<string, unknown>> = { ...defaultSettings };
  
  for (const setting of allSettings) {
    if (result[setting.category as SettingsCategory]) {
      Object.assign(result[setting.category as SettingsCategory], setting.value);
    }
  }

  return result;
}

export async function updateSetting(
  category: SettingsCategory,
  key: string,
  value: unknown,
  updatedById?: string
): Promise<void> {
  const db = getDb();
  const existing = await db
    .select()
    .from(workspaceSettings)
    .where(and(
      eq(workspaceSettings.category, category),
      eq(workspaceSettings.key, key)
    ))
    .limit(1);

  if (existing.length > 0) {
    await getDb()
      .update(workspaceSettings)
      .set({
        value: { [key]: value },
        updatedById,
        updatedAt: new Date(),
      })
      .where(eq(workspaceSettings.id, existing[0].id));
  } else {
    await getDb().insert(workspaceSettings).values({
      category,
      key,
      value: { [key]: value },
      updatedById,
    });
  }
}

export async function updateSettingsBatch(
  category: SettingsCategory,
  values: Record<string, unknown>,
  updatedById?: string
): Promise<void> {
  for (const [key, value] of Object.entries(values)) {
    await updateSetting(category, key, value, updatedById);
  }
}
