import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";

const apiKey = process.env.NEYNAR_API_KEY || "";

export const neynarClient = new NeynarAPIClient(
  new Configuration({
    apiKey,
  })
);

export async function lookupFidByAddress(address: string): Promise<number | null> {
  try {
    const { user } = await neynarClient.lookupUserByCustodyAddress({ custodyAddress: address });
    return user.fid;
  } catch (err) {
    console.error("Failed to lookup user", err);
    return null;
  }
}

export async function sendMiniAppNotification(params: {
  fid: number;
  title: string;
  body: string;
  targetUrl: string;
}) {
  return neynarClient.publishFrameNotifications({
    targetFids: [params.fid],
    notification: {
      title: params.title,
      body: params.body,
      targetUrl: params.targetUrl,
    },
  });
}
