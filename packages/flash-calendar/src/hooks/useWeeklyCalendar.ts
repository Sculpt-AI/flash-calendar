import { useMemo } from "react";

import { buildCalendar } from "@/hooks/useCalendar";
import type {
  CalendarDayMetadata,
  UseCalendarParams,
} from "@/hooks/useCalendar";
import {
  useCalendarList,
  type UseCalendarListParams,
} from "@/hooks/useCalendarList";

export type UseWeeklyCalendarParams = Omit<
  UseCalendarParams,
  "calendarMonthId"
> &
  UseCalendarListParams;

export interface UseWeeklyCalendarReturn {
  /** Flattened list of all weeks across the month range. Each week is an array of 7 days. */
  weekList: CalendarDayMetadata[][];
  /** The localized week day names (e.g. ["S", "M", "T", ...]) */
  weekDaysList: string[];
}

export function useWeeklyCalendar(
  props: UseWeeklyCalendarParams
): UseWeeklyCalendarReturn {
  const {
    calendarFirstDayOfWeek,
    calendarDisabledDateIds,
    getCalendarDayFormat,
    getCalendarMonthFormat,
    getCalendarWeekDayFormat,
    calendarMinDateId,
    calendarMaxDateId,
    calendarFormatLocale,
  } = props;
  const { monthList } = useCalendarList(props);

  return useMemo(() => {
    const weeks = monthList.map((month) =>
      buildCalendar({
        calendarMonthId: month.id,
        calendarFirstDayOfWeek,
        calendarDisabledDateIds,
        getCalendarDayFormat,
        getCalendarMonthFormat,
        getCalendarWeekDayFormat,
        calendarMinDateId,
        calendarMaxDateId,
        calendarFormatLocale,
      })
    );

    return {
      weekList: weeks.flatMap((w) => w.weeksList),
      weekDaysList: weeks[0].weekDaysList,
    };
  }, [
    monthList,
    calendarFirstDayOfWeek,
    calendarDisabledDateIds,
    getCalendarDayFormat,
    getCalendarMonthFormat,
    getCalendarWeekDayFormat,
    calendarMinDateId,
    calendarMaxDateId,
    calendarFormatLocale,
  ]);
}
