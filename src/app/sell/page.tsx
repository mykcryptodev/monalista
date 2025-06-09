"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import {
  ConnectButton,
  TransactionButton,
  useActiveAccount,
} from "thirdweb/react";
import { createAuction, createListing } from "thirdweb/extensions/marketplace";
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

function toLocal(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function SellPageContent() {
  const account = useActiveAccount();
  const [saleType, setSaleType] = useState<"listing" | "auction">("listing");
  const [selectedNft, setSelectedNft] = useState<OwnedNFT | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [selectedToken, setSelectedToken] = useState<OwnedToken | null>(null);
  const [endTime, setEndTime] = useState(() =>
    toLocal(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000))
  );
  const [timeBuffer, setTimeBuffer] = useState("");
  const [bidBuffer, setBidBuffer] = useState("");
  const [minBid, setMinBid] = useState("");
  const [buyoutBid, setBuyoutBid] = useState("");
  const [price, setPrice] = useState("");
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

  // Determine if the wallet owns only a single quantity of the selected NFT
  // The logic works for both ERC721 and ERC1155 tokens
  const ownsOneNft =
    selectedNft?.quantityOwned === "1" ||
    selectedNft?.quantityOwned === undefined;

  return (
    <main className="bg-base-400 min-h-screen w-screen pb-20">
      <div className="w-[300px] mx-auto p-4 bg-base-300 rounded-lg min-h-full overflow-y-auto space-y-4">
        <div className="mb-2">
          <Link href="/" className="btn btn-sm btn-ghost">
            ← Back
          </Link>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-1 text-sm">
            <input
              type="radio"
              className="radio radio-sm"
              checked={saleType === "listing"}
              onChange={() => setSaleType("listing")}
            />
            Listing
          </label>
          <label className="flex items-center gap-1 text-sm">
            <input
              type="radio"
              className="radio radio-sm"
              checked={saleType === "auction"}
              onChange={() => setSaleType("auction")}
            />
            Auction
          </label>
        </div>
        <NftDropdown onSelect={setSelectedNft} />
        {selectedNft && !ownsOneNft && (
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
        )}
        <div>
          <label className="label py-0">
            <span className="label-text">Currency</span>
          </label>
          <TokenDropdown onSelect={setSelectedToken} />
        </div>
        {saleType === "listing" && (
          <div>
            <label className="label py-0">
              <span className="label-text">Price (ETH)</span>
            </label>
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="input input-bordered input-sm w-full"
            />
          </div>
        )}
        {saleType === "auction" && (
          <>
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
          </>
        )}
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
        <details className="collapse collapse-arrow bg-base-200">
          <summary className="collapse-title text-sm font-medium">Advanced</summary>
          <div className="collapse-content space-y-2">
            {saleType === "auction" && (
              <>
                <div>
                  <label className="label py-0">
                    <span className="label-text">Time Buffer (s)</span>
                  </label>
                  <p className="text-xs mb-1">
                    Extends the auction end when a bid is placed near the close
                    time.
                  </p>
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
                  <p className="text-xs mb-1">
                    Minimum percentage step a new bid must exceed the current bi
                    d.
                  </p>
                  <input
                    type="text"
                    value={bidBuffer}
                    onChange={(e) => setBidBuffer(e.target.value)}
                    className="input input-bordered input-sm w-full"
                  />
                </div>
              </>
            )}
          </div>
        </details>
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
                saleType === "listing"
                  ? createListing({
                      contract: marketplaceContract,
                      assetContractAddress: selectedNft!.tokenAddress as `0x${string}`,
                      tokenId: BigInt(selectedNft!.id),
                      quantity: !ownsOneNft ? BigInt(quantity) : undefined,
                      pricePerToken: price,
                      currencyContractAddress:
                        selectedToken && selectedToken.tokenAddress !== "native"
                          ? (selectedToken.tokenAddress as `0x${string}`)
                          : undefined,
                      endTimestamp: endTime ? new Date(endTime) : undefined,
                    })
                  : createAuction({
                      contract: marketplaceContract,
                      assetContractAddress: selectedNft!.tokenAddress as `0x${string}`,
                      tokenId: BigInt(selectedNft!.id),
                      quantity: !ownsOneNft ? BigInt(quantity) : undefined,
                      currencyContractAddress: selectedToken
                        ? selectedToken.tokenAddress === ZERO_ADDRESS
                          ? NATIVE_TOKEN_ADDRESS
                          : (selectedToken.tokenAddress as `0x${string}`)
                        : undefined,
                      endTimestamp: endTime ? new Date(endTime) : undefined,
                      timeBufferInSeconds: timeBuffer ? Number(timeBuffer) : undefined,
                      bidBufferBps: bidBuffer ? Number(bidBuffer) : undefined,
                      minimumBidAmount: minBid,
                      buyoutBidAmount: buyoutBid,
                    })
              }
              disabled={!selectedNft || !selectedToken}
              className="!btn !btn-primary !btn-sm"
              onTransactionSent={() =>
                toast.loading(
                  saleType === "listing" ? "Creating listing..." : "Creating auction..."
                )
              }
              onTransactionConfirmed={() => {
                toast.dismiss();
                toast.success(
                  saleType === "listing" ? "Listing created!" : "Auction created!"
                );
              }}
              onError={(err: Error) => {
                toast.dismiss();
                toast.error(err.message);
              }}
            >
              {saleType === "listing" ? "Create Listing" : "Create Auction"}
            </TransactionButton>
          )}
        </div>
      </div>
    </main>
  );
}

export default function SellPage() {
  return (
    <Suspense fallback={null}>
      <SellPageContent />
    </Suspense>
  );
}
