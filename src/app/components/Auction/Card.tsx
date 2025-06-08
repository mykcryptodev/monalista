import { type FC, useState } from "react";
import { getContract } from "thirdweb";
import { buyoutAuction, type EnglishAuction } from "thirdweb/extensions/marketplace";
import Countdown from "../Countdown";
import { NFTProvider, NFTMedia, PayEmbed, useActiveAccount, TokenProvider, TokenIcon } from "thirdweb/react";
import { chain, client, marketplaceContract } from "~/constants";
import { useRouter } from "next/navigation";
import TokenIconFallback from "../TokenIconFallback";
import { Account } from "~/app/components/Account";

type Props = {
  auction: EnglishAuction;
};

export const AuctionCard: FC<Props> = ({ auction }) => {
  const account = useActiveAccount();
  const router = useRouter();
  const [showPay, setShowPay] = useState(false);
  const contract = getContract({
    chain,
    client,
    address: auction.asset.tokenAddress as `0x${string}`,
  });

  const handleCardClick = () => {
    router.push(`/auction/${auction.id}`);
  };

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
              <button
                className="btn btn-secondary btn-xs"
                onClick={() => setShowPay(true)}
              >
                Buyout
              </button>
              {showPay && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
                  <div className="relative">
                    <button
                      className="btn btn-xs btn-circle absolute right-2 top-2"
                      onClick={() => setShowPay(false)}
                    >
                      ✕
                    </button>
                    <PayEmbed
                      client={client}
                      payOptions={{
                        mode: "transaction",
                        transaction: buyoutAuction({
                          contract: marketplaceContract,
                          auctionId: auction.id,
                        }),
                        metadata: auction.asset.metadata,
                        onPurchaseSuccess: () => {
                          setShowPay(false);
                        },
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

