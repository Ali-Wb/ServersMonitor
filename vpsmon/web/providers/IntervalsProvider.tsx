"use client";

import {
  createContext,
  type PropsWithChildren,
  useContext,
  useState,
} from "react";

type IntervalsContextValue = {
  intervalMs: number;
  setIntervalMs: (value: number) => void;
};

const IntervalsContext = createContext<IntervalsContextValue | undefined>(
  undefined,
);

export function IntervalsProvider({ children }: PropsWithChildren) {
  const [intervalMs, setIntervalMs] = useState(30_000);

  return (
    <IntervalsContext.Provider value={{ intervalMs, setIntervalMs }}>
      {children}
    </IntervalsContext.Provider>
  );
}

export function useIntervals() {
  const context = useContext(IntervalsContext);

  if (!context) {
    throw new Error("useIntervals must be used within IntervalsProvider");
  }

  return context;
}
