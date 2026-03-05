import crypto from "crypto";
import dbConnect from "@/lib/mongodb";
import { ApiKey } from "@/lib/models";

export async function authenticateApiKey(
  request: Request
): Promise<string | null> {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey) return null;

  const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");

  await dbConnect;

  const doc = await ApiKey.findOneAndUpdate(
    { keyHash, revokedAt: null },
    { lastUsedAt: new Date() },
    { new: true }
  );

  if (!doc) return null;

  return doc.userId.toString();
}
