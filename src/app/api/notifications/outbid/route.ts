import { NextResponse } from "next/server";
import { sendMiniAppNotification, lookupFidByAddress } from "~/lib/neynar";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { previousBidder, auctionId, nftName } = await req.json();
    if (!previousBidder || !auctionId) {
      return NextResponse.json({ error: "missing_params" }, { status: 400 });
    }
    const fid = await lookupFidByAddress(previousBidder);
    if (!fid) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }
    const targetUrl = `${process.env.NEXT_PUBLIC_URL}/auction/${auctionId}`;
    await sendMiniAppNotification({
      fid,
      title: "You've been outbid!",
      body: nftName ? `Someone outbid you on ${nftName}` : "Someone outbid you.",
      targetUrl,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to send outbid notification", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
