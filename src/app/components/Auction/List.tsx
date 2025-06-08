import { useEffect, type FC, useState } from "react";
import { AuctionCard } from "./Card";
import { type EnglishAuction } from "thirdweb/extensions/marketplace";

export const AuctionList: FC = () => {
  const [auctions, setAuctions] = useState<EnglishAuction[]>([]);

  useEffect(() => {
    const fetchAuctions = async () => {
      const res = await fetch("/api/auctions");
      const data: EnglishAuction[] = await res.json();
      setAuctions(data);
    };
    fetchAuctions();
  }, []);

  return (
    <div className="mt-6">
      <h1 className="font-bold mb-2">Auctions</h1>
      <div className="grid grid-cols-2 gap-4 p-2 bg-base-300 rounded-lg">
        {auctions.map((auction) => (
          <AuctionCard key={auction.id} auction={auction} />
        ))}
      </div>
    </div>
  );
};
