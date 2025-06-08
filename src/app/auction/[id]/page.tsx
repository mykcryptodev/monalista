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
  isNewWinningBid,
} from "thirdweb/extensions/marketplace";
import { allowance, approve } from "thirdweb/extensions/erc20";
import { NATIVE_TOKEN_ADDRESS } from "thirdweb";
import {
  NFTProvider,
  NFTMedia,
  NFTName,
  NFTDescription,
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
import { toTokens, toUnits } from "thirdweb/utils";

export default function AuctionPage() {
  const params = useParams();
  const auctionId = params.id as string;
  type WinningBid = Awaited<ReturnType<typeof getWinningBid>>;
  const [auction, setAuction] = useState<(EnglishAuction & { winningBid?: WinningBid }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const account = useActiveAccount();
  const [hasAllowance, setHasAllowance] = useState(false);
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [isNewWinner, setIsNewWinner] = useState(true);
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
  }, [account, auction, bidAmount, minBidDisplay]);

  useEffect(() => {
    if (auction) {
      setBidAmount(minBidDisplay);
    }
  }, [auction, minBidDisplay]);

  useEffect(() => {
    const validateBid = async () => {
      if (!auction || !bidAmount) {
        setIsNewWinner(false);
        return;
      }
      try {
        const valid = await isNewWinningBid({
          contract: marketplaceContract,
          auctionId: BigInt(auction.id),
          bidAmount: toUnits(bidAmount, decimals),
        });
        setIsNewWinner(valid);
      } catch (err) {
        console.error(err);
        setIsNewWinner(false);
      }
    };
    validateBid();
  }, [bidAmount, auction, decimals]);

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
  const isBidValid =
    bidAmount !== "" && bidAmountWei >= minNextBidWei && isNewWinner;

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
              <div className="text-sm opacity-70">
                <NFTDescription />
              </div>

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
                    <TransactionButton
                      transaction={() =>
                        buyoutAuction({
                          contract: marketplaceContract,
                          auctionId: BigInt(auction.id),
                        })
                      }
                      className="!btn !btn-secondary !btn-sm"
                      onTransactionSent={() => {
                        toast.loading("Buying out auction...");
                      }}
                      onTransactionConfirmed={() => {
                        toast.dismiss();
                        toast.success("Auction bought out!");
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
                      Buyout
                    </TransactionButton>
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
        {bidModalOpen && (
          <dialog className="modal modal-open">
            <div className="modal-box space-y-2">
              <h3 className="font-bold text-lg">Place Bid</h3>
              <p className="text-sm">
                Minimum Next Bid: {minBidDisplay} {auction.minimumBidCurrencyValue.symbol}
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="any"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  className={`input input-bordered input-sm flex-1 ${bidAmount && !isBidValid ? "input-error" : ""}`}
                />
                <button
                  className="btn btn-xs"
                  onClick={() => setBidAmount(minBidDisplay)}
                >
                  Use Min
                </button>
              </div>
              {!isBidValid && bidAmount && (
                <p className="text-error text-xs">Bid must be at least {minBidDisplay} {auction.minimumBidCurrencyValue.symbol}</p>
              )}
              <div className="modal-action">
                <button className="btn btn-sm" onClick={() => setBidModalOpen(false)}>
                  Close
                </button>
                {hasAllowance ? (
                  <TransactionButton
                    transaction={() =>
                      bidInAuction({
                        contract: marketplaceContract,
                        auctionId: BigInt(auction.id),
                        bidAmountWei: toUnits(bidAmount, decimals),
                      })
                    }
                    disabled={!isBidValid}
                    className="!btn !btn-primary !btn-sm"
                    onTransactionSent={() => {
                      toast.loading("Placing bid...");
                    }}
                    onTransactionConfirmed={() => {
                      setBidModalOpen(false);
                      toast.dismiss();
                      toast.success("Bid placed!");
                      fetch("/api/cache/invalidate", {
                        method: "POST",
                        body: JSON.stringify({ keys: [`auction:${auction.id}`] }),
                      });
                    }}
                    onError={(error) => {
                      toast.dismiss();
                      toast.error(error.message);
                    }}
                  >
                    Bid
                  </TransactionButton>
                ) : (
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
                        amountWei: toUnits(bidAmount, decimals),
                      });
                    }}
                    disabled={!isBidValid}
                    className="!btn !btn-primary !btn-sm"
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
                    Approve
                  </TransactionButton>
                )}
              </div>
            </div>
          </dialog>
        )}
      </div>
    </main>
  );
}
