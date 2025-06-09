import { type FC, useState, useEffect } from "react";
import { getContract, NATIVE_TOKEN_ADDRESS, ZERO_ADDRESS } from "thirdweb";
import { buyFromListing, type DirectListing } from "thirdweb/extensions/marketplace";
import Countdown from "../Countdown";
import { NFTProvider, NFTMedia, PayEmbed, TransactionButton, useActiveAccount, TokenProvider, TokenIcon } from "thirdweb/react";
import { chain, client, marketplaceContract } from "~/constants";
import { useRouter } from "next/navigation";
import TokenIconFallback from "../TokenIconFallback";
import { Account } from "~/app/components/Account";
import { getWalletBalance } from "thirdweb/wallets";

type Props = {
  listing: DirectListing;
}
export const DirectListingCard: FC<Props> = ({ listing }) => {
  const account = useActiveAccount();
  const router = useRouter();
  const [showPay, setShowPay] = useState(false);
  const [userBalance, setUserBalance] = useState<bigint>(0n);
  const contract = getContract({
    chain,
    client,
    address: listing.asset.tokenAddress as `0x${string}`,
  });
  const isNativeToken = (address: string) =>
    address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase();

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

  const handleCardClick = () => {
    router.push(`/direct-listing/${listing.id}`);
  };

  // Common success handler
  const handlePurchaseSuccess = () => {
    setShowPay(false);
  };

  // Transaction generator
  const getBuyTransaction = () => buyFromListing({
    contract: marketplaceContract,
    listingId: listing.id,
    quantity: BigInt(1),
    recipient: account?.address || ZERO_ADDRESS,
  });

  const hasSufficientBalance = userBalance >= BigInt(listing?.currencyValuePerToken?.value || 0);

  return (
    <NFTProvider contract={contract} tokenId={BigInt(listing.asset.id)}>
      <div
        className="card bg-base-200 px-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="p-2 flex items-center text-xs w-full justify-between">
          <Account
            address={listing.creatorAddress}
            avatarClassName="w-4 h-4"
            className="w-1/2 overflow-hidden"
          />
          <Countdown endTimeInSeconds={listing.endTimeInSeconds} unitsToDisplay={2} />
        </div>
        <figure>
          <NFTMedia className="nftmedia-hide-overlay" />
        </figure>
        <div className="card-body p-2 gap-1">
          <h2 className="text-sm font-semibold truncate block w-full">{listing.asset.metadata.name}</h2>
          <div className="text-xs w-full truncate flex items-center gap-1">
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
          </div>
          {account?.address && (
            <div className="card-actions justify-end" onClick={(e) => e.stopPropagation()}>
              {hasSufficientBalance ? (
                <TransactionButton
                  transaction={getBuyTransaction}
                  className="!btn !btn-primary !btn-xs !text-xs !min-w-fit"
                  disabled={!account?.address}
                >
                  Buy
                </TransactionButton>
              ) : (
                <button
                  className="btn btn-outline btn-xs text-xs"
                  onClick={() => setShowPay(true)}
                >
                  Get {listing.currencyValuePerToken.symbol}
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
          )}
        </div>
      </div>
    </NFTProvider>
  );
};



