"use client";

import { FC, useEffect, useRef, useState } from "react";
import { useActiveAccount } from "thirdweb/react";

export type OwnedToken = {
  tokenAddress: string;
  symbol: string;
  name?: string;
  imgUrlV2?: string;
};

type Props = { onSelect: (token: OwnedToken) => void };

export const TokenDropdown: FC<Props> = ({ onSelect }) => {
  const account = useActiveAccount();
  const [tokens, setTokens] = useState<OwnedToken[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!account) return;
    fetch(`/api/tokens?address=${account.address}`)
      .then((res) => res.json())
      .then((data) => setTokens(data.tokens || []))
      .catch(console.error);
  }, [account]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const filtered = query
    ? tokens.filter((t) =>
        `${t.symbol} ${t.name || ""}`
          .toLowerCase()
          .includes(query.toLowerCase())
      )
    : tokens;

  const handleSelect = (t: OwnedToken) => {
    onSelect(t);
    setQuery(t.symbol);
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        placeholder="Select Token"
        className="input input-bordered input-sm w-full"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
      />
      {open && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto overflow-x-hidden rounded-box bg-base-200 shadow">
          {filtered.map((token) => (
            <li
              key={token.tokenAddress}
              className="flex items-center gap-2 p-2 hover:bg-base-300 cursor-pointer overflow-hidden"
              onMouseDown={() => handleSelect(token)}
            >
              {token.imgUrlV2 && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={token.imgUrlV2} alt={token.symbol} className="w-5 h-5 object-cover" />
              )}
              <div className="text-xs leading-tight overflow-hidden">
                <div className="font-semibold truncate">{token.symbol}</div>
                {token.name && <div className="opacity-70 truncate">{token.name}</div>}
              </div>
            </li>
          ))}
          {filtered.length === 0 && <li className="p-2 text-xs">No tokens found</li>}
        </ul>
      )}
    </div>
  );
};
