import { NextRequest, NextResponse } from "next/server";
import { generateUploadSignature } from "@/lib/cloudinary";
import { uploadLimiter, getIp } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const ip = getIp(request);
  const { success } = await uploadLimiter.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "Too many upload requests." }, { status: 429 });
  }

  const sig = generateUploadSignature();
  return NextResponse.json(sig);
}
