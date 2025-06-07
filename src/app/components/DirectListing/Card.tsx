import { type FC } from "react";

export const DirectListingCard: FC = () => {
  return (
    <div className="card bg-base-100 shadow-sm">
      <figure>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp"
          alt="Shoes" />
      </figure>
      <div className="card-body">
        <h2 className="card-title">Card Title</h2>
        <p>0.001 ETH</p>
        <div className="card-actions justify-end">
          <button className="btn btn-primary">Buy Now</button>
        </div>
      </div>
    </div>
  );
};