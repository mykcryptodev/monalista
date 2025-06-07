import { FC } from "react";
import { AccountAvatar, AccountName, AccountProvider } from "thirdweb/react";
import { client } from "~/constants";
import AccountNameFallback from "./fallbacks/AccountName";
import AccountAvatarFallback from "./fallbacks/AccountAvatar";

type Props = {
  address: string;
}

export const Account: FC<Props> = ({ address }) => {
  return (
    <AccountProvider address={address} client={client}>
      <div className="flex items-center gap-2">
        <AccountAvatar
          fallbackComponent={<AccountAvatarFallback />}
          loadingComponent={<AccountAvatarFallback />}
          className="w-6 h-6 rounded-lg"
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