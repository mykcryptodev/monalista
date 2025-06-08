"use client";

import { FC, useEffect, useRef, useState } from "react";
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
  const [manual, setManual] = useState(false);
  const [manualAddress, setManualAddress] = useState("");
  const [manualId, setManualId] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!account) return;
    setNfts([]);
    setPage(1);
    setHasMore(true);
  }, [account]);

  useEffect(() => {
    if (!account || !hasMore) return;
    setLoading(true);
    fetch(`/api/nfts?address=${account.address}&page=${page}`)
      .then((res) => res.json())
      .then((data) => {
        setNfts((prev) => [...prev, ...data.nfts]);
        if (!data.hasMore) {
          setHasMore(false);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [account, page, hasMore]);

  useEffect(() => {
    if (!open && !manual) return;
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setManual(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, manual]);

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
    setManual(false);
  };

  const handleManualSelect = () => {
    if (manualAddress && manualId) {
      const nft = {
        id: manualId,
        tokenAddress: manualAddress,
        metadata: {},
      } as OwnedNFT;
      onSelect(nft);
      setQuery(`${manualAddress} - ${manualId}`);
      setNfts((prev) => [nft, ...prev]);
      setOpen(false);
      setManual(false);
    }
  };

  const handleScroll = () => {
    const list = listRef.current;
    if (!list || loading || !hasMore) return;
    if (list.scrollTop + list.clientHeight >= list.scrollHeight - 5) {
      setPage((p) => p + 1);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
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
      {open && !manual && (
        <ul
          ref={listRef}
          onScroll={handleScroll}
          className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto overflow-x-hidden rounded-box bg-base-200 shadow"
        >
          {filtered.map((nft) => (
            <li
              key={`${nft.tokenAddress}-${nft.id}`}
              className="flex items-center gap-2 p-2 hover:bg-base-300 cursor-pointer overflow-hidden"
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
              <div className="text-xs leading-tight overflow-hidden">
                <div className="font-semibold truncate">
                  {nft.metadata.name || "Unnamed"}
                </div>
                <div className="opacity-70 truncate">ID: {nft.id}</div>
              </div>
            </li>
          ))}
          {loading && (
            <li className="p-2 text-xs">Loading...</li>
          )}
          {filtered.length === 0 && !loading && (
            <li className="p-2 text-xs">No NFTs found</li>
          )}
          <li
            className="p-2 text-xs cursor-pointer hover:bg-base-300"
            onMouseDown={() => {
              setManual(true);
              setOpen(false);
            }}
          >
            Import manually
          </li>
        </ul>
      )}
      {!manual && (
        <button
          type="button"
          className="btn btn-xs btn-ghost mt-1 w-full"
          onClick={() => {
            setManual(true);
            setOpen(false);
          }}
        >
          Import manually
        </button>
      )}
      {manual && (
        <div className="absolute z-10 mt-1 w-full space-y-2 rounded-box bg-base-200 p-2 shadow">
          <input
            type="text"
            placeholder="NFT Address"
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
            className="input input-bordered input-sm w-full"
          />
          <input
            type="text"
            placeholder="Token ID"
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            className="input input-bordered input-sm w-full"
          />
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-sm btn-ghost flex-1"
              onMouseDown={() => setManual(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-sm btn-primary flex-1"
              onMouseDown={handleManualSelect}
            >
              Select
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
