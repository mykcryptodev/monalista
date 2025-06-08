"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ConnectButton,
  TransactionButton,
  useActiveAccount,
} from "thirdweb/react";
import { createListing } from "thirdweb/extensions/marketplace";
import {
  chain,
  client,
  marketplaceContract,
} from "~/constants";
import { getContract } from "thirdweb";
import { isApprovedForAll as isApprovedForAll721 } from "thirdweb/extensions/erc721";
import { isApprovedForAll as isApprovedForAll1155 } from "thirdweb/extensions/erc1155";
import { setApprovalForAll as approve721 } from "thirdweb/extensions/erc721";
import { setApprovalForAll as approve1155 } from "thirdweb/extensions/erc1155";
import { toast } from "react-toastify";

export default function CreateListingPage() {
  const account = useActiveAccount();
  const [tokenAddress, setTokenAddress] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [price, setPrice] = useState("");
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    const checkApproval = async () => {
      if (!account || !tokenAddress) return;
      try {
        const contract = getContract({
          address: tokenAddress as `0x${string}`,
          chain,
          client,
        });
        let isApproved = await isApprovedForAll721({
          contract,
          owner: account.address,
          operator: marketplaceContract.address,
        });
        if (!isApproved) {
          isApproved = await isApprovedForAll1155({
            contract,
            owner: account.address,
            operator: marketplaceContract.address,
          });
        }
        setApproved(isApproved);
      } catch (err) {
        console.error(err);
      }
    };
    checkApproval();
  }, [account, tokenAddress]);

  return (
    <main className="bg-base-400 h-screen w-screen">
      <div className="w-[300px] mx-auto p-4 bg-base-300 rounded-lg h-full overflow-y-auto space-y-4">
        <div className="mb-2">
          <Link href="/" className="btn btn-sm btn-ghost">
            ← Back
          </Link>
        </div>
        <input
          type="text"
          placeholder="NFT Token Address"
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value)}
          className="input input-bordered input-sm w-full"
        />
        <input
          type="text"
          placeholder="Token ID"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          className="input input-bordered input-sm w-full"
        />
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
          ) : !approved ? (
            <TransactionButton
              transaction={() => {
                const contract = getContract({
                  address: tokenAddress as `0x${string}`,
                  chain,
                  client,
                });
                return approve721({
                  contract,
                  operator: marketplaceContract.address,
                  approved: true,
                });
              }}
              className="!btn !btn-primary !btn-sm"
              onTransactionSent={() => toast.loading("Approving token...")}
              onTransactionConfirmed={() => {
                toast.dismiss();
                toast.success("Token approved");
                setApproved(true);
              }}
              onError={async () => {
                try {
                  const contract = getContract({
                    address: tokenAddress as `0x${string}`,
                    chain,
                    client,
                  });
                  await approve1155({
                    contract,
                    operator: marketplaceContract.address,
                    approved: true,
                  });
                  setApproved(true);
                  toast.dismiss();
                  toast.success("Token approved");
                } catch (err) {
                  toast.dismiss();
                  toast.error((err as Error).message);
                }
              }}
            >
              Approve
            </TransactionButton>
          ) : (
            <TransactionButton
              transaction={() =>
                createListing({
                  contract: marketplaceContract,
                  assetContractAddress: tokenAddress as `0x${string}`,
                  tokenId: BigInt(tokenId),
                  quantity: 1n,
                  pricePerToken: price,
                })
              }
              className="!btn !btn-primary !btn-sm"
              onTransactionSent={() => toast.loading("Creating listing...")}
              onTransactionConfirmed={() => {
                toast.dismiss();
                toast.success("Listing created!");
                fetch("/api/cache/invalidate", {
                  method: "POST",
                  body: JSON.stringify({ keys: ["listings"] }),
                });
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
