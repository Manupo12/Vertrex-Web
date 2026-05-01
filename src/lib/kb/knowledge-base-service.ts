"use server";

import { getDb } from "@/lib/db";
import { kbArticles } from "@/lib/db/schema";
import { desc, eq, like, or } from "drizzle-orm";

export type KbCategory = "general" | "technical" | "billing" | "onboarding" | "faq";

export type KbArticle = {
  id: string;
  title: string;
  content: string;
  category: KbCategory;
  tags: string[];
  viewCount: number;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export async function getKbArticles(category?: KbCategory): Promise<KbArticle[]> {
  const db = getDb();
  
  if (category) {
    const results = await db.select().from(kbArticles).where(eq(kbArticles.category, category)).orderBy(desc(kbArticles.viewCount));
    return results.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      category: a.category as KbCategory,
      tags: a.tags as string[],
      viewCount: a.viewCount,
      helpfulCount: a.helpfulCount,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));
  }
  
  const results = await db.select().from(kbArticles).orderBy(desc(kbArticles.viewCount));
  
  return results.map((a) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    category: a.category as KbCategory,
    tags: a.tags as string[],
    viewCount: a.viewCount,
    helpfulCount: a.helpfulCount,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  }));
}

export async function searchKbArticles(query: string): Promise<KbArticle[]> {
  const db = getDb();
  const results = await db
    .select()
    .from(kbArticles)
    .where(
      or(
        like(kbArticles.title, `%${query}%`),
        like(kbArticles.content, `%${query}%`)
      )
    )
    .orderBy(desc(kbArticles.viewCount));
  
  return results.map((a) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    category: a.category as KbCategory,
    tags: a.tags as string[],
    viewCount: a.viewCount,
    helpfulCount: a.helpfulCount,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  }));
}

export async function getKbArticle(id: string): Promise<KbArticle | null> {
  const db = getDb();
  const [result] = await db.select().from(kbArticles).where(eq(kbArticles.id, id)).limit(1);
  
  if (!result) return null;
  
  // Increment view count
  await db.update(kbArticles).set({ viewCount: result.viewCount + 1 }).where(eq(kbArticles.id, id));
  
  return {
    id: result.id,
    title: result.title,
    content: result.content,
    category: result.category as KbCategory,
    tags: result.tags as string[],
    viewCount: result.viewCount + 1,
    helpfulCount: result.helpfulCount,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  };
}

export async function createKbArticle(data: {
  title: string;
  content: string;
  category: KbCategory;
  tags?: string[];
}): Promise<KbArticle> {
  const db = getDb();
  const [result] = await db
    .insert(kbArticles)
    .values({
      title: data.title,
      content: data.content,
      category: data.category,
      tags: data.tags ?? [],
      viewCount: 0,
      helpfulCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  
  return {
    id: result.id,
    title: result.title,
    content: result.content,
    category: result.category as KbCategory,
    tags: result.tags as string[],
    viewCount: result.viewCount,
    helpfulCount: result.helpfulCount,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  };
}

export async function markArticleHelpful(id: string): Promise<void> {
  const db = getDb();
  const [article] = await db.select().from(kbArticles).where(eq(kbArticles.id, id)).limit(1);
  if (article) {
    await db.update(kbArticles).set({ helpfulCount: article.helpfulCount + 1 }).where(eq(kbArticles.id, id));
  }
}
