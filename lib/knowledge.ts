/**
 * Knowledge Base — RAG üçün bilik anbari
 * Supabase pgvector üzərindən semantic axtarış
 */

import { getSupabaseAdmin } from "./supabase";
import { embed, embedBatch } from "./embeddings";

export interface KnowledgeChunk {
  id:       string;
  content:  string;
  source:   string;
  metadata: Record<string, unknown>;
  score?:   number;
}

// ─── Bilik əlavə et ──────────────────────────────────────────────────────────

export async function addKnowledge(
  content:  string,
  source:   string,
  metadata: Record<string, unknown> = {}
): Promise<string> {
  const admin = getSupabaseAdmin();
  const embedding = await embed(content);

  const { data, error } = await admin
    .from("knowledge_base")
    .insert({ content, source, metadata, embedding })
    .select("id")
    .single();

  if (error) throw new Error(`Knowledge insert xətası: ${error.message}`);
  return data.id;
}

// Toplu əlavə — seed üçün
export async function addKnowledgeBatch(
  items: Array<{ content: string; source: string; metadata?: Record<string, unknown> }>
): Promise<void> {
  const admin = getSupabaseAdmin();
  const texts = items.map(i => i.content);
  const embeddings = await embedBatch(texts);

  const rows = items.map((item, i) => ({
    content:   item.content,
    source:    item.source,
    metadata:  item.metadata || {},
    embedding: embeddings[i],
  }));

  const { error } = await admin.from("knowledge_base").insert(rows);
  if (error) throw new Error(`Knowledge batch insert xətası: ${error.message}`);
}

// ─── Semantic Axtarış ────────────────────────────────────────────────────────

export async function searchKnowledge(
  query:  string,
  limit   = 5,
  source?: string   // filter by source type
): Promise<KnowledgeChunk[]> {
  try {
    const admin = getSupabaseAdmin();
    const queryEmbedding = await embed(query);

    // pgvector cosine similarity axtarışı
    const { data, error } = await admin.rpc("search_knowledge", {
      query_embedding: queryEmbedding,
      match_count:     limit,
      source_filter:   source || null,
    });

    if (error) {
      console.error("[RAG] search_knowledge RPC xətası:", error.message);
      return [];
    }

    return (data || []).map((row: {
      id: string;
      content: string;
      source: string;
      metadata: Record<string, unknown>;
      similarity: number;
    }) => ({
      id:       row.id,
      content:  row.content,
      source:   row.source,
      metadata: row.metadata,
      score:    row.similarity,
    }));
  } catch (err) {
    console.error("[RAG] searchKnowledge xətası:", err);
    return [];
  }
}

// ─── Bilikləri sil ───────────────────────────────────────────────────────────

export async function deleteKnowledge(id: string): Promise<void> {
  const admin = getSupabaseAdmin();
  await admin.from("knowledge_base").delete().eq("id", id);
}

export async function clearKnowledgeBySource(source: string): Promise<void> {
  const admin = getSupabaseAdmin();
  await admin.from("knowledge_base").delete().eq("source", source);
}
