export interface WikiPageFrontmatter {
  type: "chemical" | "regulation" | "hazard" | "country" | "topic" | "template" | "meta";
  slug: string;
  title: string;
  category: string;
  created: string;
  updated: string;
  sources: string[];
  cross_refs: string[];
  confidence: "high" | "medium" | "low";
  locale: "en" | "vi" | "multi";
  // Chemical-specific
  cas_number?: string;
  ec_number?: string;
  un_number?: string;
  pubchem_cid?: number;
  molecular_formula?: string;
  synonyms?: string[];
  ghs_classifications?: string[];
  signal_word?: string;
  pictograms?: string[];
  // Regulation-specific
  jurisdiction?: "vn" | "eu" | "us" | "global";
  regulation_id?: string;
  issuing_body?: string;
  effective_date?: string;
  supersedes?: string[];
  // Hazard-specific
  h_code?: string;
  hazard_category?: string;
  ghs_class?: string;
}

export interface WikiPage {
  slug: string;
  category: string;
  title: string;
  oneLiner: string | null;
  frontmatter: WikiPageFrontmatter;
  contentMd: string;
  citedBy: Array<{page: string; count: number}>;
  sourceUrls: string[] | null;
  version: number;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}
