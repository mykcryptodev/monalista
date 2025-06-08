"use client";

import { useEffect, useState } from "react";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { client } from "~/constants";
import NFTCard from "../components/NFT/Card";
import type { OwnedNFT } from "../components/NftDropdown";

export default function MyNFTsPage() {
  const account = useActiveAccount();
  const [nfts, setNfts] = useState<OwnedNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = query
    ? nfts.filter((nft) => {
        const name = nft.metadata.name || "";
        return (
          name.toLowerCase().includes(query.toLowerCase()) ||
          nft.id.includes(query)
        );
      })
    : nfts;

  useEffect(() => {
    if (!account) return;
    setLoading(true);
    fetch(`/api/nfts?address=${account.address}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.nfts && Array.isArray(data.nfts)) {
          setNfts(data.nfts);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [account]);

  return (
    <main className="bg-base-400 h-screen w-screen">
      <div className="w-[300px] mx-auto p-4 bg-base-300 rounded-lg h-full overflow-y-auto space-y-4">
        <div className="flex justify-stretch flex-col gap-2">
          <ConnectButton client={client} />
        </div>
        {!account && <p className="text-center text-sm">Connect your wallet to view your NFTs.</p>}
        {account && (
          <>
            <h1 className="font-bold">My NFTs</h1>
            <input
              type="text"
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input input-bordered input-sm w-full mb-2"
            />
            {loading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {filtered.map((nft) => (
                  <NFTCard key={`${nft.tokenAddress}-${nft.id}`} nft={nft} />
                ))}
                {filtered.length === 0 && (
                  <p className="col-span-2 text-center text-sm">No NFTs found.</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
