"use client";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getContract } from "thirdweb";
import {
  type EnglishAuction,
  buyoutAuction,
  bidInAuction,
  cancelAuction,
  getWinningBid,
} from "thirdweb/extensions/marketplace";
import { allowance, approve } from "thirdweb/extensions/erc20";
import { NATIVE_TOKEN_ADDRESS } from "thirdweb";
import {
  NFTProvider,
  NFTMedia,
  NFTName,
  PayEmbed,
  TransactionButton,
  useActiveAccount,
  ConnectButton,
  TokenProvider,
  TokenIcon,
} from "thirdweb/react";
import { chain, client, marketplaceContract } from "~/constants";
import Link from "next/link";
import { Account } from "~/app/components/Account";
import Countdown from "~/app/components/Countdown";
import { toast } from "react-toastify";
import TokenIconFallback from "~/app/components/TokenIconFallback";
import { CollectionAbout } from "~/app/components/CollectionAbout";
import { toTokens, toUnits } from "thirdweb/utils";
import { getWalletBalance } from "thirdweb/wallets";
import DescriptionWithReadMore from "~/app/components/DescriptionWithReadMore";

export default function AuctionPage() {
  const params = useParams();
  const auctionId = params.id as string;
  type WinningBid = Awaited<ReturnType<typeof getWinningBid>>;
  const [auction, setAuction] = useState<(EnglishAuction & { winningBid?: WinningBid }) | null>(null);
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
  const [hasAllowance, setHasAllowance] = useState(false);
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [showPayEmbed, setShowPayEmbed] = useState(false);
  const [buyoutModalOpen, setBuyoutModalOpen] = useState(false);
  const [showBuyoutPayEmbed, setShowBuyoutPayEmbed] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [userBalance, setUserBalance] = useState<bigint>(0n);
  const isNativeToken = (address: string) =>
    address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase();

  const decimals =
    auction?.minimumBidCurrencyValue.decimals !== undefined
      ? auction.minimumBidCurrencyValue.decimals
      : 18;

  const minNextBidWei = useMemo(() => {
    if (!auction) return 0n;
    const baseBid = auction.winningBid
      ? BigInt(auction.winningBid.bidAmountWei)
      : BigInt(auction.minimumBidAmount);
    const buffer = BigInt(auction.bidBufferBps ?? 0);
    return baseBid + (baseBid * buffer) / 10000n;
  }, [auction]);

  const minBidDisplay = useMemo(
    () => toTokens(minNextBidWei, decimals),
    [minNextBidWei, decimals],
  );

  useEffect(() => {
    if (auction) {
      setBidAmount(minBidDisplay);
    }
  }, [auction, minBidDisplay]);

  useEffect(() => {
    const checkAllowance = async () => {
      if (!account || !auction) return;
      if (isNativeToken(auction.currencyContractAddress)) {
        setHasAllowance(true);
        return;
      }
      try {
        const erc20 = getContract({
          address: auction.currencyContractAddress as `0x${string}`,
          chain,
          client,
        });
        const value = await allowance({
          contract: erc20,
          owner: account.address,
          spender: marketplaceContract.address,
        });
        const amountWei = toUnits(bidAmount || minBidDisplay, decimals);
        setHasAllowance(value >= amountWei);
      } catch (err) {
        console.error(err);
        setHasAllowance(false);
      }
    };
    checkAllowance();
  }, [account, auction, bidAmount, minBidDisplay, decimals]);

  useEffect(() => {
    const checkBalance = async () => {
      if (!account || !auction) return;
      try {
        const balance = await getWalletBalance({
          address: account.address,
          client,
          chain,
          tokenAddress: isNativeToken(auction.currencyContractAddress) 
            ? undefined 
            : auction.currencyContractAddress,
        });
        setUserBalance(balance.value);
      } catch (err) {
        console.error("Error checking balance:", err);
        setUserBalance(0n);
      }
    };
    checkBalance();
  }, [account, auction]);

  useEffect(() => {
    const fetchAuction = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/auctions/${auctionId}`);
        if (!res.ok) throw new Error();
        const auctionData: EnglishAuction & { winningBid?: WinningBid } = await res.json();
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

  // Common success handlers
  const handleBidSuccess = () => {
    toast.success("Bid placed!");
    fetch("/api/cache/invalidate", {
      method: "POST",
      body: JSON.stringify({ keys: [`auction:${auction!.id}`] }),
    });
    setBidModalOpen(false);
    setShowPayEmbed(false);
  };

  const handleBuyoutSuccess = () => {
    if (!auction) return;
    toast.success("Auction bought out!");
    fetch("/api/cache/invalidate", {
      method: "POST",
      body: JSON.stringify({ keys: ["auctions", `auction:${auction.id}`] }),
    });
    if (auction.winningBid?.bidderAddress) {
      fetch("/api/notifications/outbid", {
        method: "POST",
        body: JSON.stringify({
          previousBidder: auction.winningBid.bidderAddress,
          auctionId: auction.id,
          nftName: auction.asset.metadata.name,
        }),
      });
    }
    setBuyoutModalOpen(false);
    setShowBuyoutPayEmbed(false);
  };

  // Transaction generators
  const getBidTransaction = () => bidInAuction({
    contract: marketplaceContract,
    auctionId: BigInt(auction!.id),
    bidAmountWei: bidAmountWei,
  });

  const getBuyoutTransaction = () => buyoutAuction({
    contract: marketplaceContract,
    auctionId: BigInt(auction!.id),
  });
  
  useEffect(() => {
    const fetchNftInfo = async () => {
      if (!auction) return;
      try {
        const res = await fetch(
          `/api/nft?collectionAddress=${auction.asset.tokenAddress}&tokenId=${auction.asset.id}&chainId=${chain.id}`
        );
        if (!res.ok) return;
        const data = await res.json();
        setNftInfo(data);
      } catch (err) {
        console.error('Failed to fetch NFT info', err);
      }
    };
    fetchNftInfo();
  }, [auction]);

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

  if (error || !auction) {
    return (
      <main className="bg-base-400 min-h-screen w-screen pb-20">
        <div className="w-[300px] mx-auto p-4 bg-base-300 rounded-lg min-h-full">
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

  const bidAmountWei = toUnits(bidAmount || "0", decimals);
  const isBidValid = bidAmount !== "" && bidAmountWei >= minNextBidWei;
  const hasSufficientBalanceForBid = userBalance >= bidAmountWei;
  const hasSufficientBalanceForBuyout = userBalance >= BigInt(auction?.buyoutCurrencyValue?.value || 0);

  return (
    <main className="bg-base-400 min-h-screen w-screen pb-20">
      <div className="w-[300px] mx-auto p-4 bg-base-300 rounded-lg min-h-full overflow-y-auto">
        <div className="mb-4">
          <Link href="/" className="btn btn-sm btn-ghost">
            ← Back
          </Link>
        </div>

        <NFTProvider contract={contract} tokenId={BigInt(auction.asset.id)}>
          <div className="card bg-base-100 shadow-xl">
            <NFTMedia className="w-full h-64 object-cover nftmedia-hide-overlay" />
            <div className="card-body p-4">
              <h2 className="card-title">
                <NFTName />
              </h2>
              <DescriptionWithReadMore description={auction.asset.metadata.description || ""} />
              {nftInfo?.rarityRank && (
                <p className="text-xs mt-2">Rarity Rank: {nftInfo.rarityRank}</p>
              )}
              {nftInfo?.traits?.length ? (
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  {nftInfo.traits.map((t, i) => (
                    <div key={i} className="border rounded p-2">
                      <div className="font-semibold truncate">
                        {t.attributeName}
                      </div>
                      <div className="truncate">{t.attributeValue}</div>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="divider"></div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="font-semibold">Next Min Bid:</span>
                  <span className="flex items-center gap-1">
                    <TokenProvider
                      address={auction.currencyContractAddress as `0x${string}`}
                      client={client}
                      chain={chain}
                    >
                      <TokenIcon
                        className="w-4 h-4"
                        iconResolver={`/api/token-image?chainName=${chain.name}&tokenAddress=${auction.currencyContractAddress}`}
                        loadingComponent={<TokenIconFallback />}
                        fallbackComponent={<TokenIconFallback />}
                      />
                    </TokenProvider>
                    {minBidDisplay} {auction.minimumBidCurrencyValue.symbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Buyout:</span>
                  <span className="flex items-center gap-1">
                    <TokenProvider
                      address={auction.currencyContractAddress as `0x${string}`}
                      client={client}
                      chain={chain}
                    >
                      <TokenIcon
                        className="w-4 h-4"
                        iconResolver={`/api/token-image?chainName=${chain.name}&tokenAddress=${auction.currencyContractAddress}`}
                        loadingComponent={<TokenIconFallback />}
                        fallbackComponent={<TokenIconFallback />}
                      />
                    </TokenProvider>
                    {auction.buyoutCurrencyValue.displayValue} {auction.buyoutCurrencyValue.symbol}
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
                  <span className="font-semibold">Ends in:</span>
                  <Countdown endTimeInSeconds={auction.endTimeInSeconds} />
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Seller:</span>
                  <Account address={auction.creatorAddress} />
                </div>
                {auction.winningBid && (
                  <div className="flex justify-between items-start">
                    <span className="font-semibold">Winning Bid:</span>
                    <div className="flex flex-col items-end gap-1">
                      <Account
                        address={auction.winningBid.bidderAddress}
                        avatarClassName="w-4 h-4"
                        className="max-w-[100px]"
                      />
                      <span className="flex items-center gap-1">
                        <TokenProvider
                          address={auction.currencyContractAddress as `0x${string}`}
                          client={client}
                          chain={chain}
                        >
                          <TokenIcon
                            className="w-4 h-4"
                            iconResolver={`/api/token-image?chainName=${chain.name}&tokenAddress=${auction.currencyContractAddress}`}
                            loadingComponent={<TokenIconFallback />}
                            fallbackComponent={<TokenIconFallback />}
                          />
                        </TokenProvider>
                        {auction.winningBid.currencyValue.displayValue}{" "}
                        {auction.winningBid.currencyValue.symbol}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="card-actions justify-end mt-4">
                {!account ? (
                  <ConnectButton client={client} />
                ) : (
                  <>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setBidModalOpen(true)}
                    >
                      Bid
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setBuyoutModalOpen(true)}
                    >
                      Buyout
                    </button>
                  </>
                )}
                {account?.address?.toLowerCase() === auction.creatorAddress.toLowerCase() && (
                  <TransactionButton
                    transaction={() =>
                      cancelAuction({
                        contract: marketplaceContract,
                        auctionId: BigInt(auction.id),
                      })
                    }
                    className="!btn !btn-error !btn-sm"
                    onTransactionSent={() => {
                      toast.loading("Cancelling auction...");
                    }}
                    onTransactionConfirmed={() => {
                      toast.dismiss();
                      toast.success("Auction cancelled");
                      fetch("/api/cache/invalidate", {
                        method: "POST",
                        body: JSON.stringify({ keys: ["auctions", `auction:${auction.id}`] }),
                      });
                    }}
                    onError={(error: Error) => {
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
        <CollectionAbout address={auction.asset.tokenAddress} />
        {bidModalOpen && (
          <dialog className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg">Place Bid</h3>
              <p className="py-4">
                Minimum bid: {minBidDisplay} {auction.minimumBidCurrencyValue.symbol}
              </p>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Bid Amount</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className={`input input-bordered flex-1 ${bidAmount && !isBidValid ? "input-error" : ""}`}
                    placeholder={minBidDisplay}
                  />
                  <button
                    className="btn btn-sm"
                    onClick={() => setBidAmount(minBidDisplay)}
                  >
                    Use Min
                  </button>
                </div>
                {!isBidValid && bidAmount && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      Bid must be at least {minBidDisplay} {auction.minimumBidCurrencyValue.symbol}
                    </span>
                  </label>
                )}
              </div>
              <div className="modal-action">
                <button className="btn btn-sm" onClick={() => setBidModalOpen(false)}>
                  Cancel
                </button>
                {hasAllowance ? (
                  <>
                    {hasSufficientBalanceForBid ? (
                      <TransactionButton
                        transaction={getBidTransaction}
                        className="!btn !btn-primary !btn-sm"
                        disabled={!isBidValid}
                        onTransactionSent={() => {
                          toast.loading("Placing bid...");
                        }}
                        onTransactionConfirmed={() => {
                          toast.dismiss();
                          handleBidSuccess();
                        }}
                        onError={(error) => {
                          toast.dismiss();
                          toast.error(error.message);
                        }}
                      >
                        Place Bid
                      </TransactionButton>
                    ) : (
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          setShowPayEmbed(true);
                          setBidModalOpen(false);
                        }}
                        disabled={!isBidValid}
                      >
                        Get {auction.minimumBidCurrencyValue.symbol}
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {hasSufficientBalanceForBid ? (
                      <TransactionButton
                        transaction={() => {
                          const erc20 = getContract({
                            address: auction.currencyContractAddress as `0x${string}`,
                            chain,
                            client,
                          });
                          return approve({
                            contract: erc20,
                            spender: marketplaceContract.address,
                            amountWei: bidAmountWei,
                          });
                        }}
                        className="!btn !btn-primary !btn-sm"
                        disabled={!isBidValid}
                        onTransactionSent={() => {
                          toast.loading("Approving currency...");
                        }}
                        onTransactionConfirmed={() => {
                          toast.dismiss();
                          toast.success("Currency approved");
                          setHasAllowance(true);
                        }}
                        onError={(error) => {
                          toast.dismiss();
                          toast.error(error.message);
                        }}
                      >
                        Approve to Bid
                      </TransactionButton>
                    ) : (
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          setShowPayEmbed(true);
                          setBidModalOpen(false);
                        }}
                        disabled={!isBidValid}
                      >
                        Get {auction.minimumBidCurrencyValue.symbol}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            <form method="dialog" className="modal-backdrop">
              <button onClick={() => setBidModalOpen(false)}>close</button>
            </form>
          </dialog>
        )}

        {/* PayEmbed for Bid */}
        {showPayEmbed && (
          <div 
            className="fixed inset-0 z-50 grid place-items-center bg-black/50"
            onClick={() => setShowPayEmbed(false)}
          >
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                className="btn btn-xs btn-circle absolute right-2 top-2 z-10"
                onClick={() => {
                  setShowPayEmbed(false);
                }}
              >
                ✕
              </button>
              <PayEmbed
                client={client}
                payOptions={{
                  mode: "transaction",
                  transaction: getBidTransaction(),
                  metadata: auction.asset.metadata,
                  buyWithCrypto: {
                    prefillSource: {
                      chain: chain,
                      token: isNativeToken(auction.currencyContractAddress)
                        ? undefined
                        : {
                            address: auction.currencyContractAddress,
                            name: auction.minimumBidCurrencyValue.name,
                            symbol: auction.minimumBidCurrencyValue.symbol,
                            icon: `/api/token-image?chainName=${chain.name}&tokenAddress=${auction.currencyContractAddress}`,
                          },
                      allowEdits: {
                        chain: false,
                        token: false,
                      },
                    },
                  },
                  onPurchaseSuccess: handleBidSuccess,
                }}
              />
            </div>
          </div>
        )}

        {/* Buyout Modal */}
        {buyoutModalOpen && (
          <dialog className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg">Buyout Auction</h3>
              <p className="py-4">
                Buyout price: {auction.buyoutCurrencyValue.displayValue} {auction.buyoutCurrencyValue.symbol}
              </p>
              <div className="modal-action">
                <button className="btn btn-sm" onClick={() => setBuyoutModalOpen(false)}>
                  Cancel
                </button>
                {hasSufficientBalanceForBuyout ? (
                  <TransactionButton
                    transaction={getBuyoutTransaction}
                    className="!btn !btn-secondary !btn-sm"
                    onTransactionSent={() => {
                      toast.loading("Buying out auction...");
                    }}
                    onTransactionConfirmed={() => {
                      toast.dismiss();
                      handleBuyoutSuccess();
                    }}
                    onError={(error: Error) => {
                      toast.dismiss();
                      toast.error(error.message);
                    }}
                  >
                    Buyout
                  </TransactionButton>
                ) : (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      setShowBuyoutPayEmbed(true);
                      setBuyoutModalOpen(false);
                    }}
                  >
                    Get {auction.buyoutCurrencyValue.symbol}
                  </button>
                )}
              </div>
            </div>
            <form method="dialog" className="modal-backdrop">
              <button onClick={() => setBuyoutModalOpen(false)}>close</button>
            </form>
          </dialog>
        )}

        {/* PayEmbed for Buyout */}
        {showBuyoutPayEmbed && (
          <div 
            className="fixed inset-0 z-50 grid place-items-center bg-black/50"
            onClick={() => setShowBuyoutPayEmbed(false)}
          >
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                className="btn btn-xs btn-circle absolute right-2 top-2 z-10"
                onClick={() => {
                  setShowBuyoutPayEmbed(false);
                }}
              >
                ✕
              </button>
              <PayEmbed
                client={client}
                payOptions={{
                  mode: "transaction",
                  transaction: getBuyoutTransaction(),
                  metadata: auction.asset.metadata,
                  buyWithCrypto: {
                    prefillSource: {
                      chain: chain,
                      token: isNativeToken(auction.currencyContractAddress)
                        ? undefined
                        : {
                            address: auction.currencyContractAddress,
                            name: auction.buyoutCurrencyValue.name,
                            symbol: auction.buyoutCurrencyValue.symbol,
                            icon: `/api/token-image?chainName=${chain.name}&tokenAddress=${auction.currencyContractAddress}`,
                          },
                      allowEdits: {
                        chain: false,
                        token: false,
                      },
                    },
                  },
                  onPurchaseSuccess: handleBuyoutSuccess,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}


