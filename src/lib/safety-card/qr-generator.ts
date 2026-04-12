import QRCode from "qrcode";
import { nanoid } from "nanoid";

export async function generateQrToken(): Promise<string> {
  return nanoid(32);
}

export async function generateQrDataUrl(
  origin: string,
  token: string
): Promise<string> {
  const url = `${origin}/public/card/${token}`;
  return QRCode.toDataURL(url, {
    width: 200,
    margin: 2,
    color: { dark: "#0E1116", light: "#FFFFFF" },
  });
}
