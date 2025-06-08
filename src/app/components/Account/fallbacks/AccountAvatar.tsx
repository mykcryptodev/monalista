import { type FC } from "react";

export const AccountAvatarFallback: FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`w-6 h-6 rounded-lg bg-zinc-700 flex items-center justify-center ${className ?? ""}`}> 
      <span className="text-zinc-400 text-xs">
        👤
      </span>
    </div>
  );
}

export default AccountAvatarFallback;