import { createThirdwebClient, getContract } from "thirdweb";
import { base } from "thirdweb/chains";

export const client = createThirdwebClient(
  process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID
    ? {
        clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
      }
    : {
        secretKey: process.env.THIRDWEB_SECRET_KEY as string,
    }
);

export const chain = base;

export const marketplaceContract = getContract({
  address: '0xC0D13387bb111DE1BEa4596F898b8C3207efA2b1',
  chain,
  client,
});

export const appName = "Mona Lista";
export const appDescription = "An NFT marketplace on Farcaster";