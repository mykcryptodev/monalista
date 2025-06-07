import { useEffect, type FC } from "react";
import { DirectListingCard } from "./Card";
import { marketplaceContract } from "~/constants";
import { type DirectListing, getAllValidListings } from "thirdweb/extensions/marketplace";
import { useState } from "react";

export const DirectListingList: FC = () => {
  const [listings, setListings] = useState<DirectListing[]>([]);

  useEffect(() => {
    const fetchListings = async () => {
      const listings = await getAllValidListings({
        contract: marketplaceContract,
      });
      setListings(listings);
    };
    fetchListings();
  }, []);
  
  return (
    <div>
      <h1 className="font-bold">For Sale</h1>
      <div className="grid grid-cols-2 gap-4">
        {listings.map((listing) => (
          <DirectListingCard
            key={listing.id}
            listing={listing}
          />
        ))}
      </div>
    </div>
  );
};