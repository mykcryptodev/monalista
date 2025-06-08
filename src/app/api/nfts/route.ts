import { NextRequest, NextResponse } from "next/server";
import { getCache, setCache } from "~/lib/cache";

const ZAPPER_URL = "https://api.zapper.xyz/v2/graphql";

const NFT_QUERY = `
query NFTBalances_USDSorted($addresses: [Address!]!, $first: Int) {
  portfolioV2(addresses: $addresses) {
    nftBalances {
      byToken(first: $first) {
        edges {
          node {
            token {
              tokenId
              name
              collection { address }
              mediasV3 { images { edges { node { thumbnail } } } }
            }
          }
        }
      }
    }
  }
}`;

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  const pageParam = request.nextUrl.searchParams.get("page");
  const page = pageParam ? parseInt(pageParam, 10) || 1 : 1;
  if (!address) {
    return NextResponse.json({ error: "address query param is required" }, { status: 400 });
  }
  const cacheKey = `nfts:${address}:${page}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }
  try {
    const pageSize = 50;
    const first = page * pageSize;
    const resp = await fetch(ZAPPER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "zapper-api-key": process.env.ZAPPER_API_KEY as string,
      },
      body: JSON.stringify({ query: NFT_QUERY, variables: { addresses: [address], first } }),
    });
    if (!resp.ok) {
      console.error(await resp.text());
      return NextResponse.json({ error: "failed to fetch nfts" }, { status: 500 });
    }
    const json = await resp.json();
    type ZapperNftEdge = {
      node: {
        token: {
          tokenId: string;
          name?: string | null;
          collection: { address: string };
          mediasV3?: {
            images?: { edges?: { node: { thumbnail?: string | null } }[] };
          };
        };
      };
    };
    const edges: ZapperNftEdge[] =
      json.data?.portfolioV2?.nftBalances?.byToken?.edges || [];
    const start = (page - 1) * pageSize;
    const slice = edges.slice(start, start + pageSize);
    const nfts = slice.map((e) => {
      const t = e.node.token;
      const image = t.mediasV3?.images?.edges?.[0]?.node?.thumbnail || null;
      return {
        id: t.tokenId,
        tokenAddress: t.collection.address,
        metadata: { name: t.name, image },
      };
    });
    const hasMore = edges.length >= first;
    const data = { nfts, hasMore };
    await setCache(cacheKey, data, { ex: 60 });
    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "failed to fetch nfts" }, { status: 500 });
  }
}
