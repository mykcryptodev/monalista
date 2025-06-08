import { type FC } from "react";
import { getContract } from "thirdweb";
import { buyFromListing, type DirectListing } from "thirdweb/extensions/marketplace";
import Countdown from "../Countdown";
import { NFTProvider, NFTMedia, TransactionButton, useActiveAccount, TokenProvider, TokenIcon } from "thirdweb/react";
import { chain, client, marketplaceContract } from "~/constants";
import { useRouter } from "next/navigation";
import TokenIconFallback from "../TokenIconFallback";
import { Account } from "~/app/components/Account";

type Props = {
  listing: DirectListing;
}
export const DirectListingCard: FC<Props> = ({ listing }) => {
  const account = useActiveAccount();
  const router = useRouter();
  const contract = getContract({
    chain,
    client,
    address: listing.asset.tokenAddress as `0x${string}`,
  });

  const handleCardClick = () => {
    router.push(`/direct-listing/${listing.id}`);
  };

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
              <TransactionButton
                transaction={() => buyFromListing({
                  contract: marketplaceContract,
                  listingId: listing.id,
                  quantity: BigInt(1),
                  recipient: account?.address,
                })}
                className="!btn !btn-xs !w-fit !min-w-fit"
              >Buy Now</TransactionButton>
            </div>
          )}
        </div>
      </div>
    </NFTProvider>
  );
};

