import React, { useState, useMemo } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Modal, Pressable } from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useAppTheme } from "../../context/ThemeContext";
import { AppTheme } from "../../constants/theme";

interface DatePickerFieldProps {
  label?: string;
  value: string; // 'YYYY-MM-DD'
  onChange: (dateStr: string) => void;
  placeholder?: string;
  style?: any;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function DatePickerField({
  label,
  value,
  onChange,
  placeholder = "Select date",
  style,
}: DatePickerFieldProps) {
  const { theme, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const [modalVisible, setModalVisible] = useState(false);

  // Parse current value or fallback to today
  const selectedDate = useMemo(() => {
    if (!value) return new Date();
    const parts = value.split("-");
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const date = new Date(y, m, d);
      if (!isNaN(date.getTime())) return date;
    }
    const fallback = new Date(value);
    return isNaN(fallback.getTime()) ? new Date() : fallback;
  }, [value]);

  const [viewYear, setViewYear] = useState(() => selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => selectedDate.getMonth());

  const openModal = () => {
    setViewYear(selectedDate.getFullYear());
    setViewMonth(selectedDate.getMonth());
    setModalVisible(true);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handlePrevYear = () => {
    setViewYear((prev) => prev - 1);
  };

  const handleNextYear = () => {
    setViewYear((prev) => prev + 1);
  };

  const formatDisplay = (raw: string) => {
    if (!raw) return placeholder;
    try {
      const parts = raw.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const dateObj = new Date(y, m, d);
        if (!isNaN(dateObj.getTime())) {
          return dateObj.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
        }
      }
      return raw;
    } catch {
      return raw;
    }
  };

  // Build calendar matrix
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();

  const daysGrid = useMemo(() => {
    const grid: (number | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      grid.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      grid.push(day);
    }
    return grid;
  }, [viewYear, viewMonth, daysInMonth, firstDayIndex]);

  const today = new Date();
  const isToday = (day: number) =>
    today.getDate() === day &&
    today.getMonth() === viewMonth &&
    today.getFullYear() === viewYear;

  const isSelected = (day: number) =>
    selectedDate.getDate() === day &&
    selectedDate.getMonth() === viewMonth &&
    selectedDate.getFullYear() === viewYear;

  const selectDay = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const result = `${viewYear}-${mm}-${dd}`;
    onChange(result);
    setModalVisible(false);
  };

  const selectToday = () => {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const result = `${now.getFullYear()}-${mm}-${dd}`;
    onChange(result);
    setModalVisible(false);
  };

  return (
    <View style={[styles.wrapper, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={styles.fieldButton}
        onPress={openModal}
        activeOpacity={0.7}>
        <MaterialIcons
          name="calendar-today"
          size={16}
          color={theme.colors.primary}
          style={styles.fieldIcon}
        />
        <Text style={[styles.fieldText, !value && styles.placeholderText]}>
          {value ? `${formatDisplay(value)}` : placeholder}
        </Text>
        <Feather name="chevron-down" size={16} color={theme.colors.textMuted} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.calendarCard} onPress={(e) => e.stopPropagation()}>
            {/* Header with Month/Year Navigation */}
            <View style={styles.calendarHeader}>
              <View style={styles.navRow}>
                <TouchableOpacity
                  onPress={handlePrevYear}
                  style={styles.navButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Feather
                    name="chevrons-left"
                    size={18}
                    color={theme.colors.textMuted}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handlePrevMonth}
                  style={styles.navButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Feather
                    name="chevron-left"
                    size={18}
                    color={theme.colors.textPrimary}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.monthYearTitle}>
                {MONTHS[viewMonth]} {viewYear}
              </Text>

              <View style={styles.navRow}>
                <TouchableOpacity
                  onPress={handleNextMonth}
                  style={styles.navButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Feather
                    name="chevron-right"
                    size={18}
                    color={theme.colors.textPrimary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleNextYear}
                  style={styles.navButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Feather
                    name="chevrons-right"
                    size={18}
                    color={theme.colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Weekday Labels */}
            <View style={styles.weekdaysRow}>
              {WEEKDAYS.map((wd, i) => (
                <Text key={i} style={styles.weekdayText}>
                  {wd}
                </Text>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.gridContainer}>
              {daysGrid.map((day, index) => {
                if (day === null) {
                  return <View key={`empty-${index}`} style={styles.dayCell} />;
                }

                const selected = isSelected(day);
                const currentToday = isToday(day);

                return (
                  <TouchableOpacity
                    key={`day-${day}`}
                    style={[
                      styles.dayCell,
                      selected && styles.selectedDayCell,
                      currentToday && !selected && styles.todayCell,
                    ]}
                    onPress={() => selectDay(day)}
                    activeOpacity={0.6}>
                    <Text
                      style={[
                        styles.dayText,
                        selected && styles.selectedDayText,
                        currentToday && !selected && styles.todayText,
                      ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Footer Actions */}
            <View style={styles.footerRow}>
              <TouchableOpacity
                style={styles.todayButton}
                onPress={selectToday}
                activeOpacity={0.7}>
                <MaterialIcons name="today" size={14} color={theme.colors.primary} />
                <Text style={styles.todayButtonText}>Today</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.7}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const createStyles = (theme: AppTheme, isDark: boolean) =>
  StyleSheet.create({
    wrapper: {
      gap: 6,
    },
    label: {
      fontSize: 10,
      fontWeight: "700",
      color: theme.colors.textMuted,
      letterSpacing: 0.6,
    },
    fieldButton: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: theme.colors.surfaceSubtle,
      minHeight: 44,
    },
    fieldIcon: {
      marginRight: 8,
    },
    fieldText: {
      flex: 1,
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.textPrimary,
      fontVariant: ["tabular-nums"],
    },
    placeholderText: {
      color: theme.colors.textMuted,
      fontWeight: "400",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(15, 23, 42, 0.6)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    calendarCard: {
      width: "100%",
      maxWidth: 340,
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.4 : 0.15,
      shadowRadius: 12,
      elevation: 6,
    },
    calendarHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceBorder,
    },
    navRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    navButton: {
      padding: 6,
      borderRadius: 8,
      backgroundColor: theme.colors.surfaceSubtle,
    },
    monthYearTitle: {
      fontSize: 15,
      fontWeight: "800",
      color: theme.colors.textPrimary,
    },
    weekdaysRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingVertical: 8,
    },
    weekdayText: {
      width: 36,
      textAlign: "center",
      fontSize: 11,
      fontWeight: "700",
      color: theme.colors.textMuted,
    },
    gridContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-around",
      rowGap: 4,
    },
    dayCell: {
      width: 38,
      height: 38,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 19,
    },
    selectedDayCell: {
      backgroundColor: theme.colors.primary,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    todayCell: {
      borderWidth: 1.5,
      borderColor: theme.colors.primary,
    },
    dayText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.colors.textPrimary,
      fontVariant: ["tabular-nums"],
    },
    selectedDayText: {
      color: "#ffffff",
      fontWeight: "800",
    },
    todayText: {
      color: theme.colors.primary,
      fontWeight: "800",
    },
    footerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 14,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: theme.colors.surfaceBorder,
    },
    todayButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: theme.colors.primaryLight,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.primaryBorder,
    },
    todayButtonText: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.colors.primary,
    },
    cancelButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    cancelButtonText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.textMuted,
    },
  });
