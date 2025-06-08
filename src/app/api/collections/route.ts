import { NextRequest, NextResponse } from "next/server";
import { getCache, setCache } from "~/lib/cache";

const ZAPPER_URL = "https://public.zapper.xyz/graphql";

const COLLECTION_QUERY = `
query CollectionMetadata($collections: [NftCollectionInput!]!) {
  nftCollections(collections: $collections) {
    address
    name
    description
    imageUrl
    stats {
      floorPriceNative
    }
  }
}`;

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  if (!address) {
    return NextResponse.json({ error: "address query param is required" }, { status: 400 });
  }

  const cacheKey = `collection:${address.toLowerCase()}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const variables = { collections: [{ address }] };
    const resp = await fetch(ZAPPER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-zapper-api-key": process.env.ZAPPER_API_KEY as string,
      },
      body: JSON.stringify({ query: COLLECTION_QUERY, variables }),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error("Zapper API error:", resp.status, errorText);
      return NextResponse.json(
        { error: `Failed to fetch collection: ${resp.status} ${resp.statusText}`, details: errorText },
        { status: 500 }
      );
    }

    const json = await resp.json();
    if (json.errors) {
      console.error("GraphQL errors:", json.errors);
      return NextResponse.json({ error: "GraphQL query failed", details: json.errors }, { status: 500 });
    }

    const collection = json.data?.nftCollections?.[0] || null;
    await setCache(cacheKey, collection, { ex: 3600 });
    return NextResponse.json(collection);
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Failed to fetch collection", details: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
