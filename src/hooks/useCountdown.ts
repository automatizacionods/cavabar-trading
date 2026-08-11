import { useEffect, useState } from "react";

/** Milliseconds left until `endsAt`, ticking every 250ms. Shared clock = server timestamp. */
export function useCountdown(endsAt?: string | null) {
  const target = endsAt ? new Date(endsAt).getTime() : 0;
  const [left, setLeft] = useState(() => Math.max(0, target - Date.now()));

  useEffect(() => {
    if (!target) {
      setLeft(0);
      return;
    }
    setLeft(Math.max(0, target - Date.now()));
    const id = window.setInterval(() => {
      setLeft(Math.max(0, target - Date.now()));
    }, 250);
    return () => window.clearInterval(id);
  }, [target]);

  return left;
}
