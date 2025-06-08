import { NextResponse } from "next/server";
import { deleteCache } from "~/lib/cache";

export async function POST(request: Request) {
  const { keys } = await request.json();
  if (Array.isArray(keys)) {
    await Promise.all(keys.map((k: string) => deleteCache(k)));
  }
  return NextResponse.json({ success: true });
}
