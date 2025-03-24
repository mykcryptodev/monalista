"use client";

import { type Context, sdk } from "@farcaster/frame-sdk";
import { useCallback, useEffect, useState } from "react";

import { prepareTransaction } from "thirdweb";
import { base } from "thirdweb/chains";
import {
	useActiveAccount,
	useActiveWallet,
	useActiveWalletConnectionStatus,
	useConnect,
	useSendTransaction,
} from "thirdweb/react";
import { shortenAddress } from "thirdweb/utils";
import { EIP1193 } from "thirdweb/wallets";
import { Button } from "~/components/Button";
import { ThirdwebClient } from "~/constants";

export default function App() {
	const [isSDKLoaded, setIsSDKLoaded] = useState(false);
	const [context, setContext] = useState<Context.FrameContext>();
	const { connect } = useConnect();
	const wallet = useActiveWallet();
	const status = useActiveWalletConnectionStatus();
	const account = useActiveAccount();
	const sendTransactionMutation = useSendTransaction();

	const connectWallet = useCallback(async () => {
		connect(async () => {
			// create a wallet instance from the Warpcast provider
			const wallet = EIP1193.fromProvider({ provider: sdk.wallet.ethProvider });

			// trigger the connection
			await wallet.connect({ client: ThirdwebClient, chain: base });

			// return the wallet to the app context
			return wallet;
		});
	}, [connect]);

	useEffect(() => {
		const load = async () => {
			setContext(await sdk.context);
			sdk.actions.ready({});
		};
		if (sdk && !isSDKLoaded) {
			setIsSDKLoaded(true);
			load();
			if (sdk.wallet) {
				connectWallet();
			}
		}
	}, [isSDKLoaded, connectWallet]);

	return (
		<main className="bg-slate-900 h-screen w-screen text-white">
			<div className="w-[300px] mx-auto py-4 px-2 pt-32">
				<div className="flex flex-col items-center gap-2 mb-8">
					<div className="rounded-full m-auto overflow-hidden border-slate-800 border-2 size-32">
						{context?.user.pfpUrl ? (
							// We intentionally don't use Next's Image here since we can't predict the domain and should not allow any image domain
							// eslint-disable-next-line @next/next/no-img-element
							<img
								className="object-cover size-full"
								src={context?.user.pfpUrl}
								alt={context?.user.displayName ?? "User Profile Picture"}
								width={100}
								height={100}
							/>
						) : (
							<div className="flex items-center justify-center size-full bg-slate-800 animate-pulse rounded-full" />
						)}
					</div>
					<div className="w-full flex justify-center items-center text-center">
						{context?.user.displayName ? (
							<h1 className="text-2xl font-bold text-center">
								{context?.user.displayName}
							</h1>
						) : (
							<div className="animate-pulse w-36 m-auto h-8 bg-slate-800 rounded-md" />
						)}
					</div>
					{account?.address && (
						<div className="w-full flex justify-center items-center text-center">
							<p className="text-base text-slate-500">
								{shortenAddress(account.address)}
							</p>
						</div>
					)}
				</div>

				<div className="flex justify-stretch flex-col gap-2">
					{!wallet ? (
						<Button disabled={!isSDKLoaded} onClick={connectWallet}>
							{status === "connecting" ? "Connecting..." : "Connect Wallet"}
						</Button>
					) : (
						<>
							<Button disabled={!isSDKLoaded} onClick={wallet.disconnect}>
								Disconnect Wallet
							</Button>
							<Button
								disabled={!isSDKLoaded || sendTransactionMutation.isPending}
								onClick={async () => {
									if (!account) {
										alert("Transaction failed: No account connected");
										return;
									}

									if (wallet.getChain()?.id !== base.id) {
										await wallet.switchChain(base);
									}

									const tx = prepareTransaction({
										chain: base,
										to: account.address,
										value: 0n,
										client: ThirdwebClient,
									});
									sendTransactionMutation.mutate(tx);
								}}
							>
								{sendTransactionMutation.isPending
									? "Sending..."
									: "Send Transaction"}
							</Button>
							{sendTransactionMutation.error && (
								<p className="text-red-500">
									{sendTransactionMutation.error.message}
								</p>
							)}
							{sendTransactionMutation.data && (
								<p className="text-green-500">
									Sent tx:{" "}
									{sendTransactionMutation.data.transactionHash.slice(0, 6)}...
									{sendTransactionMutation.data.transactionHash.slice(-4)}
								</p>
							)}
						</>
					)}
				</div>
			</div>
		</main>
	);
}
