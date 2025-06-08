import { NextRequest, NextResponse } from "next/server";
import { getCache, setCache } from "~/lib/cache";

const ZAPPER_URL = "https://public.zapper.xyz/graphql";

const NFT_QUERY = `
query UserNftTokens(
  $owners: [Address!]!
  $network: Network
  $first: Int = 50
  $after: String
) {
  nftUsersTokens(
    owners: $owners
    network: $network
    first: $first
    after: $after
  ) {
    edges {
      node {
        tokenId
        name
        description
        
        collection {
          name
          address
          network
        }
        
        mediasV3 {
          images(first: 1) {
            edges {
              node {
                thumbnail
              }
            }
          }
        }
      }
      
      balance
    }
    
    pageInfo {
      hasNextPage
      endCursor
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
    // For pagination, we need to track cursor from previous pages
    // For now, we'll use a simple offset approach
    const variables = {
      owners: [address],
      first: pageSize,
      // If we had cursor-based pagination, we'd use: after: cursor
    };
    
    const resp = await fetch(ZAPPER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-zapper-api-key": process.env.ZAPPER_API_KEY as string,
      },
      body: JSON.stringify({ query: NFT_QUERY, variables }),
    });
    
    if (!resp.ok) {
      const errorText = await resp.text();
      console.error("Zapper API error:", resp.status, errorText);
      
      // Try to parse error response
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.errors) {
          console.error("GraphQL errors:", errorData.errors);
        }
      } catch (e) {
        // Not JSON, log raw text
        console.error("Zapper API error:", errorText);
      }
      
      return NextResponse.json({ 
        error: `Failed to fetch NFTs: ${resp.status} ${resp.statusText}`,
        details: errorText 
      }, { status: 500 });
    }
    
    const json = await resp.json();
    
    // Check for GraphQL errors
    if (json.errors) {
      console.error("GraphQL errors:", json.errors);
      return NextResponse.json({ 
        error: "GraphQL query failed",
        details: json.errors 
      }, { status: 500 });
    }
    
    const edges = json.data?.nftUsersTokens?.edges || [];
    const pageInfo = json.data?.nftUsersTokens?.pageInfo || { hasNextPage: false };
    
    const nfts = edges.map((edge: any) => {
      const token = edge.node;
      const imageEdge = token.mediasV3?.images?.edges?.[0];
      const image = imageEdge?.node?.thumbnail || null;
      
      return {
        id: token.tokenId,
        tokenAddress: token.collection.address,
        metadata: { 
          name: token.name || token.tokenId,
          image 
        },
        quantityOwned: edge.balance?.toString() || "1"
      };
    });
    
    const data = { 
      nfts, 
      hasMore: pageInfo.hasNextPage
    };
    
    await setCache(cacheKey, data, { ex: 60 });
    return NextResponse.json(data);
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ 
      error: "Failed to fetch NFTs",
      details: err instanceof Error ? err.message : "Unknown error"
    }, { status: 500 });
  }
}
