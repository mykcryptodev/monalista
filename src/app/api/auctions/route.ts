import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getAllValidAuctions, type EnglishAuction } from "thirdweb/extensions/marketplace";
import { marketplaceContract } from "~/constants";
import { getCache, setCache } from "~/lib/cache";

const CACHE_KEY = "auctions";

export async function GET() {
  const cached = await getCache<EnglishAuction[]>(CACHE_KEY);
  if (cached) {
    return NextResponse.json(cached);
  }
  const auctions = await getAllValidAuctions({ contract: marketplaceContract });
  await setCache(CACHE_KEY, auctions, { ex: 60 });
  return NextResponse.json(auctions);
}
