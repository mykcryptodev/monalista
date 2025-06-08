"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ConnectButton,
  TransactionButton,
  useActiveAccount,
} from "thirdweb/react";
import { createListing } from "thirdweb/extensions/marketplace";
import { client, marketplaceContract } from "~/constants";
import { toast } from "react-toastify";
import { NftDropdown, type OwnedNFT } from "~/app/components/NftDropdown";

export default function CreateListingPage() {
  const account = useActiveAccount();
  const [selectedNft, setSelectedNft] = useState<OwnedNFT | null>(null);
  const [price, setPrice] = useState("");

  return (
    <main className="bg-base-400 h-screen w-screen">
      <div className="w-[300px] mx-auto p-4 bg-base-300 rounded-lg h-full overflow-y-auto space-y-4">
        <div className="mb-2">
          <Link href="/" className="btn btn-sm btn-ghost">
            ← Back
          </Link>
        </div>
        <NftDropdown onSelect={setSelectedNft} />
        <input
          type="text"
          placeholder="Price (ETH)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="input input-bordered input-sm w-full"
        />
        <div className="flex justify-end pt-2">
          {!account ? (
            <ConnectButton client={client} />
          ) : (
            <TransactionButton
              transaction={() =>
                createListing({
                  contract: marketplaceContract,
                  assetContractAddress: selectedNft!.tokenAddress as `0x${string}`,
                  tokenId: BigInt(selectedNft!.id),
                  quantity: 1n,
                  pricePerToken: price,
                })
              }
              disabled={!selectedNft}
              className="!btn !btn-primary !btn-sm"
              onTransactionSent={() => toast.loading("Creating listing...")}
              onTransactionConfirmed={() => {
                toast.dismiss();
                toast.success("Listing created!");
              }}
              onError={(err) => {
                toast.dismiss();
                toast.error(err.message);
              }}
            >
              Create Listing
            </TransactionButton>
          )}
        </div>
      </div>
    </main>
  );
}
