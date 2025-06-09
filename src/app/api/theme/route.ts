import { NextRequest, NextResponse } from "next/server";
import { redis } from "~/lib/redis";

export const dynamic = "force-dynamic";

const DEFAULT_THEME = "black";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fid = searchParams.get("fid");
  if (!fid) {
    return NextResponse.json({ theme: DEFAULT_THEME });
  }
  const theme = (await redis.get<string>(`theme:${fid}`)) ?? DEFAULT_THEME;
  return NextResponse.json({ theme });
}

export async function POST(req: NextRequest) {
  const { fid, theme } = await req.json();
  if (!fid || !theme) {
    return NextResponse.json({ error: "Missing fid or theme" }, { status: 400 });
  }
  await redis.set(`theme:${fid}`, theme);
  return NextResponse.json({ theme });
}
