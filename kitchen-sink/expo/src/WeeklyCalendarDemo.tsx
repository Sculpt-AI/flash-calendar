import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  WeeklyCalendar,
  buildCalendar,
  toDateId,
  fromDateId,
  type CalendarDayMetadata,
  type WeeklyCalendarWeekRenderProps,
} from "@marceloterreiro/flash-calendar";

/** Get the date ID for the day before/after a given date ID */
function getAdjacentDateId(dateId: string, offset: number): string {
  const date = fromDateId(dateId);
  date.setDate(date.getDate() + offset);
  return toDateId(date);
}

// --- Simulated streak data (completed workout days) ---
const STREAK_DATE_IDS = new Set([
  "2026-02-03",
  "2026-02-05",
  "2026-02-06",
  "2026-02-07",
  "2026-02-08",
  "2026-02-09",
  "2026-02-10",
  "2026-02-11",
  "2026-02-12",
  "2026-02-14",
  "2026-02-18",
  "2026-02-19",
  "2026-02-20",
  "2026-02-21",
  "2026-02-22",
  "2026-02-23",
  "2026-02-24",
]);

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// --- Streak Week Renderer ---

function StreakWeekRow({
  week,
  selectedDateId,
  todayId,
  onDayPress,
  streakDateIds,
}: WeeklyCalendarWeekRenderProps & {
  streakDateIds: Set<string>;
}) {
  return (
    <View style={streakStyles.weekRow}>
      {week.map((day, index) => {
        const isStreak = streakDateIds.has(day.id);
        const isSelected = day.id === selectedDateId;
        const isToday = day.id === todayId;
        // Check by actual date so cross-week streaks connect
        const prevDayIsStreak = streakDateIds.has(
          getAdjacentDateId(day.id, -1)
        );
        const nextDayIsStreak = streakDateIds.has(
          getAdjacentDateId(day.id, 1)
        );
        // Show connectors even at week edges for cross-week streaks
        const showLeftConnector = isStreak && prevDayIsStreak;
        const showRightConnector = isStreak && nextDayIsStreak;

        return (
          <View key={day.id} style={streakStyles.dayContainer}>
            {/* Connector line to previous streak day */}
            {showLeftConnector && (
              <View style={streakStyles.connectorLeft} />
            )}
            {/* Connector line to next streak day */}
            {showRightConnector && (
              <View style={streakStyles.connectorRight} />
            )}

            {/* Individual day pill background */}
            {isStreak && (
              <View
                style={[
                  streakStyles.streakPill,
                  isSelected && streakStyles.streakPillSelected,
                ]}
              />
            )}

            {/* Selected ring for non-streak days */}
            {isSelected && !isStreak && (
              <View style={streakStyles.selectedRing} />
            )}

            <Pressable
              onPress={() => onDayPress(day.id)}
              style={({ pressed }) => [
                streakStyles.dayPressable,
                pressed && !isStreak && streakStyles.dayPressed,
              ]}
            >
              {/* Day number */}
              <Text
                style={[
                  streakStyles.dayText,
                  isStreak && streakStyles.dayTextStreak,
                  isSelected && !isStreak && streakStyles.dayTextSelected,
                  isToday && !isStreak && !isSelected && streakStyles.dayTextToday,
                  day.isDifferentMonth && !isStreak && streakStyles.dayTextDifferentMonth,
                ]}
              >
                {day.displayLabel}
              </Text>

              {/* Checkmark or empty circle indicator */}
              <View style={streakStyles.indicatorContainer}>
                {isStreak ? (
                  <View style={streakStyles.checkCircleStreak}>
                    <Text style={streakStyles.checkmark}>✓</Text>
                  </View>
                ) : isToday || isSelected ? (
                  <View style={streakStyles.checkCircleToday}>
                    <Text style={streakStyles.checkmarkToday}>✓</Text>
                  </View>
                ) : (
                  <View style={streakStyles.emptyCircle} />
                )}
              </View>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

// --- Full Month Calendar with Streaks ---

function FullMonthCalendar({
  selectedDateId,
  onDayPress,
  streakDateIds,
}: {
  selectedDateId: string;
  onDayPress: (id: string) => void;
  streakDateIds: Set<string>;
}) {
  const todayId = useMemo(() => toDateId(new Date()), []);
  const [monthOffset, setMonthOffset] = useState(0);

  const currentMonthDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    d.setDate(1);
    return d;
  }, [monthOffset]);

  const monthId = useMemo(() => toDateId(currentMonthDate), [currentMonthDate]);
  const monthLabel = `${MONTHS[currentMonthDate.getMonth()]} ${currentMonthDate.getFullYear()}`;

  const { weeksList, weekDaysList } = useMemo(
    () =>
      buildCalendar({
        calendarMonthId: monthId,
        calendarFirstDayOfWeek: "sunday",
      }),
    [monthId]
  );

  return (
    <View style={fullStyles.container}>
      {/* Month header with navigation */}
      <View style={fullStyles.header}>
        <Pressable
          onPress={() => setMonthOffset((o) => o - 1)}
          style={fullStyles.navButton}
        >
          <Text style={fullStyles.navText}>‹</Text>
        </Pressable>
        <Text style={fullStyles.monthLabel}>{monthLabel}</Text>
        <Pressable
          onPress={() => setMonthOffset((o) => o + 1)}
          style={fullStyles.navButton}
        >
          <Text style={fullStyles.navText}>›</Text>
        </Pressable>
      </View>

      {/* Week day names */}
      <View style={fullStyles.weekDayRow}>
        {weekDaysList.map((name, i) => (
          <View key={i} style={fullStyles.weekDayCell}>
            <Text style={fullStyles.weekDayText}>{name}</Text>
          </View>
        ))}
      </View>

      {/* Weeks grid */}
      {weeksList.map((week, weekIndex) => (
        <View key={weekIndex} style={fullStyles.weekRow}>
          {week.map((day, dayIndex) => {
            const isStreak = streakDateIds.has(day.id);
            const isSelected = day.id === selectedDateId;
            const isToday = day.id === todayId;
            const prevDayIsStreak = streakDateIds.has(
              getAdjacentDateId(day.id, -1)
            );
            const nextDayIsStreak = streakDateIds.has(
              getAdjacentDateId(day.id, 1)
            );
            const showLeftConnector = isStreak && prevDayIsStreak && dayIndex > 0;
            const showRightConnector = isStreak && nextDayIsStreak && dayIndex < 6;

            return (
              <View key={day.id} style={fullStyles.dayContainer}>
                {showLeftConnector && (
                  <View style={streakStyles.connectorLeft} />
                )}
                {showRightConnector && (
                  <View style={streakStyles.connectorRight} />
                )}

                {isStreak && (
                  <View
                    style={[
                      fullStyles.streakPill,
                      isSelected && fullStyles.streakPillSelected,
                    ]}
                  />
                )}

                {isSelected && !isStreak && (
                  <View style={fullStyles.selectedCircle} />
                )}

                <Pressable
                  onPress={() => onDayPress(day.id)}
                  style={fullStyles.dayPressable}
                >
                  <Text
                    style={[
                      fullStyles.dayText,
                      isStreak && fullStyles.dayTextStreak,
                      isSelected && !isStreak && fullStyles.dayTextSelected,
                      isToday &&
                        !isStreak &&
                        !isSelected &&
                        fullStyles.dayTextToday,
                      day.isDifferentMonth && fullStyles.dayTextDifferentMonth,
                    ]}
                  >
                    {day.displayLabel}
                  </Text>
                  {/* Small indicator dot/check */}
                  <View style={fullStyles.indicatorWrap}>
                    {isStreak ? (
                      <View style={fullStyles.checkSmallStreak}>
                        <Text style={fullStyles.checkSmallText}>✓</Text>
                      </View>
                    ) : isToday || isSelected ? (
                      <View style={fullStyles.dotSelected} />
                    ) : (
                      <View style={fullStyles.dotEmpty} />
                    )}
                  </View>
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// --- Demo Screen ---

export function WeeklyCalendarDemo() {
  const todayId = useMemo(() => toDateId(new Date()), []);

  // Parent state for streak calendar
  const [streakSelectedId, setStreakSelectedId] = useState(todayId);
  const [streakMonth, setStreakMonth] = useState(() => {
    const now = new Date();
    return `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  });

  // Parent state for full month calendar
  const [fullSelectedId, setFullSelectedId] = useState(todayId);

  // Parent state for default calendar
  const [defaultSelectedId, setDefaultSelectedId] = useState(todayId);
  const [defaultMonth, setDefaultMonth] = useState(() => {
    const now = new Date();
    return `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  });

  const handleStreakDayPress = useCallback((id: string) => {
    setStreakSelectedId(id);
  }, []);

  const handleStreakWeekChanged = useCallback((week: CalendarDayMetadata[]) => {
    if (week.length > 0) {
      const d = week[0].date;
      setStreakMonth(`${MONTHS[d.getMonth()]} ${d.getFullYear()}`);
    }
  }, []);

  const handleDefaultDayPress = useCallback((id: string) => {
    setDefaultSelectedId(id);
  }, []);

  const handleDefaultWeekChanged = useCallback(
    (week: CalendarDayMetadata[]) => {
      if (week.length > 0) {
        const d = week[0].date;
        setDefaultMonth(`${MONTHS[d.getMonth()]} ${d.getFullYear()}`);
      }
    },
    []
  );

  const renderWeek = useCallback(
    (props: WeeklyCalendarWeekRenderProps) => (
      <StreakWeekRow {...props} streakDateIds={STREAK_DATE_IDS} />
    ),
    []
  );

  const handleFullDayPress = useCallback((id: string) => {
    setFullSelectedId(id);
  }, []);

  return (
    <ScrollView style={demoStyles.container}>
      {/* Streak weekly calendar */}
      <Text style={demoStyles.sectionLabel}>Weekly — Streak Theme</Text>
      <Text style={demoStyles.monthText}>{streakMonth}</Text>
      <WeeklyCalendar
        calendarPastScrollRangeInMonths={6}
        calendarFutureScrollRangeInMonths={6}
        calendarFirstDayOfWeek="sunday"
        selectedDateId={streakSelectedId}
        onDayPress={handleStreakDayPress}
        onWeekChanged={handleStreakWeekChanged}
        showWeekDayNames={false}
        dayHeight={80}
        renderWeek={renderWeek}
      />
      <Text style={demoStyles.selectedText}>
        Selected: {streakSelectedId}
      </Text>

      <View style={demoStyles.divider} />

      {/* Full month calendar with same streak theme */}
      <Text style={demoStyles.sectionLabel}>Monthly — Streak Theme</Text>
      <FullMonthCalendar
        selectedDateId={fullSelectedId}
        onDayPress={handleFullDayPress}
        streakDateIds={STREAK_DATE_IDS}
      />
      <Text style={demoStyles.selectedText}>
        Selected: {fullSelectedId}
      </Text>

      <View style={demoStyles.divider} />

      {/* Default weekly calendar */}
      <Text style={demoStyles.sectionLabel}>Weekly — Default Theme</Text>
      <Text style={demoStyles.monthText}>{defaultMonth}</Text>
      <WeeklyCalendar
        calendarPastScrollRangeInMonths={6}
        calendarFutureScrollRangeInMonths={6}
        calendarFirstDayOfWeek="sunday"
        selectedDateId={defaultSelectedId}
        onDayPress={handleDefaultDayPress}
        onWeekChanged={handleDefaultWeekChanged}
      />
      <Text style={demoStyles.selectedText}>
        Selected: {defaultSelectedId}
      </Text>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

// --- Styles ---

const STREAK_COLOR = "#E8622A";

const streakStyles = StyleSheet.create({
  weekRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    overflow: "hidden",
  },
  dayContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    height: 80,
  },
  streakPill: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 4,
    right: 4,
    borderRadius: 24,
    backgroundColor: STREAK_COLOR,
  },
  streakPillSelected: {
    borderWidth: 3,
    borderColor: "#000",
  },
  selectedRing: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 4,
    right: 4,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#000",
  },
  connectorLeft: {
    position: "absolute",
    left: -2,
    right: "50%",
    height: 4,
    top: "50%",
    marginTop: -2,
    backgroundColor: STREAK_COLOR,
    zIndex: 0,
  },
  connectorRight: {
    position: "absolute",
    right: -2,
    left: "50%",
    height: 4,
    top: "50%",
    marginTop: -2,
    backgroundColor: STREAK_COLOR,
    zIndex: 0,
  },
  dayPressable: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    zIndex: 1,
    gap: 4,
  },
  dayPressed: {
    opacity: 0.6,
  },
  dayText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
  },
  dayTextStreak: {
    color: "#fff",
    fontWeight: "700",
  },
  dayTextSelected: {
    fontWeight: "700",
    color: "#000",
  },
  dayTextToday: {
    fontWeight: "700",
    color: "#000",
  },
  dayTextDifferentMonth: {
    color: "#ccc",
  },
  indicatorContainer: {
    height: 22,
    width: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircleStreak: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    fontSize: 13,
    fontWeight: "700",
    color: STREAK_COLOR,
    marginTop: -1,
  },
  checkCircleToday: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  checkmarkToday: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    marginTop: -1,
  },
  emptyCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "#ddd",
  },
});

const demoStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  monthText: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    fontWeight: "700",
    fontSize: 22,
  },
  selectedText: {
    paddingHorizontal: 16,
    paddingTop: 8,
    fontSize: 15,
    color: "#666",
  },
  sectionLabel: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    fontSize: 13,
    fontWeight: "600",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  divider: {
    marginTop: 32,
    marginBottom: 8,
  },
});

const fullStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  navText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
    marginTop: -2,
  },
  monthLabel: {
    fontSize: 20,
    fontWeight: "700",
  },
  weekDayRow: {
    flexDirection: "row",
    paddingBottom: 8,
  },
  weekDayCell: {
    flex: 1,
    alignItems: "center",
  },
  weekDayText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#999",
  },
  weekRow: {
    flexDirection: "row",
    overflow: "hidden",
    marginBottom: 2,
  },
  dayContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    height: 56,
  },
  streakPill: {
    position: "absolute",
    top: 3,
    bottom: 3,
    left: 3,
    right: 3,
    borderRadius: 18,
    backgroundColor: STREAK_COLOR,
  },
  streakPillSelected: {
    borderWidth: 2.5,
    borderColor: "#000",
  },
  selectedCircle: {
    position: "absolute",
    top: 3,
    bottom: 3,
    left: 3,
    right: 3,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#000",
  },
  dayPressable: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    zIndex: 1,
    gap: 2,
  },
  dayText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
  },
  dayTextStreak: {
    color: "#fff",
    fontWeight: "700",
  },
  dayTextSelected: {
    fontWeight: "700",
    color: "#000",
  },
  dayTextToday: {
    fontWeight: "700",
    color: "#000",
  },
  dayTextDifferentMonth: {
    color: "#ddd",
  },
  indicatorWrap: {
    height: 14,
    width: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  checkSmallStreak: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  checkSmallText: {
    fontSize: 9,
    fontWeight: "700",
    color: STREAK_COLOR,
    marginTop: -1,
  },
  dotSelected: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#000",
  },
  dotEmpty: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#ddd",
  },
});
