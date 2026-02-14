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
import type { ViewStyle, TextStyle } from "react-native";
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { toDateId } from "@/helpers/dates";
import type { CalendarActiveDateRange, CalendarDayMetadata } from "@/hooks/useCalendar";
import { useDayStrip, type UseDayStripParams } from "@/hooks/useDayStrip";

const { width: screenWidth } = Dimensions.get("window");

// --- Types ---

export interface DayStripDayRenderProps {
  /** The day metadata from flash-calendar */
  day: CalendarDayMetadata;
  /** Whether this day is the currently selected day */
  isSelected: boolean;
  /** Whether this day is today */
  isToday: boolean;
  /** The index of this day in the strip */
  index: number;
  /** The previous day in the strip, or undefined if this is the first day */
  previousDay: CalendarDayMetadata | undefined;
  /** The next day in the strip, or undefined if this is the last day */
  nextDay: CalendarDayMetadata | undefined;
  /** Call this to select this day */
  onPress: () => void;
}

export interface DayStripCalendarTheme {
  /** Style for the outermost container */
  container?: ViewStyle;
  /** Style for each day cell */
  dayCell?: ViewStyle;
  /** Style for a selected day cell */
  dayCellSelected?: ViewStyle;
  /** Style for today's day cell (when not selected) */
  dayCellToday?: ViewStyle;
  /** Style for a disabled day cell */
  dayCellDisabled?: ViewStyle;
  /** Style for the day number text */
  dayText?: TextStyle;
  /** Style for the selected day number text */
  dayTextSelected?: TextStyle;
  /** Style for the disabled day number text */
  dayTextDisabled?: TextStyle;
  /** Style for the week day name text */
  weekDayNameText?: TextStyle;
}

export interface DayStripCalendarRef {
  /** Scroll to a specific date in the strip */
  scrollToDate: (dateId: string, animated?: boolean) => void;
}

export interface DayStripCalendarProps
  extends Omit<UseDayStripParams, "calendarFirstDayOfWeek"> {
  /** The day of the week to start with. @default "sunday" */
  calendarFirstDayOfWeek?: "sunday" | "monday";

  /** The currently selected date ID (YYYY-MM-DD) */
  selectedDateId?: string;

  /** Called when a day is pressed */
  onDayPress?: (dateId: string) => void;

  /** Called when the visible center day changes during scrolling */
  onDayChanged?: (dateId: string) => void;

  /** Width of each day cell. @default 45 */
  dayWidth?: number;

  /** Height of each day cell. @default 60 */
  dayHeight?: number;

  /** Spacing between day cells. @default 8 */
  daySpacing?: number;

  /**
   * When true, renders a non-scrollable 7-day row for the current week
   * instead of a scrollable strip.
   * @default false
   */
  staticWeek?: boolean;

  /** Show abbreviated day name in each cell. @default false */
  showWeekDayName?: boolean;

  /** Custom render function for each day cell. Overrides default rendering. */
  renderDay?: (props: DayStripDayRenderProps) => ReactNode;

  /** Theme overrides for the default rendering. Ignored when using renderDay. */
  theme?: DayStripCalendarTheme;
}

// --- Default Day Cell ---

