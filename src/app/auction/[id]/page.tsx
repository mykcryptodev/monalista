"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getContract } from "thirdweb";
import {
  getAuction,
  type EnglishAuction,
  buyoutAuction,
  bidInAuction,
  cancelAuction,
} from "thirdweb/extensions/marketplace";
import {
  NFTProvider,
  NFTMedia,
  NFTName,
  NFTDescription,
  TransactionButton,
  useActiveAccount,
  ConnectButton,
} from "thirdweb/react";
import { chain, client, marketplaceContract } from "~/constants";
import Link from "next/link";
import { Account } from "~/app/components/Account";
import { toast } from "react-toastify";

export default function AuctionPage() {
  const params = useParams();
  const auctionId = params.id as string;
  const [auction, setAuction] = useState<EnglishAuction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const account = useActiveAccount();

  useEffect(() => {
    const fetchAuction = async () => {
      try {
        setLoading(true);
        const auctionData = await getAuction({
          contract: marketplaceContract,
          auctionId: BigInt(auctionId),
        });
        setAuction(auctionData);
      } catch (err) {
        setError("Failed to load auction");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (auctionId) {
      fetchAuction();
    }
  }, [auctionId]);

  if (loading) {
    return (
      <main className="bg-base-400 h-screen w-screen">
        <div className="w-[300px] mx-auto p-4 bg-base-300 rounded-lg h-full">
          <div className="flex justify-center items-center h-full">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </main>
    );
  }

  if (error || !auction) {
    return (
      <main className="bg-base-400 h-screen w-screen">
        <div className="w-[300px] mx-auto p-4 bg-base-300 rounded-lg h-full">
          <div className="flex flex-col justify-center items-center h-full gap-4">
            <p className="text-error">{error || "Auction not found"}</p>
            <Link href="/" className="btn btn-sm">
              Back to listings
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const contract = getContract({
    chain,
    client,
    address: auction.asset.tokenAddress as `0x${string}`,
  });

  return (
    <main className="bg-base-400 h-screen w-screen">
      <div className="w-[300px] mx-auto p-4 bg-base-300 rounded-lg h-full overflow-y-auto">
        <div className="mb-4">
          <Link href="/" className="btn btn-sm btn-ghost">
            ← Back
          </Link>
        </div>

        <NFTProvider contract={contract} tokenId={BigInt(auction.asset.id)}>
          <div className="card bg-base-100 shadow-xl">
            <NFTMedia className="w-full h-64 object-cover" />
            <div className="card-body p-4">
              <h2 className="card-title">
                <NFTName />
              </h2>
              <div className="text-sm opacity-70">
                <NFTDescription />
              </div>

              <div className="divider"></div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="font-semibold">Min Bid:</span>
                  <span>
                    {auction.minimumBidAmount.displayValue} {auction.minimumBidAmount.symbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Buyout:</span>
                  <span>
                    {auction.buyoutBidAmount.displayValue} {auction.buyoutBidAmount.symbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Token ID:</span>
                  <span>{auction.asset.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Quantity:</span>
                  <span>{auction.quantity.toString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Seller:</span>
                  <Account address={auction.creatorAddress} />
                </div>
              </div>

              <div className="card-actions justify-end mt-4">
                {!account ? (
                  <ConnectButton client={client} />
                ) : (
                  <>
                    <TransactionButton
                      transaction={() =>
                        bidInAuction({
                          contract: marketplaceContract,
                          auctionId: auction.id,
                          bidAmount: auction.minimumBidAmount.value,
                        })
                      }
                      className="!btn !btn-primary !btn-sm"
                      onTransactionSent={() => {
                        toast.loading("Placing bid...");
                      }}
                      onTransactionConfirmed={() => {
                        toast.dismiss();
                        toast.success("Bid placed!");
                      }}
                      onError={(error) => {
                        toast.dismiss();
                        toast.error(error.message);
                      }}
                    >
                      Bid
                    </TransactionButton>
                    <TransactionButton
                      transaction={() =>
                        buyoutAuction({
                          contract: marketplaceContract,
                          auctionId: auction.id,
                        })
                      }
                      className="!btn !btn-secondary !btn-sm"
                      onTransactionSent={() => {
                        toast.loading("Buying out auction...");
                      }}
                      onTransactionConfirmed={() => {
                        toast.dismiss();
                        toast.success("Auction bought out!");
                      }}
                      onError={(error) => {
                        toast.dismiss();
                        toast.error(error.message);
                      }}
                    >
                      Buyout
                    </TransactionButton>
                  </>
                )}
                {account?.address?.toLowerCase() === auction.creatorAddress.toLowerCase() && (
                  <TransactionButton
                    transaction={() =>
                      cancelAuction({
                        contract: marketplaceContract,
                        auctionId: auction.id,
                      })
                    }
                    className="!btn !btn-error !btn-sm"
                    onTransactionSent={() => {
                      toast.loading("Cancelling auction...");
                    }}
                    onTransactionConfirmed={() => {
                      toast.dismiss();
                      toast.success("Auction cancelled");
                    }}
                    onError={(error) => {
                      toast.dismiss();
                      toast.error(error.message);
                    }}
                  >
                    Cancel Auction
                  </TransactionButton>
                )}
              </div>
            </div>
          </div>
        </NFTProvider>
      </div>
    </main>
  );
}
