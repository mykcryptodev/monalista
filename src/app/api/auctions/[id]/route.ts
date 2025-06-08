import { NextResponse } from "next/server";
import { getAuction, type EnglishAuction } from "thirdweb/extensions/marketplace";
import { marketplaceContract } from "~/constants";
import { getCache, setCache } from "~/lib/cache";
import { ListingStatus } from "thirdweb/extensions/marketplace/types";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const key = `auction:${id}`;
  const cached = await getCache<EnglishAuction>(key);
  if (cached) {
    return NextResponse.json(cached);
  }
  const auction = await getAuction({
    contract: marketplaceContract,
    auctionId: BigInt(id),
  });
  const status = auction.status as ListingStatus;
  if (status === "COMPLETED" || status === "CANCELLED" || status === "EXPIRED") {
    await setCache(key, auction);
  } else {
    await setCache(key, auction, { ex: 60 });
  }
  return NextResponse.json(auction);
}