const DefaultDayCell = memo(function DefaultDayCell({
  day,
  isSelected,
  isToday,
  onPress,
  dayWidth,
  dayHeight,
  showWeekDayName,
  weekDayName,
  theme,
}: {
  day: CalendarDayMetadata;
  isSelected: boolean;
  isToday: boolean;
  onPress: () => void;
  dayWidth: number;
  dayHeight: number;
  showWeekDayName: boolean;
  weekDayName?: string;
  theme?: DayStripCalendarTheme;
}) {
  return (
    <Pressable
      onPress={day.state === "disabled" ? undefined : onPress}
      style={[
        defaultStyles.dayCell,
        { width: dayWidth, height: dayHeight },
        theme?.dayCell,
        isSelected && defaultStyles.dayCellSelected,
        isSelected && theme?.dayCellSelected,
        isToday && !isSelected && defaultStyles.dayCellToday,
        isToday && !isSelected && theme?.dayCellToday,
        day.state === "disabled" && defaultStyles.dayCellDisabled,
        day.state === "disabled" && theme?.dayCellDisabled,
      ]}
    >
      {showWeekDayName && weekDayName && (
        <Text
          style={[
            defaultStyles.weekDayNameText,
            theme?.weekDayNameText,
          ]}
        >
          {weekDayName}
        </Text>
      )}
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

// --- DayStripCalendar ---

export const DayStripCalendar = memo(
  forwardRef<DayStripCalendarRef, DayStripCalendarProps>(
    function DayStripCalendar(
      {
        calendarFirstDayOfWeek = "sunday",
        selectedDateId: selectedDateIdProp,
        onDayPress,
        onDayChanged,
        pastDayCount = 100,
        futureDayCount = 10,
        dayWidth = 45,
        dayHeight = 60,
        daySpacing = 8,
        staticWeek = false,
        showWeekDayName = false,
        renderDay,
        theme,
        ...calendarParams
      },
      ref
    ) {
      const todayId = useMemo(() => toDateId(new Date()), []);
      const selectedDateId = selectedDateIdProp ?? todayId;
      const flashListRef = useRef<FlashListRef<CalendarDayMetadata>>(null);

      const { dayList, referenceIndex, weekDaysList } = useDayStrip({
        pastDayCount,
        futureDayCount,
        calendarFirstDayOfWeek,
        ...calendarParams,
      });

      const itemSize = dayWidth + daySpacing;
      const centerPadding = (screenWidth - dayWidth) / 2;

      useImperativeHandle(ref, () => ({
        scrollToDate(dateId: string, animated = true) {
          const index = dayList.findIndex((d) => d.id === dateId);
          if (index >= 0 && flashListRef.current) {
            flashListRef.current.scrollToIndex({
              index,
              animated,
              viewPosition: 0.5,
            });
          }
        },
      }));

      const handleDayPress = useCallback(
        (dateId: string) => {
          onDayPress?.(dateId);
        },
        [onDayPress]
      );

      // Map day of week index to weekDaysList name
      const getWeekDayName = useCallback(
        (date: Date) => {
          const dayOfWeek = date.getDay();
          const sundayStart =
            calendarFirstDayOfWeek === "sunday"
              ? dayOfWeek
              : dayOfWeek === 0
              ? 6
              : dayOfWeek - 1;
          return weekDaysList[sundayStart];
        },
        [weekDaysList, calendarFirstDayOfWeek]
      );

      const renderItem = useCallback(
        ({ item: day, index }: { item: CalendarDayMetadata; index: number }) => {
          const isSelected = day.id === selectedDateId;
          const isToday = day.id === todayId;
          const handlePress = () => handleDayPress(day.id);

          if (renderDay) {
            return (
              <View style={{ width: dayWidth, marginHorizontal: daySpacing / 2 }}>
                {renderDay({
                  day,
                  isSelected,
                  isToday,
                  index,
                  previousDay: index > 0 ? dayList[index - 1] : undefined,
                  nextDay:
                    index < dayList.length - 1
                      ? dayList[index + 1]
                      : undefined,
                  onPress: handlePress,
                })}
              </View>
            );
          }

          return (
            <View style={{ marginHorizontal: daySpacing / 2 }}>
              <DefaultDayCell
                day={day}
                isSelected={isSelected}
                isToday={isToday}
                onPress={handlePress}
                dayWidth={dayWidth}
                dayHeight={dayHeight}
                showWeekDayName={showWeekDayName}
                weekDayName={getWeekDayName(day.date)}
                theme={theme}
              />
            </View>
          );
        },
        [
          selectedDateId,
          todayId,
          handleDayPress,
          dayWidth,
          dayHeight,
          daySpacing,
          showWeekDayName,
          theme,
          renderDay,
          dayList,
          getWeekDayName,
        ]
      );

      const keyExtractor = useCallback(
        (item: CalendarDayMetadata) => item.id,
        []
      );

      // --- Static week mode ---
      if (staticWeek) {
        // Find the week containing today (or selectedDateId)
        const targetId = selectedDateIdProp ?? todayId;
        const targetIdx = dayList.findIndex((d) => d.id === targetId);
        const targetDay =
          targetIdx >= 0 ? dayList[targetIdx] : dayList[referenceIndex];

        // Find start of week
        const targetDate = targetDay?.date ?? new Date();
        const dayOfWeek = targetDate.getDay();
        const weekStartOffset =
          calendarFirstDayOfWeek === "sunday"
            ? dayOfWeek
            : dayOfWeek === 0
            ? 6
            : dayOfWeek - 1;

        const weekStartIdx = (targetIdx >= 0 ? targetIdx : referenceIndex) - weekStartOffset;
        const weekDays = dayList.slice(
          Math.max(0, weekStartIdx),
          Math.max(0, weekStartIdx) + 7
        );

        return (
          <View
            style={[
              defaultStyles.staticWeekContainer,
              theme?.container,
            ]}
          >
            {weekDays.map((day, i) => {
              const isSelected = day.id === selectedDateId;
              const isToday = day.id === todayId;
              const handlePress = () => handleDayPress(day.id);

              if (renderDay) {
                return (
                  <View key={day.id} style={{ flex: 1, alignItems: "center" }}>
                    {renderDay({
                      day,
                      isSelected,
                      isToday,
                      index: i,
                      previousDay: i > 0 ? weekDays[i - 1] : undefined,
                      nextDay:
                        i < weekDays.length - 1
                          ? weekDays[i + 1]
                          : undefined,
                      onPress: handlePress,
                    })}
                  </View>
                );
              }

              return (
                <View key={day.id} style={{ flex: 1, alignItems: "center" }}>
                  <DefaultDayCell
                    day={day}
                    isSelected={isSelected}
                    isToday={isToday}
                    onPress={handlePress}
                    dayWidth={dayWidth}
                    dayHeight={dayHeight}
                    showWeekDayName={showWeekDayName}
                    weekDayName={getWeekDayName(day.date)}
                    theme={theme}
                  />
                </View>
              );
            })}
          </View>
        );
      }

      // --- Scrollable mode ---
      return (
        <View style={[defaultStyles.container, theme?.container]}>
          <FlashList
            ref={flashListRef}
            data={dayList}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            initialScrollIndex={referenceIndex}
            snapToInterval={itemSize}
            decelerationRate="fast"
            contentContainerStyle={{
              paddingHorizontal: centerPadding,
            }}
            extraData={selectedDateId}
          />
        </View>
      );
    }
  )
);

const defaultStyles = StyleSheet.create({
  container: {},
  staticWeekContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayCell: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  dayCellSelected: {
    backgroundColor: "#000",
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: "#ccc",
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },
  dayTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  dayTextDisabled: {
    color: "#999",
  },
  weekDayNameText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#888",
    marginBottom: 4,
  },
});
