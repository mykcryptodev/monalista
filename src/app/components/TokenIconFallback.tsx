import { FC } from "react";

export const TokenIconFallback: FC = () => {
  return (
    <div className="w-4 h-4 rounded-full bg-zinc-700 flex items-center justify-center">
      <span className="text-[10px]">🪙</span>
    </div>
  );
};

export default TokenIconFallback;
