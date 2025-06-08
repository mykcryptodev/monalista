import { NextRequest, NextResponse } from "next/server";
import { getCache, setCache } from "~/lib/cache";
import { chain } from "~/constants";

const ZAPPER_URL = "https://api.zapper.xyz/v2/graphql";

export type OwnedToken = {
  tokenAddress: string;
  symbol: string;
  name?: string;
  imgUrlV2?: string;
  balance: string | number;
};

const TOKEN_QUERY = `
query TokenBalances($addresses: [Address!]!, $first: Int, $chainIds: [Int!]) {
  portfolioV2(addresses: $addresses, chainIds: $chainIds) {
    tokenBalances {
      byToken(first: $first) {
        edges { node { symbol tokenAddress balance imgUrlV2 name network { name } } }
      }
    }
  }
}`;

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  if (!address) {
    return NextResponse.json({ error: "address query param is required" }, { status: 400 });
  }

  const cacheKey = `tokens:${address}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const variables = { addresses: [address], first: 50, chainIds: [chain.id] };
    const resp = await fetch(ZAPPER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "zapper-api-key": process.env.ZAPPER_API_KEY as string,
      },
      body: JSON.stringify({ query: TOKEN_QUERY, variables }),
    });

    if (!resp.ok) {
      console.error(await resp.text());
      return NextResponse.json({ error: "failed to fetch tokens" }, { status: 500 });
    }

    const json = await resp.json();
    type ZapperTokenEdge = {
      node: {
        symbol: string;
        tokenAddress: string;
        balance: string | number;
        imgUrlV2?: string;
        name?: string;
        network: { name: string };
      };
    };
    const edges: ZapperTokenEdge[] =
      json.data?.portfolioV2?.tokenBalances?.byToken?.edges || [];
    const tokens: OwnedToken[] = edges.map((e) => {
      return {
        tokenAddress: e.node.tokenAddress,
        symbol: e.node.symbol,
        name: e.node.name ?? undefined,
        imgUrlV2: e.node.imgUrlV2 ?? undefined,
        balance: e.node.balance,
      };
    });

    try {
      const rpcUrl = chain.rpc;
      if (rpcUrl) {
        const nativeResp = await fetch(rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "eth_getBalance",
            params: [address, "latest"],
          }),
        });
        const nativeJson = await nativeResp.json();
        const bal = BigInt(nativeJson.result || "0x0").toString();
        tokens.unshift({
          tokenAddress: "native",
          symbol: chain.nativeCurrency.symbol ?? "",
          name: chain.nativeCurrency.name ?? "",
          balance: bal,
        });
      }
    } catch (e) {
      console.error(e);
    }

    const data = { tokens };
    await setCache(cacheKey, data, { ex: 60 });
    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "failed to fetch tokens" }, { status: 500 });
  }
}
