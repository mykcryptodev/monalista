import { useEffect, type FC, useState } from "react";
import Link from "next/link";
import { AuctionCard } from "./Card";
import { marketplaceContract } from "~/constants";
import { type EnglishAuction, getAllValidAuctions } from "thirdweb/extensions/marketplace";

export const AuctionList: FC = () => {
  const [auctions, setAuctions] = useState<EnglishAuction[]>([]);

  useEffect(() => {
    const fetchAuctions = async () => {
      const data = await getAllValidAuctions({
        contract: marketplaceContract,
      });
      setAuctions(data);
    };
    fetchAuctions();
  }, []);

  return (
    <div className="mt-6">
      <div className="flex items-center mb-2">
        <h1 className="font-bold flex-1">Auctions</h1>
        <Link href="/auction/create" className="btn btn-secondary btn-sm">
          Create Auction
        </Link>
      </div>
      <div className="flex overflow-x-auto gap-4 p-2 bg-base-300 rounded-lg">
        {auctions.map((auction) => (
          <div key={auction.id} className="shrink-0 w-40">
            <AuctionCard auction={auction} />
          </div>
        ))}
      </div>
    </div>
  );
};
