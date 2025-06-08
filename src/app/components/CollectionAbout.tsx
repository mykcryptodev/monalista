"use client";
import { useEffect, useState } from "react";

type Props = {
  address: string;
};

type CollectionData = {
  name?: string;
  description?: string;
  medias?: {
    card?: { large?: string | null } | null;
    logo?: { thumbnail?: string | null } | null;
  } | null;
  floorPrice?: {
    valueWithDenomination?: number;
    denomination?: { symbol?: string };
  } | null;
};

export const CollectionAbout = ({ address }: Props) => {
  const [data, setData] = useState<CollectionData | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/collections?address=${address}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error(err);
      }
    }
    if (address) fetchData();
  }, [address]);

  if (!data) return null;

  return (
    <section className="mt-4 text-sm">
      <h3 className="font-bold text-lg mb-2">About {data.name}</h3>
      {data.medias?.logo?.thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={data.medias.logo.thumbnail}
          alt="collection logo"
          className="mb-2 w-16 h-16 rounded"
        />
      )}
      {data.description && <p className="mb-2">{data.description}</p>}
      {data.floorPrice?.valueWithDenomination !== undefined && (
        <p className="opacity-70">
          Floor Price: {data.floorPrice.valueWithDenomination}
          {" "}
          {data.floorPrice.denomination?.symbol}
        </p>
      )}
    </section>
  );
};
