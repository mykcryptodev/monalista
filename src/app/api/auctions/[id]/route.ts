import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import {
  getAuction,
  type EnglishAuction,
  getWinningBid,
} from "thirdweb/extensions/marketplace";
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
  const key = `auction:${id}`;
  const cached = await getCache<EnglishAuction & { winningBid?: Awaited<ReturnType<typeof getWinningBid>> }>(key);
  if (cached) {
    return NextResponse.json(cached);
  }
  const auction = await getAuction({
    contract: marketplaceContract,
    auctionId: BigInt(id),
  });

  const winningBid = await getWinningBid({
    contract: marketplaceContract,
    auctionId: BigInt(id),
  });

  const data = serializeBigInts({ ...auction, winningBid });
  const status = auction.status as ListingStatus;
  if (status === "COMPLETED" || status === "CANCELLED" || status === "EXPIRED") {
    await setCache(key, data);
  } else {
    await setCache(key, data, { ex: 60 });
  }
  return NextResponse.json(data);
}
