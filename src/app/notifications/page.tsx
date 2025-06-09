"use client";

import { useContext } from "react";
import { sdk } from "@farcaster/frame-sdk";
import { FarcasterContext } from "~/app/context/Farcaster";

export default function NotificationsPage() {
  const farcaster = useContext(FarcasterContext);
  const added = farcaster?.context?.client.added;
  const notificationsEnabled = Boolean(
    farcaster?.context?.client.notificationDetails
  );

  const handleAdd = async () => {
    try {
      await sdk.actions.addMiniApp();
    } catch (err) {
      console.error("Failed to add mini app", err);
    }
  };

  return (
    <main className="min-h-screen w-screen pb-20">
      <div className="max-w-sm mx-auto p-4 space-y-4">
        <h1 className="text-xl font-bold">Notifications</h1>
        {!added && (
          <button className="btn btn-primary" onClick={handleAdd}>
            Enable Notifications
          </button>
        )}
        {added && !notificationsEnabled && (
          <p className="text-sm">Notifications are disabled.</p>
        )}
        {added && notificationsEnabled && (
          <p className="text-sm">You&apos;re subscribed to notifications.</p>
        )}
      </div>
    </main>
  );
}

