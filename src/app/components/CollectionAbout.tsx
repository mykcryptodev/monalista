"use client";
import { useEffect, useState } from "react";

type Props = {
  address: string;
};

type CollectionData = {
  name?: string;
  description?: string;
  imageUrl?: string;
  stats?: { floorPriceNative?: number };
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
      {data.description && <p className="mb-2">{data.description}</p>}
      {data.stats?.floorPriceNative !== undefined && (
        <p className="opacity-70">Floor Price: {data.stats.floorPriceNative}</p>
      )}
    </section>
  );
};
