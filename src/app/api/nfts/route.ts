import { NextRequest, NextResponse } from "next/server";
import { Insight } from "thirdweb";
import { client, chain } from "~/constants";

function convertBigInt(obj: unknown): unknown {
  if (typeof obj === "bigint") {
    return obj.toString();
  }
  if (Array.isArray(obj)) {
    return obj.map(convertBigInt);
  }
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [k, convertBigInt(v)])
    );
  }
  return obj;
}

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  if (!address) {
    return NextResponse.json({ error: "address query param is required" }, { status: 400 });
  }
  try {
    const nfts = await Insight.getOwnedNFTs({
      client,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      chains: [{ ...(chain as any), rpc: (chain as any).rpc }],
      ownerAddress: address,
      includeMetadata: true,
    });
    const sanitized = convertBigInt(nfts);
    return NextResponse.json(sanitized);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "failed to fetch nfts" }, { status: 500 });
  }
}
