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
import { NftDropdown, type OwnedNFT } from "~/app/components/NftDropdown";

export default function CreateAuctionPage() {
  const account = useActiveAccount();
  const [selectedNft, setSelectedNft] = useState<OwnedNFT | null>(null);
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
        <NftDropdown onSelect={setSelectedNft} />
        <div>
          <label className="label py-0">
            <span className="label-text">Quantity</span>
          </label>
          <input
            type="text"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="input input-bordered input-sm w-full"
          />
        </div>
        <div>
          <label className="label py-0">
            <span className="label-text">Currency Address</span>
          </label>
          <input
            type="text"
            value={currencyAddress}
            onChange={(e) => setCurrencyAddress(e.target.value)}
            className="input input-bordered input-sm w-full"
          />
        </div>
        <div>
          <label className="label py-0">
            <span className="label-text">Start Time</span>
          </label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="input input-bordered input-sm w-full"
          />
        </div>
        <div>
          <label className="label py-0">
            <span className="label-text">End Time</span>
          </label>
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="input input-bordered input-sm w-full"
          />
        </div>
        <div>
          <label className="label py-0">
            <span className="label-text">Time Buffer (s)</span>
          </label>
          <input
            type="text"
            value={timeBuffer}
            onChange={(e) => setTimeBuffer(e.target.value)}
            className="input input-bordered input-sm w-full"
          />
        </div>
        <div>
          <label className="label py-0">
            <span className="label-text">Bid Buffer (bps)</span>
          </label>
          <input
            type="text"
            value={bidBuffer}
            onChange={(e) => setBidBuffer(e.target.value)}
            className="input input-bordered input-sm w-full"
          />
        </div>
        <div>
          <label className="label py-0">
            <span className="label-text">Minimum Bid (ETH)</span>
          </label>
          <input
            type="text"
            value={minBid}
            onChange={(e) => setMinBid(e.target.value)}
            className="input input-bordered input-sm w-full"
          />
        </div>
        <div>
          <label className="label py-0">
            <span className="label-text">Buyout Bid (ETH)</span>
          </label>
          <input
            type="text"
            value={buyoutBid}
            onChange={(e) => setBuyoutBid(e.target.value)}
            className="input input-bordered input-sm w-full"
          />
        </div>
        <div className="flex justify-end pt-2">
          {!account ? (
            <ConnectButton client={client} />
          ) : (
            <TransactionButton
              transaction={() =>
                createAuction({
                  contract: marketplaceContract,
                  assetContractAddress: selectedNft!.tokenAddress as `0x${string}`,
                  tokenId: BigInt(selectedNft!.id),
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
              disabled={!selectedNft}
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

