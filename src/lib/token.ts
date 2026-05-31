import crypto from "crypto";

export function generateActivationToken() {
  const part = () => crypto.randomBytes(2).toString("hex").toUpperCase();
  return `BRI-${part()}-${part()}-${part()}`;
}

export function hashActivationToken(token: string) {
  return crypto
    .createHash("sha256")
    .update(token.trim().toUpperCase())
    .digest("hex");
}

export function previewActivationToken(token: string) {
  const normalized = token.trim().toUpperCase();
  return `${normalized.slice(0, 4)}-****-****-${normalized.slice(-4)}`;
}
