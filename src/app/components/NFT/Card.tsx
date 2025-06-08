"use client";

import { FC } from "react";
import { OwnedNFT } from "../NftDropdown";

interface Props {
  nft: OwnedNFT;
}

export const NFTCard: FC<Props> = ({ nft }) => {
  return (
    <div className="card bg-base-200 shadow-sm">
      {nft.metadata.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={nft.metadata.image}
          alt={nft.metadata.name || "NFT"}
          className="w-full h-32 object-cover rounded-t-box"
        />
      )}
      <div className="card-body p-2 gap-1">
        <h2 className="text-sm font-semibold truncate">
          {nft.metadata.name || "Unnamed"}
        </h2>
        <p className="text-xs opacity-70 truncate">ID: {nft.id}</p>
        {nft.quantityOwned && (
          <p className="text-xs opacity-70">Qty: {nft.quantityOwned}</p>
        )}
      </div>
    </div>
  );
};

export default NFTCard;
