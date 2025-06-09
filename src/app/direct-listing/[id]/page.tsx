"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getContract, NATIVE_TOKEN_ADDRESS } from "thirdweb";
import { type DirectListing, buyFromListing, cancelListing } from "thirdweb/extensions/marketplace";
import { 
  NFTProvider,
  NFTMedia,
  NFTName,
  NFTDescription,
  PayEmbed,
  TransactionButton,
  useActiveAccount,
  ConnectButton,
  TokenProvider,
  TokenIcon
} from "thirdweb/react";
import { chain, client, marketplaceContract } from "~/constants";
import Link from "next/link";
import { Account } from "~/app/components/Account";
import Countdown from "~/app/components/Countdown";
import { toast } from "react-toastify";
import TokenIconFallback from "~/app/components/TokenIconFallback";
import { getWalletBalance } from "thirdweb/wallets";
import { CollectionAbout } from "~/app/components/CollectionAbout";

export default function DirectListingPage() {
  const params = useParams();
  const listingId = params.id as string;
  const [listing, setListing] = useState<DirectListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nftInfo, setNftInfo] = useState<
    | {
        rarityRank?: number | null;
        traits: { attributeName: string; attributeValue: string }[];
      }
    | null
  >(null);
  const account = useActiveAccount();
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [userBalance, setUserBalance] = useState<bigint>(0n);
  const isNativeToken = (address: string) =>
    address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase();

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

  useEffect(() => {
    const checkBalance = async () => {
      if (!account || !listing) return;
      try {
        const balance = await getWalletBalance({
          address: account.address,
          client,
          chain,
          tokenAddress: isNativeToken(listing.currencyContractAddress) 
            ? undefined 
            : listing.currencyContractAddress,
        });
        setUserBalance(balance.value);
      } catch (err) {
        console.error("Error checking balance:", err);
        setUserBalance(0n);
      }
    };
    checkBalance();
  }, [account, listing]);

  useEffect(() => {
    const fetchNftInfo = async () => {
      if (!listing) return;
      try {
        const res = await fetch(
          `/api/nft?collectionAddress=${listing.asset.tokenAddress}&tokenId=${listing.asset.id}&chainId=${chain.id}`
        );
        if (!res.ok) return;
        const data = await res.json();
        setNftInfo(data);
      } catch (err) {
        console.error('Failed to fetch NFT info', err);
      }
    };
    fetchNftInfo();
  }, [listing]);

  if (loading) {
    return (
      <main className="bg-base-400 min-h-screen w-screen pb-20">
        <div className="w-[300px] mx-auto p-4 bg-base-300 rounded-lg min-h-full">
          <div className="flex justify-center items-center h-full">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </main>
    );
  }

  if (error || !listing) {
    return (
      <main className="bg-base-400 min-h-screen w-screen pb-20">
        <div className="w-[300px] mx-auto p-4 bg-base-300 rounded-lg min-h-full">
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

  const hasSufficientBalance = userBalance >= BigInt(listing?.currencyValuePerToken?.value || 0);

  // Common success handler
  const handlePurchaseSuccess = () => {
    toast.success("Listing bought!");
    fetch("/api/cache/invalidate", {
      method: "POST",
      body: JSON.stringify({ keys: ["listings", `listing:${listing!.id}`] }),
    });
    setShowBuyModal(false);
    setShowPay(false);
  };

  // Transaction generator
  const getBuyTransaction = () => buyFromListing({
    contract: marketplaceContract,
    listingId: BigInt(listing!.id),
    quantity: BigInt(1),
    recipient: account!.address,
  });

  return (
    <main className="bg-base-400 min-h-screen w-screen pb-20">
      <div className="w-[300px] mx-auto p-4 bg-base-300 rounded-lg min-h-full overflow-y-auto">
        <div className="mb-4">
          <Link href="/" className="btn btn-sm btn-ghost">
            ← Back
          </Link>
        </div>
        
        <NFTProvider contract={contract} tokenId={BigInt(listing.asset.id)}>
          <div className="card bg-base-100 shadow-xl">
            <NFTMedia className="w-full h-64 object-cover nftmedia-hide-overlay" />
            <div className="card-body p-4">
              <h2 className="card-title">
                <NFTName />
              </h2>
              <div className="text-sm opacity-70">
                <NFTDescription />
              </div>
              {nftInfo?.rarityRank && (
                <p className="text-xs mt-2">Rarity Rank: {nftInfo.rarityRank}</p>
              )}
              {nftInfo?.traits?.length ? (
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  {nftInfo.traits.map((t, i) => (
                    <div key={i} className="border rounded p-2">
                      <div className="font-semibold">{t.attributeName}</div>
                      <div>{t.attributeValue}</div>
                    </div>
                  ))}
                </div>
              ) : null}
              
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
                  <span className="font-semibold">Ends in:</span>
                  <Countdown endTimeInSeconds={listing.endTimeInSeconds} />
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
                  <>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowBuyModal(true)}>
                      Buy Now
                    </button>
                  </>
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

        <CollectionAbout address={listing.asset.tokenAddress} />

        {/* Buy Modal */}
        {showBuyModal && (
          <dialog className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg">Purchase Listing</h3>
              <p className="py-4">
                Price: {listing.currencyValuePerToken.displayValue} {listing.currencyValuePerToken.symbol}
              </p>
              <div className="modal-action">
                <button className="btn btn-sm" onClick={() => setShowBuyModal(false)}>
                  Cancel
                </button>
                {hasSufficientBalance ? (
                  <TransactionButton
                    transaction={getBuyTransaction}
                    className="!btn !btn-primary !btn-sm"
                    onTransactionSent={() => {
                      toast.loading("Buying listing...");
                    }}
                    onTransactionConfirmed={() => {
                      toast.dismiss();
                      handlePurchaseSuccess();
                    }}
                    onError={(error: Error) => {
                      toast.dismiss();
                      toast.error(error.message);
                    }}
                  >
                    Buy Now
                  </TransactionButton>
                ) : (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      setShowPay(true);
                      setShowBuyModal(false);
                    }}
                  >
                    Get {listing.currencyValuePerToken.symbol}
                  </button>
                )}
              </div>
            </div>
            <form method="dialog" className="modal-backdrop">
              <button onClick={() => setShowBuyModal(false)}>close</button>
            </form>
          </dialog>
        )}

        {/* PayEmbed */}
        {showPay && (
          <div 
            className="fixed inset-0 z-50 grid place-items-center bg-black/50"
            onClick={() => setShowPay(false)}
          >
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                className="btn btn-xs btn-circle absolute right-2 top-2 z-10"
                onClick={() => {
                  setShowPay(false);
                }}
              >
                ✕
              </button>
              <PayEmbed
                client={client}
                payOptions={{
                  mode: "transaction",
                  transaction: getBuyTransaction(),
                  metadata: listing.asset.metadata,
                  buyWithCrypto: {
                    prefillSource: {
                      chain: chain,
                      token: isNativeToken(listing.currencyContractAddress)
                        ? undefined
                        : {
                            address: listing.currencyContractAddress,
                            name: listing.currencyValuePerToken.name,
                            symbol: listing.currencyValuePerToken.symbol,
                            icon: `/api/token-image?chainName=${chain.name}&tokenAddress=${listing.currencyContractAddress}`,
                          },
                      allowEdits: {
                        chain: false,
                        token: false,
                      },
                    },
                  },
                  onPurchaseSuccess: handlePurchaseSuccess,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 