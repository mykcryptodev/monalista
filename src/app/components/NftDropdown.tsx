"use client";

import { FC, useEffect, useState } from "react";
import { useActiveAccount } from "thirdweb/react";

export type OwnedNFT = {
  id: string;
  metadata: { image?: string | null; name?: string | null };
  tokenAddress: string;
  quantityOwned?: string;
};

type Props = {
  onSelect: (nft: OwnedNFT) => void;
};

export const NftDropdown: FC<Props> = ({ onSelect }) => {
  const account = useActiveAccount();
  const [nfts, setNfts] = useState<OwnedNFT[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!account) return;
    fetch(`/api/nfts?address=${account.address}`)
      .then((res) => res.json())
      .then((data) => setNfts(data))
      .catch(console.error);
  }, [account]);

  const filtered = query
    ? nfts.filter((nft) => {
        const name = nft.metadata.name || "";
        return (
          name.toLowerCase().includes(query.toLowerCase()) ||
          nft.id.includes(query)
        );
      })
    : nfts;

  const handleSelect = (nft: OwnedNFT) => {
    onSelect(nft);
    setQuery(nft.metadata.name ? nft.metadata.name : nft.id);
    setOpen(false);
  };

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Select NFT"
        className="input input-bordered input-sm w-full"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
      />
      {open && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-box bg-base-200 shadow">
          {filtered.map((nft) => (
            <li
              key={`${nft.tokenAddress}-${nft.id}`}
              className="flex items-center gap-2 p-2 hover:bg-base-300 cursor-pointer"
              onMouseDown={() => handleSelect(nft)}
            >
              {nft.metadata.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={nft.metadata.image}
                  alt={nft.metadata.name || "nft"}
                  className="w-8 h-8 object-cover"
                />
              )}
              <div className="text-xs leading-tight">
                <div className="font-semibold truncate">
                  {nft.metadata.name || "Unnamed"}
                </div>
                <div className="opacity-70">ID: {nft.id}</div>
              </div>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="p-2 text-xs">No NFTs found</li>
          )}
        </ul>
      )}
    </div>
  );
};
