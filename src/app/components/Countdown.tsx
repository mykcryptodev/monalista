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

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <span className="countdown font-mono text-xs">
      <span
        style={{ "--value": time.days } as React.CSSProperties}
        aria-live="polite"
        aria-label={`${time.days} days`}
      >
        {pad(time.days)}
      </span>
      d&nbsp;
      <span
        style={{ "--value": time.hours } as React.CSSProperties}
        aria-live="polite"
        aria-label={`${time.hours} hours`}
      >
        {pad(time.hours)}
      </span>
      h&nbsp;
      <span
        style={{ "--value": time.minutes } as React.CSSProperties}
        aria-live="polite"
        aria-label={`${time.minutes} minutes`}
      >
        {pad(time.minutes)}
      </span>
      m&nbsp;
      <span
        style={{ "--value": time.seconds } as React.CSSProperties}
        aria-live="polite"
        aria-label={`${time.seconds} seconds`}
      >
        {pad(time.seconds)}
      </span>
      s
    </span>
  );
};

export default Countdown;
