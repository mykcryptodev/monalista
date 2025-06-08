import { NextResponse } from "next/server";
import { getListing, type DirectListing } from "thirdweb/extensions/marketplace";
import { marketplaceContract } from "~/constants";
import { getCache, setCache } from "~/lib/cache";
import { ListingStatus } from "thirdweb/extensions/marketplace/types";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const key = `listing:${id}`;
  const cached = await getCache<DirectListing>(key);
  if (cached) {
    return NextResponse.json(cached);
  }
  const listing = await getListing({
    contract: marketplaceContract,
    listingId: BigInt(id),
  });
  const status = listing.status as ListingStatus;
  if (status === "COMPLETED" || status === "CANCELLED" || status === "EXPIRED") {
    await setCache(key, listing); // no expiration
  } else {
    await setCache(key, listing, { ex: 60 });
  }
  return NextResponse.json(listing);
}
