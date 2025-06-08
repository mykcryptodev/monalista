import { type FC } from "react";

export const AccountAvatarFallback: FC<{ className?: string }> = ({ className = "w-6 h-6" }) => {
  return (
    <div className={`rounded-lg bg-zinc-700 flex items-center justify-center ${className}`}>
      <span className="text-zinc-400 text-xs">
        👤
      </span>
    </div>
  );
};

export default AccountAvatarFallback;
