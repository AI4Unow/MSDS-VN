import QRCode from "qrcode";
import { nanoid } from "nanoid";

// Allowed origins for QR generation
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
].filter(Boolean) as string[];

export async function generateQrToken(): Promise<string> {
  return nanoid(32);
}

export async function generateQrDataUrl(
  origin: string,
  token: string
): Promise<string> {
  // Validate origin to prevent QR phishing
  const isValidOrigin = ALLOWED_ORIGINS.some(
    (allowed) => origin === allowed || origin.startsWith(`${allowed}/`)
  );
  if (!isValidOrigin) {
    throw new Error(`Invalid origin for QR generation: ${origin}`);
  }

  const url = `${origin}/public/card/${token}`;
  return QRCode.toDataURL(url, {
    width: 200,
    margin: 2,
    color: { dark: "#0E1116", light: "#FFFFFF" },
  });
}
