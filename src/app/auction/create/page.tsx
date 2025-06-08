"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ConnectButton,
  TransactionButton,
  useActiveAccount,
} from "thirdweb/react";
import { createAuction } from "thirdweb/extensions/marketplace";
import {
  chain,
  client,
  marketplaceContract,
} from "~/constants";
import { getContract, NATIVE_TOKEN_ADDRESS, ZERO_ADDRESS } from "thirdweb";
import { isApprovedForAll as isApprovedForAll721 } from "thirdweb/extensions/erc721";
import { isApprovedForAll as isApprovedForAll1155 } from "thirdweb/extensions/erc1155";
import { setApprovalForAll as approve721 } from "thirdweb/extensions/erc721";
import { setApprovalForAll as approve1155 } from "thirdweb/extensions/erc1155";
import { toast } from "react-toastify";
import { NftDropdown, type OwnedNFT } from "~/app/components/NftDropdown";
import { TokenDropdown, type OwnedToken } from "~/app/components/TokenDropdown";

export default function CreateAuctionPage() {
  const account = useActiveAccount();
  const [selectedNft, setSelectedNft] = useState<OwnedNFT | null>(null);
  const [quantity, setQuantity] = useState("");
  const [selectedToken, setSelectedToken] = useState<OwnedToken | null>(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [timeBuffer, setTimeBuffer] = useState("");
  const [bidBuffer, setBidBuffer] = useState("");
  const [minBid, setMinBid] = useState("");
  const [buyoutBid, setBuyoutBid] = useState("");
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    const checkApproval = async () => {
      if (!account || !selectedNft?.tokenAddress) return;
      try {
        const contract = getContract({
          address: selectedNft.tokenAddress as `0x${string}`,
          chain,
          client,
        });
        let isApproved = await isApprovedForAll721({
          contract,
          owner: account.address,
          operator: marketplaceContract.address,
        });
        if (!isApproved) {
          isApproved = await isApprovedForAll1155({
            contract,
            owner: account.address,
            operator: marketplaceContract.address,
          });
        }
        setApproved(isApproved);
      } catch (err) {
        console.error(err);
      }
    };
    checkApproval();
  }, [account, selectedNft?.tokenAddress]);

  return (
    <main className="bg-base-400 min-h-screen w-screen pb-20">
      <div className="w-[300px] mx-auto p-4 bg-base-300 rounded-lg min-h-full overflow-y-auto space-y-4">
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
            <span className="label-text">Currency</span>
          </label>
          <TokenDropdown onSelect={setSelectedToken} />
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
          ) : !approved ? (
            <TransactionButton
              transaction={() => {
                const contract = getContract({
                  address: selectedNft?.tokenAddress as `0x${string}`,
                  chain,
                  client,
                });
                return approve721({
                  contract,
                  operator: marketplaceContract.address,
                  approved: true,
                });
              }}
              className="!btn !btn-primary !btn-sm"
              onTransactionSent={() => toast.loading("Approving token...")}
              onTransactionConfirmed={() => {
                toast.dismiss();
                toast.success("Token approved");
                setApproved(true);
              }}
              onError={async () => {
                try {
                  const contract = getContract({
                    address: selectedNft?.tokenAddress as `0x${string}`,
                    chain,
                    client,
                  });
                  await approve1155({
                    contract,
                    operator: marketplaceContract.address,
                    approved: true,
                  });
                  setApproved(true);
                  toast.dismiss();
                  toast.success("Token approved");
                } catch (err) {
                  toast.dismiss();
                  toast.error((err as Error).message);
                }
              }}
            >
              Approve
            </TransactionButton>
          ) : (
            <TransactionButton
              transaction={() =>
                createAuction({
                  contract: marketplaceContract,
                  assetContractAddress: selectedNft!.tokenAddress as `0x${string}`,
                  tokenId: BigInt(selectedNft!.id),
                  quantity: quantity ? BigInt(quantity) : undefined,
                  currencyContractAddress: selectedToken 
                    ? selectedToken.tokenAddress === ZERO_ADDRESS
                      ? NATIVE_TOKEN_ADDRESS
                      : (selectedToken.tokenAddress as `0x${string}`)
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
              onError={(err: Error) => {
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

