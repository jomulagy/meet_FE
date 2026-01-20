import type { TouchEvent, WheelEvent } from "react";

const MINUTES_IN_DAY = 24 * 60;

const normalizeWheelDelta = (event: WheelEvent<HTMLInputElement>) => {
  if (event.deltaMode === 1) {
    return event.deltaY * 16;
  }

  if (event.deltaMode === 2) {
    return event.deltaY * 120;
  }

  return event.deltaY;
};

const getStepMinutes = (delta: number) => {
  const absDelta = Math.abs(delta);

  if (absDelta >= 120) {
    return 15;
  }

  if (absDelta >= 60) {
    return 10;
  }

  if (absDelta >= 20) {
    return 5;
  }

  return 1;
};

const parseTimeValue = (value: string) => {
  const [hoursValue, minutesValue] = value.split(":");
  const hours = Number(hoursValue);
  const minutes = Number(minutesValue);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
};

const formatTimeValue = (totalMinutes: number) => {
  const clamped = Math.min(Math.max(totalMinutes, 0), MINUTES_IN_DAY - 1);
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

export const createTimeWheelHandler =
  (onChange: (value: string) => void) =>
  (event: WheelEvent<HTMLInputElement>) => {
    if (document.activeElement !== event.currentTarget) {
      return;
    }

    event.preventDefault();

    const normalizedDelta = normalizeWheelDelta(event);

    if (normalizedDelta === 0) {
      return;
    }

    const currentValue = event.currentTarget.value || "00:00";
    const currentMinutes = parseTimeValue(currentValue);
    const baseMinutes = currentMinutes ?? 0;
    const direction = normalizedDelta > 0 ? 1 : -1;
    const stepMinutes = getStepMinutes(normalizedDelta);
    const nextMinutes = baseMinutes + direction * stepMinutes;

    onChange(formatTimeValue(nextMinutes));
  };

export const createTimeTouchHandlers = (onChange: (value: string) => void) => {
  let startY: number | null = null;
  let accumulatedDelta = 0;

  const getBaseMinutes = (value: string) => {
    const parsed = parseTimeValue(value);
    return parsed ?? 0;
  };

  const applyDeltaMinutes = (
    event: TouchEvent<HTMLInputElement>,
    deltaMinutes: number,
  ) => {
    if (deltaMinutes === 0) {
      return;
    }

    const currentValue = event.currentTarget.value || "00:00";
    const baseMinutes = getBaseMinutes(currentValue);
    onChange(formatTimeValue(baseMinutes + deltaMinutes));
  };

  return {
    onTouchStart: (event: TouchEvent<HTMLInputElement>) => {
      startY = event.touches[0]?.clientY ?? null;
      accumulatedDelta = 0;
    },
    onTouchMove: (event: TouchEvent<HTMLInputElement>) => {
      if (startY === null) {
        return;
      }

      event.preventDefault();

      const currentY = event.touches[0]?.clientY ?? startY;
      const deltaY = startY - currentY;
      startY = currentY;
      accumulatedDelta += deltaY;

      const stepPixels = 30;
      const stepMinutes = 5;
      const steps = Math.trunc(accumulatedDelta / stepPixels);

      if (steps !== 0) {
        accumulatedDelta -= steps * stepPixels;
        applyDeltaMinutes(event, steps * stepMinutes);
      }
    },
    onTouchEnd: () => {
      startY = null;
      accumulatedDelta = 0;
    },
  };
};
