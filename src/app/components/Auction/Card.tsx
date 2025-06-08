import { type FC, useEffect, useState } from "react";
import { getContract } from "thirdweb";
import { buyoutAuction, type EnglishAuction } from "thirdweb/extensions/marketplace";
import { NFTProvider, NFTMedia, TransactionButton, useActiveAccount } from "thirdweb/react";
import { chain, client, marketplaceContract } from "~/constants";
import { useRouter } from "next/navigation";

type Props = {
  auction: EnglishAuction;
};

export const AuctionCard: FC<Props> = ({ auction }) => {
  const account = useActiveAccount();
  const router = useRouter();
  const contract = getContract({
    chain,
    client,
    address: auction.asset.tokenAddress as `0x${string}`,
  });

  const [timeLeft, setTimeLeft] = useState("00d");

  useEffect(() => {
    const update = () => {
      const end = Number(auction.endTimeInSeconds) * 1000;
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
  }, [auction.endTimeInSeconds]);

  const handleCardClick = () => {
    router.push(`/auction/${auction.id}`);
  };

  return (
    <NFTProvider contract={contract} tokenId={BigInt(auction.asset.id)}>
      <div
        className="card bg-neutral/50 rounded-lg px-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleCardClick}
      >
        <figure>
          <NFTMedia />
        </figure>
        <div className="card-body p-2 gap-0">
          <h2 className="text-sm font-semibold truncate block w-full">
            {auction.asset.metadata.name}
          </h2>
          <p className="text-xs w-full truncate">
            {auction.minimumBidCurrencyValue.displayValue}{" "}
            {auction.minimumBidCurrencyValue.symbol}
          </p>
          <p className="text-xs opacity-70">{timeLeft}</p>
          {account?.address && (
            <div className="card-actions justify-end" onClick={(e) => e.stopPropagation()}>
              <TransactionButton
                transaction={() =>
                  buyoutAuction({
                    contract: marketplaceContract,
                    auctionId: auction.id,
                  })
                }
                className="!btn !btn-xs !w-fit !min-w-fit"
              >
                Buyout
              </TransactionButton>
            </div>
          )}
        </div>
      </div>
    </NFTProvider>
  );
};
