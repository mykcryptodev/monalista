import { FC, useEffect, useState, useCallback } from "react";

interface Props {
  endTimeInSeconds: bigint | number;
}

type TimeLeft = {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export const Countdown: FC<Props> = ({ endTimeInSeconds }) => {
  const end = Number(endTimeInSeconds) * 1000;

  const calculate = useCallback((): TimeLeft => {
    const diff = Math.max(end - Date.now(), 0);
    const seconds = Math.floor(diff / 1000);
    return {
      total: diff,
      days: Math.floor(seconds / 86400),
      hours: Math.floor((seconds % 86400) / 3600),
      minutes: Math.floor((seconds % 3600) / 60),
      seconds: seconds % 60,
    };
  }, [end]);

  const [time, setTime] = useState<TimeLeft>(calculate());

  useEffect(() => {
    const id = setInterval(() => setTime(calculate()), 1000);
    return () => clearInterval(id);
  }, [calculate]);

  if (time.total <= 0) {
    return <span className="text-error text-xs">Expired</span>;
  }

  return (
    <div className="grid grid-flow-col gap-1 text-center auto-cols-max">
      <div className="flex flex-col">
        <span className="countdown font-mono text-xs">
          <span style={{ '--value': time.days } as React.CSSProperties} />
        </span>
        <span className="text-[10px]">d</span>
      </div>
      <div className="flex flex-col">
        <span className="countdown font-mono text-xs">
          <span style={{ '--value': time.hours } as React.CSSProperties} />
        </span>
        <span className="text-[10px]">h</span>
      </div>
      <div className="flex flex-col">
        <span className="countdown font-mono text-xs">
          <span style={{ '--value': time.minutes } as React.CSSProperties} />
        </span>
        <span className="text-[10px]">m</span>
      </div>
      <div className="flex flex-col">
        <span className="countdown font-mono text-xs">
          <span style={{ '--value': time.seconds } as React.CSSProperties} />
        </span>
        <span className="text-[10px]">s</span>
      </div>
    </div>
  );
};

export default Countdown;
