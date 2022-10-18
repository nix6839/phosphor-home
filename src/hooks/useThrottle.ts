import { useEffect, useRef, useState } from "react";
import useUnmount from "./useUnmount";

export default function useThrottle<T>(value: T, ms: number = 200) {
  const [state, setState] = useState<T>(value);
  const timeout = useRef<ReturnType<typeof setTimeout>>();
  const nextValue = useRef(null) as any;
  const hasNextValue = useRef(0) as any;

  useEffect(() => {
    if (!timeout.current) {
      setState(value);
      const timeoutCallback = () => {
        if (hasNextValue.current) {
          hasNextValue.current = false;
          setState(nextValue.current);
          timeout.current = setTimeout(timeoutCallback, ms);
        } else {
          timeout.current = undefined;
        }
      };
      timeout.current = setTimeout(timeoutCallback, ms);
    } else {
      nextValue.current = value;
      hasNextValue.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useUnmount(() => {
    timeout.current && clearTimeout(timeout.current);
  });

  return state;
}
