import { config } from "dotenv";
import { join, dirname } from "path";
import { readFileSync } from "fs";
import { Inngest } from "inngest";
import { put } from "@vercel/blob";

const __filename = new URL(import.meta.url).pathname;
const __dirname = dirname(__filename);

// Load from .env.local explicitly BEFORE importing app modules
config({ path: join(__dirname, "../.env.local") });

import { sql } from "@vercel/postgres";

// Create Inngest client with both signing key and event key
const inngest = new Inngest({
  id: "msds-platform",
  signingKey: process.env.INNGEST_SIGNING_KEY!,
  eventKey: process.env.INNGEST_EVENT_KEY!,
});

async function computeSha256(buffer: Buffer): Promise<string> {
  const uint8Array = new Uint8Array(buffer);
  const hashBuffer = await crypto.subtle.digest("SHA-256", uint8Array);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function uploadSampleSds() {
  console.log("Uploading 5 sample SDS files...");
  
  // Get or create organization
  const orgResult = await sql`SELECT id FROM organizations LIMIT 1`;
  let orgId: string;
  
  if (orgResult.rows.length > 0) {
    orgId = orgResult.rows[0].id;
    console.log(`Using existing org: ${orgId}`);
  } else {
    // Create a test organization
    const newOrg = await sql`
      INSERT INTO organizations (id, name, locale, plan, settings, created_at)
      VALUES (${crypto.randomUUID()}, 'Test Organization', 'vi', 'free', ${JSON.stringify({ defaultLocale: "vi" })}, now())
      RETURNING id
    `;
    orgId = newOrg.rows[0].id;
    console.log(`Created new org: ${orgId}`);
  }
  
  // Get or create test user
  const userResult = await sql`SELECT id FROM users LIMIT 1`;
  let userId: string | null;
  
  if (userResult.rows.length > 0) {
    userId = userResult.rows[0].id;
    console.log(`Using existing user: ${userId}`);
  } else {
    // uploaded_by can be null, so we'll skip creating a user for this test
    userId = null;
    console.log(`Using null for uploaded_by`);
  }
  
  const sampleDir = join(__dirname, "../sample_sds");
  
  const files = [
    "Ascorbic_Acid_SDS.pdf",
    "Citric_Acid_SDS.pdf",
    "Glycerin_SDS.pdf",
    "Paracetamol_SDS.pdf",
    "Silicon_Dioxide_SDS.pdf",
  ];
  
  for (const filename of files) {
    try {
      console.log(`Processing ${filename}...`);
      
      // Read file
      const filePath = join(sampleDir, filename);
      const buffer = readFileSync(filePath);
      const hash = await computeSha256(buffer);
      
      // Check for duplicates
      const existing = await sql`
        SELECT id FROM sds_documents
        WHERE org_id = ${orgId} AND file_hash = ${hash}
        LIMIT 1
      `;
      
      if (existing.rows.length > 0) {
        console.log(`  ✓ ${filename} already exists (duplicate)`);
        continue;
      }
      
      // Upload to Vercel Blob
      const blob = await put(filename, buffer, {
        access: 'public',
        contentType: 'application/pdf',
      });
      
      const blobUrl = blob.url;
      const blobPathname = blob.pathname;
      
      const result = await sql`
        INSERT INTO sds_documents (org_id, uploaded_by, blob_url, blob_pathname, file_hash, filename, size_bytes, status, created_at, updated_at)
        VALUES (${orgId}, ${userId}, ${blobUrl}, ${blobPathname}, ${hash}, ${filename}, ${buffer.length}, 'pending', now(), now())
        RETURNING id
      `;
      
      const sdsId = result.rows[0].id;
      console.log(`  ✓ ${filename} uploaded (sdsId: ${sdsId})`);
      
      // Enqueue Inngest extraction job
      await inngest.send({
        name: "sds.uploaded",
        data: { sdsId, orgId },
      });
      console.log(`  ✓ ${filename} extraction job enqueued`);
      
    } catch (error) {
      console.error(`  ✗ ${filename} failed:`, error);
    }
  }
  
  console.log("Sample SDS files uploaded successfully!");
  process.exit(0);
}

uploadSampleSds().catch((error) => {
  console.error("Upload failed:", error);
  process.exit(1);
});
