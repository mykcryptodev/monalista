"use client";

import {
	ConnectButton,
} from "thirdweb/react";
import { appDescription, appName, client } from "~/constants";
import { DirectListingList } from "./components/DirectListing/List";

export default function App() {
	return (
		<main className="bg-base-400 h-screen w-screen">
			<div className="w-[300px] mx-auto p-4">
				<div className="flex justify-stretch flex-col mb-2 gap-2">
					<ConnectButton client={client} />
				</div>
				<div className="flex justify-stretch flex-col gap-2">
					<h1 className="text-4xl text-center font-bold">{appName}</h1>
					<p className="text-xl text-center text-base-content/50">{appDescription}</p>
				</div>
				<DirectListingList />
			</div>
		</main>
	);
}
