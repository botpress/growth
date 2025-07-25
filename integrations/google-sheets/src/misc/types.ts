import { z } from "zod";

export const SheetRowSchema = z.record(z.string(), z.string().optional());

export const StoredSheetRowSchema = z.object({
  id: z.string(),
  rowIndex: z.number(),
  data: z.record(z.string(), z.string().optional()),
  sourceSheet: z.string(),
  updatedAt: z.string(),
});

export type SheetRow = z.infer<typeof SheetRowSchema>;
export type StoredSheetRow = z.infer<typeof StoredSheetRowSchema>;

export interface SheetData {
  headers: string[];
  rows: string[][];
}

export interface KnowledgeBaseFile {
  key: string;
  content: string;
  tags: Record<string, string>;
}
