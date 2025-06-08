import { type FC, useEffect, useState } from "react";
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

  const [timeLeft, setTimeLeft] = useState("00d");

  useEffect(() => {
    const update = () => {
      const end = Number(listing.endTimeInSeconds) * 1000;
      const diff = end - Date.now();
      if (diff <= 0) {
        setTimeLeft("00d");
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(
        `${String(d).padStart(2, "0")}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`
      );
    };
    update();
    const t = setInterval(update, 60000);
    return () => clearInterval(t);
  }, [listing.endTimeInSeconds]);

  const handleCardClick = () => {
    router.push(`/direct-listing/${listing.id}`);
  };

  return (
    <NFTProvider contract={contract} tokenId={BigInt(listing.asset.id)}>
      <div
        className="card bg-neutral/50 rounded-lg px-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleCardClick}
      >
        <figure>
          <NFTMedia />
        </figure>
        <div className="card-body p-2 gap-0">
          <h2 className="text-sm font-semibold truncate block w-full">{listing.asset.metadata.name}</h2>
          <p className="text-xs w-full truncate">{listing.currencyValuePerToken.displayValue} {listing.currencyValuePerToken.symbol}</p>
          <p className="text-xs opacity-70">{timeLeft}</p>
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