import { type FC } from "react";
import { DirectListingCard } from "./Card";

export const DirectListingList: FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold">For Sale</h1>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 10 }).map((_, index) => (
          <DirectListingCard key={index} />
        ))}
      </div>
    </div>
  );
};