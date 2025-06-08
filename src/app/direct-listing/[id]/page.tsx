"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getContract } from "thirdweb";
import { type DirectListing, buyFromListing, cancelListing } from "thirdweb/extensions/marketplace";
import { 
  NFTProvider,
  NFTMedia,
  NFTName,
  NFTDescription,
  TransactionButton,
  useActiveAccount,
  ConnectButton,
  TokenProvider,
  TokenIcon
} from "thirdweb/react";
import { chain, client, marketplaceContract } from "~/constants";
import Link from "next/link";
import { Account } from "~/app/components/Account";
import { toast } from "react-toastify";
import TokenIconFallback from "~/app/components/TokenIconFallback";

export default function DirectListingPage() {
  const params = useParams();
  const listingId = params.id as string;
  const [listing, setListing] = useState<DirectListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const account = useActiveAccount();

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/listings/${listingId}`);
        if (!res.ok) throw new Error();
        const listingData: DirectListing = await res.json();
        setListing(listingData);
      } catch (err) {
        setError("Failed to load listing");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (listingId) {
      fetchListing();
    }
  }, [listingId]);

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

  if (error || !listing) {
    return (
      <main className="bg-base-400 h-screen w-screen">
        <div className="w-[300px] mx-auto p-4 bg-base-300 rounded-lg h-full">
          <div className="flex flex-col justify-center items-center h-full gap-4">
            <p className="text-error">{error || "Listing not found"}</p>
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
    address: listing.asset.tokenAddress as `0x${string}`,
  });

  return (
    <main className="bg-base-400 h-screen w-screen">
      <div className="w-[300px] mx-auto p-4 bg-base-300 rounded-lg h-full overflow-y-auto">
        <div className="mb-4">
          <Link href="/" className="btn btn-sm btn-ghost">
            ← Back
          </Link>
        </div>
        
        <NFTProvider contract={contract} tokenId={BigInt(listing.asset.id)}>
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
                  <span className="font-semibold">Price:</span>
                  <span className="flex items-center gap-1">
                    <TokenProvider
                      address={listing.currencyContractAddress as `0x${string}`}
                      client={client}
                      chain={chain}
                    >
                      <TokenIcon
                        className="w-4 h-4"
                        iconResolver={`/api/token-image?chainName=${chain.name}&tokenAddress=${listing.currencyContractAddress}`}
                        loadingComponent={<TokenIconFallback />}
                        fallbackComponent={<TokenIconFallback />}
                      />
                    </TokenProvider>
                    {listing.currencyValuePerToken.displayValue} {listing.currencyValuePerToken.symbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Token ID:</span>
                  <span>{listing.asset.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Quantity:</span>
                  <span>{listing.quantity.toString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Seller:</span>
                  <Account address={listing.creatorAddress} />
                </div>
              </div>
              
              <div className="card-actions justify-end mt-4">
                {!account ? (
                  <ConnectButton client={client} />
                ) : (
                  <TransactionButton
                    transaction={() =>
                      buyFromListing({
                        contract: marketplaceContract,
                        listingId: BigInt(listing.id),
                        quantity: BigInt(1),
                        recipient: account.address,
                      })
                    }
                    className="!btn !btn-primary !btn-sm"
                    onTransactionSent={() => {
                      toast.loading("Buying listing...");
                    }}
                    onTransactionConfirmed={() => {
                      toast.dismiss();
                      toast.success("Listing bought!");
                      fetch("/api/cache/invalidate", {
                        method: "POST",
                        body: JSON.stringify({ keys: ["listings", `listing:${listing.id}`] }),
                      });
                    }}
                    onError={(error: Error) => {
                      toast.dismiss();
                      toast.error(error.message);
                    }}
                  >
                    Buy Now
                  </TransactionButton>
                )}
                {account?.address?.toLowerCase() === listing.creatorAddress.toLowerCase() && (
                  <TransactionButton
                    transaction={() =>
                      cancelListing({
                        contract: marketplaceContract,
                        listingId: BigInt(listing.id),
                      })
                    }
                    className="!btn !btn-error !btn-sm"
                    onTransactionSent={() => {
                      toast.loading("Cancelling listing...");
                    }}
                    onTransactionConfirmed={() => {
                      toast.dismiss();
                      toast.success("Listing cancelled");
                      fetch("/api/cache/invalidate", {
                        method: "POST",
                        body: JSON.stringify({ keys: ["listings", `listing:${listing.id}`] }),
                      });
                    }}
                    onError={(error: Error) => {
                      toast.dismiss();
                      toast.error(error.message);
                    }}
                  >Cancel Listing</TransactionButton>
                )}
              </div>
            </div>
          </div>
        </NFTProvider>
      </div>
    </main>
  );
} 