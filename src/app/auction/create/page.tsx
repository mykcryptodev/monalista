"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ConnectButton,
  TransactionButton,
  useActiveAccount,
} from "thirdweb/react";
import { createAuction } from "thirdweb/extensions/marketplace";
import { client, marketplaceContract } from "~/constants";
import { toast } from "react-toastify";

export default function CreateAuctionPage() {
  const account = useActiveAccount();
  const [tokenAddress, setTokenAddress] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [currencyAddress, setCurrencyAddress] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [timeBuffer, setTimeBuffer] = useState("");
  const [bidBuffer, setBidBuffer] = useState("");
  const [minBid, setMinBid] = useState("");
  const [buyoutBid, setBuyoutBid] = useState("");

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
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="input input-bordered input-sm w-full"
        />
        <input
          type="text"
          placeholder="Currency Address"
          value={currencyAddress}
          onChange={(e) => setCurrencyAddress(e.target.value)}
          className="input input-bordered input-sm w-full"
        />
        <input
          type="datetime-local"
          placeholder="Start Time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="input input-bordered input-sm w-full"
        />
        <input
          type="datetime-local"
          placeholder="End Time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="input input-bordered input-sm w-full"
        />
        <input
          type="text"
          placeholder="Time Buffer (s)"
          value={timeBuffer}
          onChange={(e) => setTimeBuffer(e.target.value)}
          className="input input-bordered input-sm w-full"
        />
        <input
          type="text"
          placeholder="Bid Buffer (bps)"
          value={bidBuffer}
          onChange={(e) => setBidBuffer(e.target.value)}
          className="input input-bordered input-sm w-full"
        />
        <input
          type="text"
          placeholder="Minimum Bid (ETH)"
          value={minBid}
          onChange={(e) => setMinBid(e.target.value)}
          className="input input-bordered input-sm w-full"
        />
        <input
          type="text"
          placeholder="Buyout Bid (ETH)"
          value={buyoutBid}
          onChange={(e) => setBuyoutBid(e.target.value)}
          className="input input-bordered input-sm w-full"
        />
        <div className="flex justify-end pt-2">
          {!account ? (
            <ConnectButton client={client} />
          ) : (
            <TransactionButton
              transaction={() =>
                createAuction({
                  contract: marketplaceContract,
                  assetContractAddress: tokenAddress as `0x${string}`,
                  tokenId: BigInt(tokenId),
                  quantity: quantity ? BigInt(quantity) : undefined,
                  currencyContractAddress: currencyAddress
                    ? (currencyAddress as `0x${string}`)
                    : undefined,
                  startTimestamp: startTime ? new Date(startTime) : undefined,
                  endTimestamp: endTime ? new Date(endTime) : undefined,
                  timeBufferInSeconds: timeBuffer ? Number(timeBuffer) : undefined,
                  bidBufferBps: bidBuffer ? Number(bidBuffer) : undefined,
                  minimumBidAmount: minBid,
                  buyoutBidAmount: buyoutBid,
                })
              }
              className="!btn !btn-primary !btn-sm"
              onTransactionSent={() => toast.loading("Creating auction...")}
              onTransactionConfirmed={() => {
                toast.dismiss();
                toast.success("Auction created!");
              }}
              onError={(err) => {
                toast.dismiss();
                toast.error(err.message);
              }}
            >
              Create Auction
            </TransactionButton>
          )}
        </div>
      </div>
    </main>
  );
}

