export * from "./components";
export { toDateId, fromDateId } from "./helpers/dates";

export {
  type UseCalendarParams,
  type CalendarDayMetadata,
  type CalendarActiveDateRange,
  useCalendar,
  buildCalendar,
} from "./hooks/useCalendar";

export {
  type CalendarMonth,
  type UseCalendarListParams,
  getHeightForMonth,
  useCalendarList,
} from "./hooks/useCalendarList";

export {
  useOptimizedDayMetadata,
  activeDateRangesEmitter,
} from "./hooks/useOptimizedDayMetadata";

export { useDateRange } from "./hooks/useDateRange";

export {
  useWeeklyCalendar,
  type UseWeeklyCalendarParams,
  type UseWeeklyCalendarReturn,
} from "./hooks/useWeeklyCalendar";

export {
  WeeklyCalendar,
  type WeeklyCalendarRef,
  type WeeklyCalendarProps,
  type WeeklyCalendarDayRenderProps,
  type WeeklyCalendarWeekRenderProps,
  type WeeklyCalendarTheme,
} from "./components/WeeklyCalendar";

export {
  useDayStrip,
  type UseDayStripParams,
  type UseDayStripReturn,
} from "./hooks/useDayStrip";

export {
  DayStripCalendar,
  type DayStripCalendarProps,
  type DayStripCalendarRef,
  type DayStripCalendarTheme,
  type DayStripDayRenderProps,
} from "./components/DayStripCalendar";
