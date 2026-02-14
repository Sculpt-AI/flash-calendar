import type { FlashListRef } from "@shopify/flash-list";
import { FlashList } from "@shopify/flash-list";
import type { ReactNode } from "react";
import {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import type { ViewToken, ViewStyle, TextStyle } from "react-native";
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { CalendarDayMetadata } from "@/hooks/useCalendar";
import { toDateId } from "@/helpers/dates";
import {
  useWeeklyCalendar,
  type UseWeeklyCalendarParams,
} from "@/hooks/useWeeklyCalendar";

const { width: screenWidth } = Dimensions.get("window");

// --- Types ---

export interface WeeklyCalendarDayRenderProps {
  /** The day metadata from flash-calendar */
  day: CalendarDayMetadata;
  /** Whether this day is the currently selected day */
  isSelected: boolean;
  /** Whether this day is today */
  isToday: boolean;
  /** The 0-based index of this day within its week (0 = first day) */
  weekDayIndex: number;
  /** The full week array this day belongs to */
  week: CalendarDayMetadata[];
  /** Call this to select this day */
  onPress: () => void;
}

export interface WeeklyCalendarWeekRenderProps {
  /** The array of days for this week */
  week: CalendarDayMetadata[];
  /** The currently selected date ID */
  selectedDateId: string;
  /** Today's date ID */
  todayId: string;
  /** Call this with a date ID to select a day */
  onDayPress: (dateId: string) => void;
}

export interface WeeklyCalendarTheme {
  /** Style for the outermost container */
  container?: ViewStyle;
  /** Style for the week day names row */
  weekDayNamesContainer?: ViewStyle;
  /** Style for each week day name cell */
  weekDayNameCell?: ViewStyle;
  /** Style for the week day name text */
  weekDayNameText?: TextStyle;
  /** Style for each week row */
  weekRow?: ViewStyle;
  /** Style for each day cell */
  dayCell?: ViewStyle;
  /** Style for a selected day cell */
  dayCellSelected?: ViewStyle;
  /** Style for today's day cell (when not selected) */
  dayCellToday?: ViewStyle;
  /** Style for a pressed day cell */
  dayCellPressed?: ViewStyle;
  /** Style for a disabled day cell */
  dayCellDisabled?: ViewStyle;
  /** Style for the day text */
  dayText?: TextStyle;
  /** Style for the selected day text */
  dayTextSelected?: TextStyle;
  /** Style for a disabled day text */
  dayTextDisabled?: TextStyle;
}

export interface WeeklyCalendarRef {
  /** Scroll to the week containing the given date */
  scrollToDate: (dateId: string, animated?: boolean) => void;
}

export interface WeeklyCalendarProps
  extends Omit<UseWeeklyCalendarParams, "calendarFirstDayOfWeek"> {
  /** The day of the week to start with. @default "sunday" */
  calendarFirstDayOfWeek?: "sunday" | "monday";

  /** The currently selected date ID (YYYY-MM-DD) */
  selectedDateId?: string;

  /** Called when a day is pressed */
  onDayPress?: (dateId: string) => void;

  /** Called when the visible week changes during scrolling */
  onWeekChanged?: (week: CalendarDayMetadata[]) => void;

  /** Whether to show the week day names row. @default true */
  showWeekDayNames?: boolean;

  /** The height of each day cell. @default 48 */
  dayHeight?: number;

  /** The height of the week day names row. @default 32 */
  weekDayNameHeight?: number;

  /** Custom render function for each day cell. Overrides default rendering. */
  renderDay?: (props: WeeklyCalendarDayRenderProps) => ReactNode;

  /** Custom render function for entire week row. Overrides renderDay. */
  renderWeek?: (props: WeeklyCalendarWeekRenderProps) => ReactNode;

  /** Custom render function for each week day name. */
  renderWeekDayName?: (props: { name: string; index: number }) => ReactNode;

  /** Theme overrides for the default rendering. Ignored when using render props. */
  theme?: WeeklyCalendarTheme;
}

// --- Default Day Cell ---

const DefaultDayCell = memo(function DefaultDayCell({
  day,
  isSelected,
  isToday,
  onPress,
  dayHeight,
  theme,
}: {
  day: CalendarDayMetadata;
  isSelected: boolean;
  isToday: boolean;
  onPress: () => void;
  dayHeight: number;
  theme?: WeeklyCalendarTheme;
}) {
  return (
    <Pressable
      onPress={day.state === "disabled" ? undefined : onPress}
      style={({ pressed }) => [
        defaultStyles.dayCell,
        { height: dayHeight },
        theme?.dayCell,
        isSelected && defaultStyles.dayCellSelected,
        isSelected && theme?.dayCellSelected,
        isToday && !isSelected && defaultStyles.dayCellToday,
        isToday && !isSelected && theme?.dayCellToday,
        pressed && defaultStyles.dayCellPressed,
        pressed && theme?.dayCellPressed,
        day.state === "disabled" && defaultStyles.dayCellDisabled,
        day.state === "disabled" && theme?.dayCellDisabled,
      ]}
    >
      <Text
        style={[
          defaultStyles.dayText,
          theme?.dayText,
          isSelected && defaultStyles.dayTextSelected,
          isSelected && theme?.dayTextSelected,
          day.state === "disabled" && defaultStyles.dayTextDisabled,
          day.state === "disabled" && theme?.dayTextDisabled,
        ]}
      >
        {day.displayLabel}
      </Text>
    </Pressable>
  );
});

// --- Default Week Row ---

const DefaultWeekRow = memo(function DefaultWeekRow({
  week,
  selectedDateId,
  todayId,
  onDayPress,
  dayHeight,
  theme,
  renderDay,
}: {
  week: CalendarDayMetadata[];
  selectedDateId: string;
  todayId: string;
  onDayPress: (dateId: string) => void;
  dayHeight: number;
  theme?: WeeklyCalendarTheme;
  renderDay?: WeeklyCalendarProps["renderDay"];
}) {
  return (
    <View
      style={[
        defaultStyles.weekRow,
        { width: screenWidth },
        theme?.weekRow,
      ]}
    >
      {week.map((day, weekDayIndex) => {
        const isSelected = day.id === selectedDateId;
        const isToday = day.id === todayId;
        const handlePress = () => onDayPress(day.id);

        if (renderDay) {
          return (
            <View key={day.id} style={defaultStyles.dayWrapper}>
              {renderDay({
                day,
                isSelected,
                isToday,
                weekDayIndex,
                week,
                onPress: handlePress,
              })}
            </View>
          );
        }

        return (
          <DefaultDayCell
            key={day.id}
            day={day}
            isSelected={isSelected}
            isToday={isToday}
            onPress={handlePress}
            dayHeight={dayHeight}
            theme={theme}
          />
        );
      })}
    </View>
  );
});

// --- WeeklyCalendar ---

export const WeeklyCalendar = memo(
  forwardRef<WeeklyCalendarRef, WeeklyCalendarProps>(
    function WeeklyCalendar(
      {
        calendarFirstDayOfWeek = "sunday",
        calendarPastScrollRangeInMonths,
        calendarFutureScrollRangeInMonths,
        selectedDateId: selectedDateIdProp,
        onDayPress,
        onWeekChanged,
        showWeekDayNames = true,
        dayHeight = 48,
        weekDayNameHeight = 32,
        renderDay,
        renderWeek,
        renderWeekDayName,
        theme,
        ...calendarParams
      },
      ref
    ) {
      const todayId = useMemo(() => toDateId(new Date()), []);
      const selectedDateId = selectedDateIdProp ?? todayId;
      const flashListRef = useRef<FlashListRef<CalendarDayMetadata[]>>(null);

      const { weekDaysList, weekList } = useWeeklyCalendar({
        calendarFirstDayOfWeek,
        calendarPastScrollRangeInMonths,
        calendarFutureScrollRangeInMonths,
        ...calendarParams,
      });

      const handleDayPress = useCallback(
        (dateId: string) => {
          onDayPress?.(dateId);
        },
        [onDayPress]
      );

      // Stable ref for onViewableItemsChanged (FlashList requirement)
      const onWeekChangedRef = useRef(onWeekChanged);
      onWeekChangedRef.current = onWeekChanged;

      const handleViewableItemsChanged = useRef(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
          const visible = viewableItems.find((i) => i.isViewable);
          if (visible?.item) {
            onWeekChangedRef.current?.(visible.item as CalendarDayMetadata[]);
          }
        }
      ).current;

      const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
      }).current;

      useImperativeHandle(ref, () => ({
        scrollToDate(dateId: string, animated = true) {
          const index = weekList.findIndex((week) =>
            week.some((day) => day.id === dateId)
          );
          if (index >= 0 && flashListRef.current) {
            flashListRef.current.scrollToIndex({ index, animated });
          }
        },
      }));

      const renderItem = useCallback(
        ({ item: week }: { item: CalendarDayMetadata[] }) => {
          if (renderWeek) {
            return (
              <View style={{ width: screenWidth }}>
                {renderWeek({
                  week,
                  selectedDateId,
                  todayId,
                  onDayPress: handleDayPress,
                })}
              </View>
            );
          }

          return (
            <DefaultWeekRow
              week={week}
              selectedDateId={selectedDateId}
              todayId={todayId}
              onDayPress={handleDayPress}
              dayHeight={dayHeight}
              theme={theme}
              renderDay={renderDay}
            />
          );
        },
        [
          selectedDateId,
          todayId,
          handleDayPress,
          dayHeight,
          theme,
          renderDay,
          renderWeek,
        ]
      );

      const initialIndex = useMemo(() => {
        const idx = weekList.findIndex((week) =>
          week.some((day) => day.id === todayId)
        );
        return idx >= 0 ? idx : 0;
      }, [weekList, todayId]);

      const keyExtractor = useCallback(
        (item: CalendarDayMetadata[]) => item[0]?.id ?? "",
        []
      );

      return (
        <View style={[defaultStyles.container, theme?.container]}>
          {showWeekDayNames && (
            <View
              style={[
                defaultStyles.weekDayNamesContainer,
                theme?.weekDayNamesContainer,
              ]}
            >
              {weekDaysList.map((name, index) =>
                renderWeekDayName ? (
                  <View key={index} style={defaultStyles.dayWrapper}>
                    {renderWeekDayName({ name, index })}
                  </View>
                ) : (
                  <View
                    key={index}
                    style={[
                      defaultStyles.weekDayNameCell,
                      { height: weekDayNameHeight },
                      theme?.weekDayNameCell,
                    ]}
                  >
                    <Text
                      style={[
                        defaultStyles.weekDayNameText,
                        theme?.weekDayNameText,
                      ]}
                    >
                      {name}
                    </Text>
                  </View>
                )
              )}
            </View>
          )}
          <View style={{ height: dayHeight }}>
            <FlashList
              ref={flashListRef}
              data={weekList}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              renderItem={renderItem}
              initialScrollIndex={initialIndex}
              onViewableItemsChanged={handleViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              keyExtractor={keyExtractor}
              extraData={selectedDateId}
            />
          </View>
        </View>
      );
    }
  )
);

const defaultStyles = StyleSheet.create({
  container: {},
  weekDayNamesContainer: {
    flexDirection: "row",
    paddingHorizontal: 4,
  },
  weekDayNameCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  weekDayNameText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#888",
  },
  weekRow: {
    flexDirection: "row",
    paddingHorizontal: 4,
  },
  dayWrapper: {
    flex: 1,
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    marginHorizontal: 2,
  },
  dayCellSelected: {
    backgroundColor: "#000",
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: "#ccc",
  },
  dayCellPressed: {
    backgroundColor: "#e8e8e8",
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 16,
    color: "#000",
  },
  dayTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  dayTextDisabled: {
    color: "#999",
  },
});
