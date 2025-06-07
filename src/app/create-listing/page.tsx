"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ConnectButton,
  TransactionButton,
  useActiveAccount,
} from "thirdweb/react";
import { createListing } from "thirdweb/extensions/marketplace";
import { client, marketplaceContract } from "~/constants";
import { toast } from "react-toastify";

function parseEther(value: string): bigint {
  const [whole, fraction = ""] = value.split(".");
  const frac = (fraction + "000000000000000000").slice(0, 18);
  return BigInt(whole + frac);
}

export default function CreateListingPage() {
  const account = useActiveAccount();
  const [tokenAddress, setTokenAddress] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [price, setPrice] = useState("");

  return (
    <main className="bg-base-400 h-screen w-screen">
      <div className="w-[300px] mx-auto p-4 bg-base-300 rounded-lg h-full overflow-y-auto space-y-4">
        <div className="mb-2">
          <Link href="/" className="btn btn-sm btn-ghost">
            ← Back
          </Link>
        </div>
        <input
          type="text"
          placeholder="NFT Token Address"
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value)}
          className="input input-bordered input-sm w-full"
        />
        <input
          type="text"
          placeholder="Token ID"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          className="input input-bordered input-sm w-full"
        />
        <input
          type="text"
          placeholder="Price (ETH)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="input input-bordered input-sm w-full"
        />
        <div className="flex justify-end pt-2">
          {!account ? (
            <ConnectButton client={client} />
          ) : (
            <TransactionButton
              transaction={() =>
                createListing({
                  contract: marketplaceContract,
                  assetContractAddress: tokenAddress as `0x${string}`,
                  tokenId: BigInt(tokenId),
                  quantity: 1n,
                  pricePerToken: parseEther(price),
                })
              }
              className="!btn !btn-primary !btn-sm"
              onTransactionSent={() => toast.loading("Creating listing...")}
              onTransactionConfirmed={() => {
                toast.dismiss();
                toast.success("Listing created!");
              }}
              onError={(err) => {
                toast.dismiss();
                toast.error(err.message);
              }}
            >
              Create Listing
            </TransactionButton>
          )}
        </div>
      </div>
    </main>
  );
}
