"use client";

import {
  ConnectButton,
} from "thirdweb/react";
import { appDescription, appName, client } from "~/constants";
import { DirectListingList } from "./components/DirectListing/List";
import { AuctionList } from "./components/Auction/List";

export default function App() {
	return (
		<main className="min-h-screen w-screen pb-20"> 
		  <div className="max-w-sm mx-auto p-4 min-h-full">
				<div className="flex justify-stretch flex-col mb-2 gap-2">
				  <ConnectButton client={client} />
				</div>
				<div className="flex justify-stretch flex-col pb-4">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src="/logo.png" alt="logo" className="w-24 h-24 mx-auto" />
					<h1 className="text-2xl text-center font-bold">{appName}</h1>
					<p className="text-center text-base-content/50">{appDescription}</p>
				</div>
				<DirectListingList />
				<AuctionList />
			</div>
		</main>
	);
}
