import { db } from "@/lib/db/client";
import { chemicals } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

const PUBCHEM_BASE = "https://pubchem.ncbi.nlm.nih.gov/rest/pug";

interface PubChemResult {
  cid?: number;
  cas?: string;
  name?: string;
  synonymNames?: string[];
  formula?: string;
  molecularWeight?: string;
}

export async function enrichFromPubChem(
  orgId: string,
  casNumber: string
): Promise<PubChemResult | null> {
  try {
    // Search by CAS number
    const searchUrl = `${PUBCHEM_BASE}/compound/name/${encodeURIComponent(casNumber)}/property/MolecularFormula,MolecularWeight,IUPACName/JSON`;
    const res = await fetch(searchUrl, {
      headers: { "User-Agent": "MSDS-Platform/1.0" },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const prop = data?.PropertyTable?.Properties?.[0];
    if (!prop) return null;

    // Get synonyms
    const synUrl = `${PUBCHEM_BASE}/compound/cid/${prop.CID}/synonyms/TXT`;
    const synRes = await fetch(synUrl, {
      headers: { "User-Agent": "MSDS-Platform/1.0" },
    });
    let synonymNames: string[] = [];
    if (synRes.ok) {
      const synText = await synRes.text();
      synonymNames = synText.split("\n").filter(Boolean).slice(0, 20);
    }

    return {
      cid: prop.CID,
      cas: casNumber,
      name: prop.IUPACName ?? synonymNames[0] ?? casNumber,
      synonymNames,
      formula: prop.MolecularFormula,
      molecularWeight: String(prop.MolecularWeight),
    };
  } catch {
    return null;
  }
}

export async function upsertChemical(
  orgId: string,
  params: {
    casNumber?: string | null;
    name: string;
    formula?: string | null;
    ghsHazardCodes?: string[];
    ghsPictograms?: string[];
    sourceSdsId?: string;
  }
) {
  // If CAS exists for this org, update; otherwise insert
  if (params.casNumber) {
    const existing = await db
      .select({ id: chemicals.id })
      .from(chemicals)
      .where(
        and(eq(chemicals.orgId, orgId), eq(chemicals.casNumber, params.casNumber))
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(chemicals)
        .set({
          ...params,
          updatedAt: new Date(),
        })
        .where(eq(chemicals.id, existing[0].id));
      return existing[0].id;
    }
  }

  const [chem] = await db
    .insert(chemicals)
    .values({
      orgId,
      casNumber: params.casNumber ?? null,
      name: params.name,
      formula: params.formula ?? null,
      ghsHazardCodes: params.ghsHazardCodes ?? [],
      ghsPictograms: params.ghsPictograms ?? [],
      sourceSdsId: params.sourceSdsId ?? null,
    })
    .returning();

  return chem?.id;
}
