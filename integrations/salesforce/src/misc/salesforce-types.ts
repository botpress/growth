import { z } from "@botpress/sdk";
import { SearchContactsOutputSchema } from "./custom-schemas/contact-schemas";
import { SearchLeadsOutputSchema } from "./custom-schemas/lead-schemas";
import { SearchCasesOutputSchema } from "./custom-schemas/case-schemas";

interface SearchResponse<T> {
  totalSize: number;
  done: boolean;
  records: T;
}

export type SearchContactsResponse = SearchResponse<
  z.infer<typeof SearchContactsOutputSchema>["records"]
>;

export type SearchLeadsResponse = SearchResponse<
  z.infer<typeof SearchLeadsOutputSchema>["records"]
>;

export type SearchCasesResponse = SearchResponse<
  z.infer<typeof SearchCasesOutputSchema>["records"]
>;
