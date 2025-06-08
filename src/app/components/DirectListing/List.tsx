import { useEffect, type FC } from "react";
import { DirectListingCard } from "./Card";
import Link from "next/link";
import { type DirectListing } from "thirdweb/extensions/marketplace";
import { useState } from "react";

export const DirectListingList: FC = () => {
  const [listings, setListings] = useState<DirectListing[]>([]);

  useEffect(() => {
    const fetchListings = async () => {
      const res = await fetch("/api/listings");
      const listings: DirectListing[] = await res.json();
      setListings(listings);
    };
    fetchListings();
  }, []);
  
  return (
    <div>
      <div className="flex items-center mb-2">
        <h1 className="font-bold flex-1">For Sale</h1>
        <Link href="/create-listing" className="btn btn-secondary btn-sm">
          Create Listing
        </Link>
      </div>
      <div className="flex overflow-x-auto gap-4 p-2 bg-base-300 rounded-lg">
        {listings.map((listing) => (
          <div key={listing.id} className="shrink-0 w-40">
            <DirectListingCard listing={listing} />
          </div>
        ))}
      </div>
    </div>
  );
};
