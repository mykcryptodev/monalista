import { type FC } from "react";
import { getContract } from "thirdweb";
import {
  buyoutAuction,
  type EnglishAuction,
} from "thirdweb/extensions/marketplace";
import {
  NFTProvider,
  NFTMedia,
  TransactionButton,
  useActiveAccount,
} from "thirdweb/react";
import { chain, client, marketplaceContract } from "~/constants";
import { useRouter } from "next/navigation";
import { Account } from "~/app/components/Account";

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

  const handleCardClick = () => {
    router.push(`/auction/${auction.id}`);
  };

  return (
    <NFTProvider contract={contract} tokenId={BigInt(auction.asset.id)}>
      <div
        className="card bg-base-200 px-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="p-2 flex items-center gap-1 justify-start text-xs">
          <Account address={auction.creatorAddress} avatarClassName="w-4 h-4" />
        </div>
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
