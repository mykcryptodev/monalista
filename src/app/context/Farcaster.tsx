"use client";

import { sdk, Context } from "@farcaster/frame-sdk";
import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { useConnect } from "thirdweb/react";
import { EIP1193 } from "thirdweb/wallets";
import { client, chain } from "~/constants";

type FarcasterContextType = {
  context: Context.FrameContext | undefined;
}

export const FarcasterContext = createContext<FarcasterContextType | null>(null);

export function FarcasterProvider({ children }: { children: React.ReactNode }) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();
	const { connect } = useConnect();

  const connectWallet = useCallback(async () => {
		connect(async () => {
			// create a wallet instance from the Warpcast provider
			const wallet = EIP1193.fromProvider({ provider: sdk.wallet.ethProvider });

			// trigger the connection
			await wallet.connect({ client, chain });

			// return the wallet to the app context
			return wallet;
		});
	}, [connect]);

  useEffect(() => {
		const load = async () => {
			const frameContext = await sdk.context;
			setContext(frameContext);
			sdk.actions.ready({});
		};
		if (sdk && !isSDKLoaded) {
			setIsSDKLoaded(true);
			load();
		}
	}, [isSDKLoaded]);

  // Separate effect for wallet connection after context is loaded
  useEffect(() => {
		if (context && sdk.wallet && isSDKLoaded) {
			connectWallet();
		}
	}, [context, isSDKLoaded, connectWallet]);

  const value = useMemo(() => ({
    context,
  }), [context]);

  return <FarcasterContext.Provider value={value}>{children}</FarcasterContext.Provider>;
}