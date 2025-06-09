import { FC, useContext } from "react";
import { AccountAvatar, AccountName, AccountProvider } from "thirdweb/react";
import { client, chain } from "~/constants";
import AccountNameFallback from "./fallbacks/AccountName";
import AccountAvatarFallback from "./fallbacks/AccountAvatar";
import { FarcasterContext } from "~/app/context/Farcaster";
import { getFid } from "thirdweb/extensions/farcaster";

type Props = {
  address: string;
  /**
   * Optional class applied to the avatar component. Defaults to `w-6 h-6`.
   */
  avatarClassName?: string;
  /**
   * Optional class applied to the component wrapper.
   */
  className?: string;
};

export const Account: FC<Props> = ({
  address,
  avatarClassName = "w-6 h-6",
  className,
}) => {
  const farcaster = useContext(FarcasterContext);

  const handleClick = async () => {
    if (farcaster?.context) {
      if (farcaster.isMiniApp) {
        try {
          const fidBigInt = await getFid({ address, client, chain });
          const fid = Number(fidBigInt);
          if (fid) {
            await farcaster.viewProfile(fid);
            return;
          }
        } catch (err) {
          console.error("Failed to view profile", err);
        }
      }
    }
    window.open(`https://basescan.org/address/${address}`, "_blank");
  };

  return (
    <AccountProvider address={address} client={client}>
      <div
        className={`flex items-center gap-2 ${className ?? ""}`.trim()}
        onClick={handleClick}
      >
        <AccountAvatar
          fallbackComponent={<AccountAvatarFallback className={avatarClassName} />}
          loadingComponent={<AccountAvatarFallback className={avatarClassName} />}
          className={`${avatarClassName} rounded-lg`}
        />
        <AccountName
          className="text-xs truncate"
          fallbackComponent={<AccountNameFallback address={address} />}
          loadingComponent={<AccountNameFallback address={address} />}
        />
      </div>
    </AccountProvider>
  );
};

