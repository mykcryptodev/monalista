import { FC } from "react";
import { AccountAvatar, AccountName, AccountProvider } from "thirdweb/react";
import { client } from "~/constants";
import AccountNameFallback from "./fallbacks/AccountName";
import AccountAvatarFallback from "./fallbacks/AccountAvatar";

type Props = {
  address: string;
  /**
   * Optional class applied to the avatar component. Defaults to `w-6 h-6`.
   */
  avatarClassName?: string;
}

export const Account: FC<Props> = ({ address, avatarClassName }) => {
  return (
    <AccountProvider address={address} client={client}>
      <div className="flex items-center gap-2">
        <AccountAvatar
          fallbackComponent={<AccountAvatarFallback className={avatarClassName} />}
          loadingComponent={<AccountAvatarFallback className={avatarClassName} />}
          className={`w-6 h-6 rounded-lg ${avatarClassName ?? ""}`}
        />
        <AccountName
          className="text-xs truncate"
          fallbackComponent={<AccountNameFallback address={address} />}
          loadingComponent={<AccountNameFallback address={address} />}
        />
      </div>
    </AccountProvider>
  )
};