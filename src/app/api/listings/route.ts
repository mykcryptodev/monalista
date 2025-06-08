import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getAllValidListings, type DirectListing } from "thirdweb/extensions/marketplace";
import { marketplaceContract } from "~/constants";
import { getCache, setCache } from "~/lib/cache";

const CACHE_KEY = "listings";

export async function GET() {
  const cached = await getCache<DirectListing[]>(CACHE_KEY);
  if (cached) {
    return NextResponse.json(cached);
  }
  const listings = await getAllValidListings({ contract: marketplaceContract });
  // cache for 60 seconds
  await setCache(CACHE_KEY, listings, { ex: 60 });
  return NextResponse.json(listings);
}
