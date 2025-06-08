import { FC } from "react";

export const TokenIconFallback: FC = () => {
  return (
    <span className="inline-flex w-4 h-4 rounded-full bg-zinc-700 items-center justify-center">
      <span className="text-[10px]">🪙</span>
    </span>
  );
};

export default TokenIconFallback;
