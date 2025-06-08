import { chain, client } from "~/constants";
import { getContract, readContract, NATIVE_TOKEN_ADDRESS } from "thirdweb";
import { NextRequest, NextResponse } from "next/server";
import { redis } from "~/lib/redis";

const NATIVE_TOKEN_ICON_URL =
  "https://d3r81g40ycuhqg.cloudfront.net/wallet/wais/07/23/0723c996feb7dc2d87bec4191b6af4721acfd4898759a1fa85686ae2d67f8982-ZTZjN2NhNjAtODI2Ni00YmU4LWI4NTgtOWNiZTUyYzQ3MDc4";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64");
}

function base64ToArrayBuffer(base64: string): Buffer {
  return Buffer.from(base64, "base64");
}


function getTokenImageCacheKey(chainName: string, tokenAddress: string): string {
  return `token-image:${chainName.toLowerCase()}:${tokenAddress.toLowerCase()}`;
}

async function tryFetchTokenImage(tokenAddress: string): Promise<{ imageBuffer: ArrayBuffer; contentType: string } | null> {
  const tokenContract = getContract({ chain, address: tokenAddress as `0x${string}`, client });
  try {
    const image = await readContract({ contract: tokenContract, method: "function image() view returns (string)" });
    if (image) {
      const imageResponse = await fetch(image);
      if (imageResponse.ok) {
        const imageBuffer = await imageResponse.arrayBuffer();
        const contentType = imageResponse.headers.get("content-type") || "image/png";
        return { imageBuffer, contentType };
      }
    }
  } catch {
    // ignore and try next
  }
  try {
    const imageUrl = await readContract({ contract: tokenContract, method: "function imageUrl() view returns (string)" });
    if (imageUrl) {
      const res = await fetch(imageUrl);
      if (res.ok) {
        const buf = await res.arrayBuffer();
        const contentType = res.headers.get("content-type") || "image/png";
        return { imageBuffer: buf, contentType };
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const chainName = searchParams.get("chainName");
    const tokenAddress = searchParams.get("tokenAddress");
    if (!chainName || !tokenAddress) {
      return new NextResponse("Missing required parameters: chainName and tokenAddress", { status: 400 });
    }

    const cacheKey = getTokenImageCacheKey(chainName, tokenAddress);
    const cached = await redis.get<{ image: string; contentType: string }>(cacheKey);
    if (cached) {
      const buf = base64ToArrayBuffer(cached.image);
      return new NextResponse(buf, {
        headers: {
          "Content-Type": cached.contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    if (tokenAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()) {
      const iconRes = await fetch(NATIVE_TOKEN_ICON_URL);
      if (iconRes.ok) {
        const buf = await iconRes.arrayBuffer();
        const contentType = iconRes.headers.get("content-type") || "image/png";
        await redis.set(cacheKey, {
          image: arrayBufferToBase64(buf),
          contentType,
        });
        return new NextResponse(buf, {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
    }

    const coingeckoUrl = `https://api.coingecko.com/api/v3/coins/${chainName.toLowerCase()}/contract/${tokenAddress}`;
    const res = await fetch(coingeckoUrl, { headers: { Accept: "application/json" } });

    if (res.ok) {
      const json = (await res.json()) as { image?: { large?: string } };
      const imageUrl = json.image?.large;
      if (imageUrl) {
        const imgRes = await fetch(imageUrl);
        if (imgRes.ok) {
          const buf = await imgRes.arrayBuffer();
          const contentType = imgRes.headers.get("content-type") || "image/png";
          await redis.set(cacheKey, { image: arrayBufferToBase64(buf), contentType });
          return new NextResponse(buf, {
            headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=31536000, immutable" },
          });
        }
      }
    }

    const fallback = await tryFetchTokenImage(tokenAddress);
    if (fallback) {
      await redis.set(cacheKey, { image: arrayBufferToBase64(fallback.imageBuffer), contentType: fallback.contentType });
      return new NextResponse(fallback.imageBuffer, {
        headers: { "Content-Type": fallback.contentType, "Cache-Control": "public, max-age=31536000, immutable" },
      });
    }

    return new NextResponse(null, { status: 404 });
  } catch (err) {
    console.error("Error fetching token image", err);
    return new NextResponse(null, { status: 500 });
  }
}
