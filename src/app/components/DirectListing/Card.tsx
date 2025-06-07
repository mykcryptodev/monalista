import { type FC } from "react";
import { getContract } from "thirdweb";
import { buyFromListing, type DirectListing } from "thirdweb/extensions/marketplace";
import { NFTProvider, NFTMedia, TransactionButton, useActiveAccount } from "thirdweb/react";
import { chain, client, marketplaceContract } from "~/constants";
import { useRouter } from "next/navigation";

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
    <NFTProvider
      contract={contract}
      tokenId={BigInt(listing.asset.id)}
    >
      <div 
        className="card bg-base-100 px-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleCardClick}
      >
        <figure>
          <NFTMedia />
        </figure>
        <div className="card-body p-2 gap-0">
          <h2 className="text-sm font-semibold truncate block w-full">{listing.asset.metadata.name}</h2>
          <p className="text-xs w-full truncate">{listing.currencyValuePerToken.displayValue} {listing.currencyValuePerToken.symbol}</p>
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