import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getListing, type DirectListing } from "thirdweb/extensions/marketplace";
import { marketplaceContract } from "~/constants";
import { getCache, setCache } from "~/lib/cache";
import { serializeBigInts } from "~/lib/serialize";
type ListingStatus =
  | "UNSET"
  | "CREATED"
  | "COMPLETED"
  | "CANCELLED"
  | "ACTIVE"
  | "EXPIRED";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const key = `listing:${id}`;
  const cached = await getCache<DirectListing>(key);
  if (cached) {
    return NextResponse.json(cached);
  }
  const listing = await getListing({
    contract: marketplaceContract,
    listingId: BigInt(id),
  });
  const data = serializeBigInts(listing);
  const status = listing.status as ListingStatus;
  if (status === "COMPLETED" || status === "CANCELLED" || status === "EXPIRED") {
    await setCache(key, data); // no expiration
  } else {
    await setCache(key, data, { ex: 60 });
  }
  return NextResponse.json(data);
}
