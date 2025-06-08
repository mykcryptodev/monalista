import { NextRequest, NextResponse } from "next/server";
import { getCache, setCache } from "~/lib/cache";

const ZAPPER_URL = "https://public.zapper.xyz/graphql";

const NFT_QUERY = `
query NftToken($collectionAddress: Address!, $chainId: Int!, $tokenId: String!) {
  nftTokenV2(collectionAddress: $collectionAddress, chainId: $chainId, tokenId: $tokenId) {
    tokenId
    name
    description
    rarityRank
    traits { attributeName attributeValue }
  }
}`;

export async function GET(request: NextRequest) {
  const collectionAddress = request.nextUrl.searchParams.get("collectionAddress");
  const tokenId = request.nextUrl.searchParams.get("tokenId");
  const chainIdStr = request.nextUrl.searchParams.get("chainId");
  const chainId = chainIdStr ? parseInt(chainIdStr, 10) : undefined;

  if (!collectionAddress || !tokenId || !chainId) {
    return NextResponse.json({ error: "collectionAddress, tokenId and chainId are required" }, { status: 400 });
  }

  const cacheKey = `nft:${chainId}:${collectionAddress.toLowerCase()}:${tokenId}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { "Cache-Control": "public, max-age=31536000, immutable" } });
  }

  try {
    const resp = await fetch(ZAPPER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-zapper-api-key": process.env.ZAPPER_API_KEY as string,
      },
      body: JSON.stringify({ query: NFT_QUERY, variables: { collectionAddress, chainId, tokenId } }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("Zapper API error", resp.status, text);
      return NextResponse.json({ error: "Failed to fetch NFT" }, { status: 500 });
    }

    const json = await resp.json();

    if (json.errors) {
      console.error("GraphQL errors", json.errors);
      return NextResponse.json({ error: "GraphQL query failed" }, { status: 500 });
    }

    const data = json.data?.nftTokenV2;
    if (!data) {
      return NextResponse.json({ error: "NFT not found" }, { status: 404 });
    }

    await setCache(cacheKey, data); // cache indefinitely
    return NextResponse.json(data, { headers: { "Cache-Control": "public, max-age=31536000, immutable" } });
  } catch (err) {
    console.error("Unexpected error", err);
    return NextResponse.json({ error: "Failed to fetch NFT" }, { status: 500 });
  }
}
