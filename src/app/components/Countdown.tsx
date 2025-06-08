import { FC, useEffect, useState, useCallback } from "react";

interface Props {
  endTimeInSeconds: bigint | number;
}

type TimeLeft = {
  total: number;
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export const Countdown: FC<Props> = ({ endTimeInSeconds }) => {
  const end = Number(endTimeInSeconds) * 1000;

  const calculate = useCallback((): TimeLeft => {
    const diff = Math.max(end - Date.now(), 0);
    const totalSeconds = Math.floor(diff / 1000);
    
    // More accurate calculations
    const secondsPerMinute = 60;
    const secondsPerHour = 60 * secondsPerMinute;
    const secondsPerDay = 24 * secondsPerHour;
    const secondsPerMonth = 30 * secondsPerDay; // Approximate 30 days per month
    const secondsPerYear = 365 * secondsPerDay; // Approximate 365 days per year
    
    const years = Math.floor(totalSeconds / secondsPerYear);
    let remaining = totalSeconds - (years * secondsPerYear);
    
    const months = Math.floor(remaining / secondsPerMonth);
    remaining = remaining - (months * secondsPerMonth);
    
    const days = Math.floor(remaining / secondsPerDay);
    remaining = remaining - (days * secondsPerDay);
    
    const hours = Math.floor(remaining / secondsPerHour);
    remaining = remaining - (hours * secondsPerHour);
    
    const minutes = Math.floor(remaining / secondsPerMinute);
    const seconds = remaining - (minutes * secondsPerMinute);
    
    return {
      total: diff,
      years,
      months,
      days,
      hours,
      minutes,
      seconds,
    };
  }, [end]);

  const [total, setTotal] = useState(0);
  const [years, setYears] = useState(0);
  const [months, setMonths] = useState(0);
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  const update = useCallback(() => {
    const t = calculate();
    setTotal(t.total);
    setYears(t.years);
    setMonths(t.months);
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

  // Determine which 3 units to show
  const timeUnits = [
    { value: years, label: 'y', name: 'years' },
    { value: months, label: 'm', name: 'months' },
    { value: days, label: 'd', name: 'days' },
    { value: hours, label: 'h', name: 'hours' },
    { value: minutes, label: 'm', name: 'minutes' },
    { value: seconds, label: 's', name: 'seconds' }
  ];

  // Get all non-zero units
  const nonZeroUnits = timeUnits.filter(unit => unit.value > 0);
  
  // Determine which units to show
  let unitsToShow;
  if (nonZeroUnits.length === 0 || total <= 0) {
    // If countdown is at 0 or expired, show "00h 00m 00s"
    unitsToShow = timeUnits.slice(3, 6);
  } else if (nonZeroUnits.length >= 3) {
    // If we have 3 or more non-zero units, take the first 3
    unitsToShow = nonZeroUnits.slice(0, 3);
  } else {
    // If we have fewer than 3 non-zero units, show all of them
    unitsToShow = nonZeroUnits;
  }

  return (
    <span className="font-mono text-xs">
      {unitsToShow.map((unit, index) => (
        <span key={unit.name}>
          {pad(unit.value)}{unit.label}
          {index < unitsToShow.length - 1 && ' '}
        </span>
      ))}
    </span>
  );
};

export default Countdown;
