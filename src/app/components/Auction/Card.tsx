import { type FC, useState, useEffect } from "react";
import { getContract, NATIVE_TOKEN_ADDRESS } from "thirdweb";
import { buyoutAuction, type EnglishAuction } from "thirdweb/extensions/marketplace";
import Countdown from "../Countdown";
import { NFTProvider, NFTMedia, PayEmbed, TransactionButton, useActiveAccount, TokenProvider, TokenIcon } from "thirdweb/react";
import { chain, client, marketplaceContract } from "~/constants";
import { useRouter } from "next/navigation";
import TokenIconFallback from "../TokenIconFallback";
import { Account } from "~/app/components/Account";
import { getWalletBalance } from "thirdweb/wallets";

type Props = {
  auction: EnglishAuction;
};

export const AuctionCard: FC<Props> = ({ auction }) => {
  const account = useActiveAccount();
  const router = useRouter();
  const [showPay, setShowPay] = useState(false);
  const [userBalance, setUserBalance] = useState<bigint>(0n);
  const contract = getContract({
    chain,
    client,
    address: auction.asset.tokenAddress as `0x${string}`,
  });
  const isNativeToken = (address: string) =>
    address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase();

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

  const handleCardClick = () => {
    router.push(`/auction/${auction.id}`);
  };

  // Common success handler
  const handleBuyoutSuccess = () => {
    setShowPay(false);
  };

  // Transaction generator
  const getBuyoutTransaction = () => buyoutAuction({
    contract: marketplaceContract,
    auctionId: auction.id,
  });

  const hasSufficientBalance = userBalance >= BigInt(auction?.buyoutCurrencyValue?.value || 0);

  return (
    <NFTProvider contract={contract} tokenId={BigInt(auction.asset.id)}>
      <div
        className="card bg-base-200 px-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="p-2 flex items-center text-xs w-full justify-between">
          <Account
            address={auction.creatorAddress}
            avatarClassName="w-4 h-4"
            className="w-1/2 overflow-hidden"
          />
          <Countdown endTimeInSeconds={auction.endTimeInSeconds} unitsToDisplay={2} />
        </div>
        <figure>
          <NFTMedia className="nftmedia-hide-overlay" />
        </figure>
        <div className="card-body p-2 gap-1">
          <h2 className="text-sm font-semibold truncate block w-full">
            {auction.asset.metadata.name}
          </h2>
          <div className="text-xs w-full truncate flex items-center gap-1">
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
            {auction.minimumBidCurrencyValue.displayValue} {auction.minimumBidCurrencyValue.symbol}
          </div>
          {account?.address && (
            <div className="card-actions justify-end" onClick={(e) => e.stopPropagation()}>
              {hasSufficientBalance ? (
                <TransactionButton
                  transaction={getBuyoutTransaction}
                  className="!btn !btn-secondary !btn-xs !text-xs !min-w-fit"
                >
                  Buyout
                </TransactionButton>
              ) : (
                <button
                  className="btn btn-outline btn-xs text-xs px-2 min-h-6 h-6"
                  onClick={() => setShowPay(true)}
                >
                  Pay with crypto
                </button>
              )}
              {showPay && (
                <div 
                  className="fixed inset-0 z-50 grid place-items-center bg-black/50"
                  onClick={() => setShowPay(false)}
                >
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn btn-xs btn-circle absolute right-2 top-2 z-10"
                      onClick={() => setShowPay(false)}
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
          )}
        </div>
      </div>
    </NFTProvider>
  );
};


