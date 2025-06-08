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

  const [total, setTotal] = useState(0);
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  const update = useCallback(() => {
    const t = calculate();
    setTotal(t.total);
    setDays(t.days);
    setHours(t.hours);
    setMinutes(t.minutes);
    setSeconds(t.seconds);
  }, [calculate]);

  useEffect(() => {
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [update]);

  if (total <= 0) {
    return <span className="text-error text-xs">Expired</span>;
  }

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <span className="countdown font-mono text-xs">
      {days > 0 ? (
        <>
          <span
            style={{ "--value": days } as React.CSSProperties}
            aria-live="polite"
            aria-label={`${days} days`}
          >
            {pad(days)}
          </span>
          d
        </>
      ) : null}
      <span
        style={{ "--value": hours } as React.CSSProperties}
        aria-live="polite"
        aria-label={`${hours} hours`}
      >
        {pad(hours)}
      </span>
      h&nbsp;
      <span
        style={{ "--value": minutes } as React.CSSProperties}
        aria-live="polite"
        aria-label={`${minutes} minutes`}
      >
        {pad(minutes)}
      </span>
      m&nbsp;
      <span
        style={{ "--value": seconds } as React.CSSProperties}
        aria-live="polite"
        aria-label={`${seconds} seconds`}
      >
        {pad(seconds)}
      </span>
      s
    </span>
  );
};

export default Countdown;
