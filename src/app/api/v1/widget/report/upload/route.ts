import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { rateLimit, getClientIp } from "@/lib/utils/rate-limit";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import crypto from "crypto";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "screenshots");

interface MagicByteEntry {
  ext: string;
  bytes: number[];
  offset?: number;
  additionalCheck?: (buffer: Buffer) => boolean;
}

const MAGIC_BYTES: MagicByteEntry[] = [
  { ext: "png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { ext: "jpg", bytes: [0xff, 0xd8, 0xff] },
  {
    ext: "webp",
    bytes: [0x52, 0x49, 0x46, 0x46],
    additionalCheck: (buffer: Buffer) => {
      if (buffer.length < 12) return false;
      return buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
    },
  },
];

function detectImageType(buffer: Buffer): string | null {
  for (const entry of MAGIC_BYTES) {
    const offset = entry.offset || 0;
    if (buffer.length < offset + entry.bytes.length) continue;

    const matches = entry.bytes.every((byte, i) => buffer[offset + i] === byte);
    if (!matches) continue;

    if (entry.additionalCheck && !entry.additionalCheck(buffer)) continue;

    return entry.ext;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimit(`widget:upload:${ip}`, 3, 3600000);
    if (!rl.success) {
      return apiError("RATE_LIMITED", "Too many uploads. Please try again later.", 429);
    }

    const formData = await request.formData();
    const file = formData.get("screenshot");

    if (!file || !(file instanceof File)) {
      return apiError("VALIDATION_FAILED", "A screenshot file is required", 400, [
        { field: "screenshot", message: "screenshot field is required" },
      ]);
    }

    if (file.size > MAX_FILE_SIZE) {
      return apiError("PAYLOAD_TOO_LARGE", "File must be under 5MB", 413);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = detectImageType(buffer);
    if (!ext) {
      return apiError("VALIDATION_FAILED", "Only PNG, JPG, and WebP images are allowed", 400);
    }

    const filename = `${crypto.randomUUID()}.${ext}`;
    const filePath = join(UPLOAD_DIR, filename);

    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(filePath, buffer);

    return apiSuccess({ url: `/uploads/screenshots/${filename}` }, undefined, 201);
  } catch (error) {
    console.error("POST /api/v1/widget/report/upload error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
