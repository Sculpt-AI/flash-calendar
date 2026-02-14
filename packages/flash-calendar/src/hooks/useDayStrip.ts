import { useMemo } from "react";

import {
  addDays,
  fromDateId,
  isWeekend,
  startOfWeek,
  subDays,
  toDateId,
} from "@/helpers/dates";
import type { CalendarActiveDateRange, CalendarDayMetadata } from "@/hooks/useCalendar";
import { getStateFields } from "@/hooks/useCalendar";

export interface UseDayStripParams {
  /** Number of days before the reference date. @default 100 */
  pastDayCount?: number;
  /** Number of days after the reference date. @default 10 */
  futureDayCount?: number;
  /** The reference date ID (YYYY-MM-DD). Defaults to today. */
  referenceDateId?: string;
  /** First day of the week for weekDaysList. @default "sunday" */
  calendarFirstDayOfWeek?: "sunday" | "monday";
  /** Active date ranges to highlight. */
  calendarActiveDateRanges?: CalendarActiveDateRange[];
  /** Date IDs to disable. */
  calendarDisabledDateIds?: string[];
  /** Minimum selectable date ID. */
  calendarMinDateId?: string;
  /** Maximum selectable date ID. */
  calendarMaxDateId?: string;
  /** Locale for formatting. @default "en-US" */
  calendarFormatLocale?: string;
  /** Custom day format function. */
  getCalendarDayFormat?: (date: Date, locale: string) => string;
  /** Custom week day name format function. */
  getCalendarWeekDayFormat?: (date: Date, locale: string) => string;
}

export interface UseDayStripReturn {
  /** Flat array of day metadata for the entire strip. */
  dayList: CalendarDayMetadata[];
  /** Index of the reference date in dayList for initialScrollIndex. */
  referenceIndex: number;
  /** Localized week day names (e.g. ["S", "M", "T", ...]). */
  weekDaysList: string[];
}

const defaultDayFormat = (date: Date, locale: string) =>
  new Intl.DateTimeFormat(locale, { day: "numeric" }).format(date);

const defaultWeekDayFormat = (date: Date, locale: string) =>
  new Intl.DateTimeFormat(locale, { weekday: "narrow" }).format(date);

export function useDayStrip(params: UseDayStripParams = {}): UseDayStripReturn {
  const {
    pastDayCount = 100,
    futureDayCount = 10,
    referenceDateId,
    calendarFirstDayOfWeek = "sunday",
    calendarActiveDateRanges,
    calendarDisabledDateIds,
    calendarMinDateId,
    calendarMaxDateId,
    calendarFormatLocale = "en-US",
    getCalendarDayFormat = defaultDayFormat,
    getCalendarWeekDayFormat = defaultWeekDayFormat,
  } = params;

  return useMemo(() => {
    const today = new Date();
    const todayId = toDateId(today);
    const referenceDate = referenceDateId
      ? fromDateId(referenceDateId)
      : today;

    const totalDays = pastDayCount + 1 + futureDayCount;
    const startDate = subDays(referenceDate, pastDayCount);

    const startOfWeekIndex = calendarFirstDayOfWeek === "sunday" ? 0 : 1;
    const endOfWeekIndex = calendarFirstDayOfWeek === "sunday" ? 6 : 0;

    const dayList: CalendarDayMetadata[] = [];

    for (let i = 0; i < totalDays; i++) {
      const date = addDays(startDate, i);
      const id = toDateId(date);
      const dayOfWeek = date.getDay();

      dayList.push({
        date,
        displayLabel: getCalendarDayFormat(date, calendarFormatLocale),
        id,
        isDifferentMonth: false,
        isEndOfMonth:
          new Date(
            date.getFullYear(),
            date.getMonth() + 1,
            0
          ).getDate() === date.getDate(),
        isEndOfWeek: dayOfWeek === endOfWeekIndex,
        isStartOfMonth: date.getDate() === 1,
        isStartOfWeek: dayOfWeek === startOfWeekIndex,
        isWeekend: isWeekend(date),
        ...getStateFields({
          todayId,
          id,
          calendarActiveDateRanges,
          calendarDisabledDateIds,
          calendarMinDateId,
          calendarMaxDateId,
        }),
      });
    }

    const referenceId = referenceDateId ?? todayId;
    const referenceIndex = dayList.findIndex((d) => d.id === referenceId);

    // Build week day names
    const weekStart = startOfWeek(today, calendarFirstDayOfWeek);
    const weekDaysList: string[] = [];
    for (let i = 0; i < 7; i++) {
      weekDaysList.push(
        getCalendarWeekDayFormat(addDays(weekStart, i), calendarFormatLocale)
      );
    }

    return {
      dayList,
      referenceIndex: referenceIndex >= 0 ? referenceIndex : pastDayCount,
      weekDaysList,
    };
  }, [
    pastDayCount,
    futureDayCount,
    referenceDateId,
    calendarFirstDayOfWeek,
    calendarActiveDateRanges,
    calendarDisabledDateIds,
    calendarMinDateId,
    calendarMaxDateId,
    calendarFormatLocale,
    getCalendarDayFormat,
    getCalendarWeekDayFormat,
  ]);
}
