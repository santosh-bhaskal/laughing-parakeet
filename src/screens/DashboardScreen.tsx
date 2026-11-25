import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { AppTheme } from "../constants/theme";
import { useAppTheme } from "../context/ThemeContext";
import { useQuery } from "@tanstack/react-query";
import { dashboardService, dailyRecordService, authService } from "../api/services";
import AppHeader from "../components/common/AppHeader";
import { DashboardSkeleton, TableRowsSkeleton } from "../components/common/Skeleton";
import AddDailyRecordModal from "../components/modals/AddDailyRecordModal";
import EditDailyRecordModal from "../components/modals/EditDailyRecordModal";
import NotificationsModal from "../components/modals/NotificationsModal";

export default function DashboardScreen() {
  const { theme, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    authService.getCurrentUser().then(setCurrentUser);
  }, []);

  // 1. Fetch live telemetry from API
  const {
    data: telemetry,
    refetch: refetchTelemetry,
    isLoading: isLoadingTelemetry,
  } = useQuery({
    queryKey: ["dashboard-telemetry"],
    queryFn: dashboardService.getTelemetry,
  });

  // 2. Fetch live daily records from API
  const {
    data: dailyRecordsRes,
    refetch: refetchDailyRecords,
    isLoading: isLoadingRecords,
  } = useQuery({
    queryKey: ["daily-records"],
    queryFn: dailyRecordService.getAll,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchTelemetry(), refetchDailyRecords()]);
    setRefreshing(false);
  }, [refetchTelemetry, refetchDailyRecords]);

  // Purely dynamic telemetry data (defaults strictly to 0, no static mock data)
  const hasBatch = !!telemetry?.activeBatchId;
  const aliveBirds = Number(telemetry?.totalAliveBirds ?? 0);
  const mortality = Number(telemetry?.totalMortality ?? 0);
  const feedBags = Number(telemetry?.totalFeedBagsAvailable ?? 0);
  const feedConsume = Number(telemetry?.totalFeedConsume ?? 0);
  const feedConsumed = feedConsume;
  const totalBirds = aliveBirds + mortality;
  const mortalityRate =
    totalBirds > 0 ? ((mortality / totalBirds) * 100).toFixed(1) + "%" : "0.0%";
  const survivalRate =
    totalBirds > 0 ? ((aliveBirds / totalBirds) * 100).toFixed(1) + "%" : "100%";

  // Process live records purely from API
  const rawRecords: any[] = Array.isArray(dailyRecordsRes)
    ? dailyRecordsRes
    : Array.isArray((dailyRecordsRes as any)?.data)
      ? (dailyRecordsRes as any).data
      : [];

  const recordsList = [...rawRecords].sort((a: any, b: any) => {
    const timeA = new Date(a.date).getTime() || 0;
    const timeB = new Date(b.date).getTime() || 0;
    return timeB - timeA;
  });

  // Derive age from most recent log
  const latestAge = recordsList[0]?.birdAgeInDays
    ? Number(recordsList[0].birdAgeInDays)
    : 0;
  const targetCycleDays = 42;
  const cyclePercent =
    latestAge > 0 ? Math.min(100, Math.round((latestAge / targetCycleDays) * 100)) : 0;
  const daysLeft = latestAge > 0 ? Math.max(0, targetCycleDays - latestAge) : 0;

  // Estimated weight based on current day age (0 if no age)
  const estimatedWeight =
    latestAge > 0 ? (0.042 * Math.pow(latestAge, 1.08)).toFixed(2) : "0";

  // Days of feed left
  const avgDailyFeed =
    latestAge > 0 && feedConsumed > 0
      ? Math.max(1, Math.round(feedConsumed / latestAge))
      : 0;
  const daysOfFeedLeft = avgDailyFeed > 0 ? (feedBags / avgDailyFeed).toFixed(1) : "0";

  // Flock FCR
  const totalWeightKg = aliveBirds * Number(estimatedWeight);
  const totalFeedKg = feedConsumed * 50;
  const calculatedFcr =
    totalWeightKg > 0 && totalFeedKg > 0 ? (totalFeedKg / totalWeightKg).toFixed(2) : "0";

  const summaryCards = [
    {
      title: "Alive Birds",
      value: aliveBirds.toLocaleString(),
      subtitle: survivalRate,
      icon: "feather",
      iconColor: "#16a34a",
      unit: "",
    },
    {
      title: "Mortality",
      value: mortality.toLocaleString(),
      subtitle: mortalityRate,
      icon: "alert-circle",
      iconColor: mortality > 0 ? "#dc2626" : theme.colors.textMuted,
      unit: "",
    },
    {
      title: "Feed Consumed",
      value: feedConsume.toLocaleString(),
      subtitle: `${(feedConsume * 50).toLocaleString()} kg`,
      icon: "shopping-bag",
      iconColor: "#d97706",
      unit: "bags",
    },
    {
      title: "Feed In Stock",
      value: feedBags.toLocaleString(),
      subtitle: avgDailyFeed > 0 ? `~${daysOfFeedLeft}d left` : "Storage",
      icon: "archive",
      iconColor: "#2563eb",
      // badge: feedBags < 10 && aliveBirds > 0 ? "Reorder" : null,
      unit: "bags",
    },
  ];

  const formatDate = (rawDate: string) => {
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return rawDate;
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return rawDate;
    }
  };

  return (
    <View style={styles.safeArea}>
      {/* Top App Bar */}
      <AppHeader
        title="Daily Poultry"
        onNotificationsPress={() => setIsNotificationsOpen(true)}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primaryMedium]}
            tintColor={theme.colors.primaryMedium}
          />
        }>
        {(isLoadingTelemetry || isLoadingRecords) && !telemetry && !recordsList.length && !refreshing ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* Active Batch Hero Card */}
            <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View>
              <View style={styles.batchTitleRow}>
                <Text style={styles.batchTitle}>
                  {hasBatch ? `Batch #${telemetry?.activeBatchId}` : "No Batch"}
                </Text>
                {hasBatch && (
                  <View style={styles.breedPill}>
                    <Text style={styles.breedPillText}>Broiler</Text>
                  </View>
                )}
              </View>
              <Text style={styles.batchSubtitle}>
                {hasBatch
                  ? `Active cycle · ${aliveBirds.toLocaleString()} birds alive`
                  : "No active flock cycle"}
              </Text>
              {!hasBatch && (
                <TouchableOpacity
                  onPress={() => (navigation as any).navigate('Inventories')}
                  style={styles.startBatchBtn}>
                  <Feather name="plus-circle" size={14} color={theme.colors.primary} />
                  <Text style={styles.startBatchBtnText}>Start New Batch</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.dayPill}>
              <Text style={styles.dayPillBold}>
                Day {latestAge}{" "}
                <Text style={styles.dayPillMuted}>/ {targetCycleDays}</Text>
              </Text>
            </View>
          </View>

          {/* Segmented Lifecycle Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>CYCLE PROGRESS</Text>
              <Text style={styles.progressPercent}>{cyclePercent}%</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${cyclePercent}%` }]} />
            </View>
            {/* Industrial Phase Track */}
            <View style={styles.phaseTrack}>
              <View style={[styles.phaseBlock, { flex: 7 }]}>
                <Text style={styles.phaseText}>Brood (1-7d)</Text>
              </View>
              <View style={[styles.phaseBlock, { flex: 21 }]}>
                <Text style={[styles.phaseText, { textAlign: "center" }]}>
                  Grower (8-28d)
                </Text>
              </View>
              <View style={[styles.phaseBlock, { flex: 14 }]}>
                <Text style={[styles.phaseText, { textAlign: "right" }]}>
                  Finisher (29-42d)
                </Text>
              </View>
            </View>
            <View style={styles.progressFooterRow}>
              <View style={styles.timeRemainingRow}>
                <Feather name="clock" size={12} color={theme.colors.textMuted} />
                <Text style={styles.timeRemainingText}>
                  {daysLeft} days until target harvest
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 2x2 Key Metrics Grid - Summary Cards */}
        <View style={styles.grid}>
          {summaryCards.map((card, idx) => (
            <View
              key={idx}
              style={[styles.card, { borderLeftWidth: 3, borderLeftColor: card.iconColor }]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardLabel}>{card.title.toUpperCase()}</Text>
              </View>
              <View style={styles.unitRow}>
                <Text style={styles.cardValue}>{card.value}</Text>
                {!!card.unit && <Text style={styles.unitText}>{card.unit}</Text>}
              </View>
              <View style={styles.cardSubtitleRowBetween}>
                <Text
                  style={[
                    styles.subtext,
                    card.title === "Mortality" &&
                      mortality > 0 && { color: "#dc2626", fontWeight: "600" },
                    card.title === "Alive Birds" && {
                      color: "#16a34a",
                      fontWeight: "600",
                    },
                  ]}>
                  {card.subtitle}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Recent Daily Logs Table */}
        <View style={styles.tableCard}>
          <View style={styles.tableCardHeader}>
            <Text style={styles.tableCardTitle}>Recent Daily Logs</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{recordsList.length} Records</Text>
            </View>
          </View>

          {/* Loading Indicator */}
          {isLoadingRecords && !refreshing ? (
            <TableRowsSkeleton rows={5} columns={4} />
          ) : recordsList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="edit-calendar" size={40} color={theme.colors.cardBorder} />
              <Text style={styles.emptyTitle}>No daily logs recorded</Text>
              <Text style={styles.emptySub}>
                Daily farm logs will appear here once added.
              </Text>
            </View>
          ) : (
            <View>
              {/* Table Headers */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { flex: 1.2 }]}>DATE</Text>
                <Text style={[styles.th, { flex: 1.4, textAlign: "center" }]}>AGE</Text>
                <Text style={[styles.th, { flex: 1.6, textAlign: "center" }]}>FEED</Text>
                <Text style={[styles.th, { flex: 1.2, textAlign: "right" }]}>
                  MORTALITY
                </Text>
              </View>

              {/* Table Rows */}
              {recordsList.map((log: any, idx: number) => {
                const mort = Number(log.mortalityCount) || 0;

                return (
                  <TouchableOpacity
                    key={log.id || idx}
                    style={[
                      styles.tableRow,
                      idx === recordsList.length - 1 && { borderBottomWidth: 0 },
                    ]}
                    onPress={() => setSelectedRecord(log)}
                    activeOpacity={0.7}>
                    <View style={{ flex: 1.2 }}>
                      <Text style={styles.tdPrimary}>{formatDate(log.date)}</Text>
                    </View>
                    <Text style={[styles.tdValue, { flex: 1.4, textAlign: "center" }]}>
                      {log.birdAgeInDays ?? 0}
                    </Text>
                    <Text style={[styles.tdValue, { flex: 1.6, textAlign: "center" }]}>
                      {log.feedConsumedBags ?? 0}
                    </Text>
                    <Text
                      style={[
                        styles.tdValue,
                        {
                          flex: 1.2,
                          textAlign: "right",
                          color: mort > 0 ? theme.colors.rose : theme.colors.textPrimary,
                        },
                      ]}>
                      {mort}
                    </Text>

                    <Feather
                      name="chevron-right"
                      size={16}
                      color={theme.colors.textMuted}
                      style={{ marginLeft: 2 }}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
        </>
        )}
      </ScrollView>

      {/* Floating Action Button (FAB) for Instant Daily Logging */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsAddOpen(true)}
        activeOpacity={0.85}>
        <Feather name="plus" size={18} color="#6bff8f" />
        <Text style={styles.fabText}>Log Day {latestAge + 1}</Text>
      </TouchableOpacity>

      {/* Add & Edit Modals */}
      <AddDailyRecordModal
        visible={isAddOpen}
        defaultAge={latestAge + 1}
        onClose={() => setIsAddOpen(false)}
        onSuccess={() => {
          refetchDailyRecords();
          refetchTelemetry();
        }}
      />

      <EditDailyRecordModal
        visible={!!selectedRecord}
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
        onSuccess={() => {
          refetchDailyRecords();
          refetchTelemetry();
        }}
      />

      {/* Farm Notifications Modal */}
      <NotificationsModal
        visible={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        feedBags={feedBags}
        aliveBirds={aliveBirds}
        mortality={mortality}
        latestAge={latestAge}
        daysLeft={daysLeft}
      />
    </View>
  );
}

const createStyles = (theme: AppTheme, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      height: 56,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      backgroundColor: theme.colors.headerBg,
      borderBottomWidth: 0,
    },
    headerBrand: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    logoBadge: {
      width: 42,
      height: 42,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 0,
      backgroundColor: "transparent",
    },
    brandLogoImage: {
      width: 60,
      height: 60,
    },
    brandRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    brandTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: "#ffffff",
    },
    farmPill: {
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 9999,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.25)",
    },
    farmPillText: {
      fontSize: 10,
      fontWeight: "600",
      color: "#6bff8f",
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    headerAddBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "#6bff8f",
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 8,
    },
    headerAddBtnText: {
      color: "#004c22",
      fontSize: 11,
      fontWeight: "800",
    },
    iconButton: {
      position: "relative",
      padding: 6,
      borderRadius: 9999,
      backgroundColor: "rgba(255, 255, 255, 0.15)",
    },
    notificationDot: {
      position: "absolute",
      top: 6,
      right: 6,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.amber,
      borderWidth: 1.5,
      borderColor: "#fff",
    },
    profileAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.primaryMedium,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "700",
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 32,
      gap: 14,
    },
    heroCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
    heroHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    batchTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    batchTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: theme.colors.textPrimary,
      letterSpacing: -0.5,
    },
    breedPill: {
      backgroundColor: theme.colors.surfaceSubtle,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: StyleSheet.hairlineWidth || 1,
      borderColor: theme.colors.cardBorder,
    },
    breedPillText: {
      fontSize: 10,
      fontWeight: "700",
      color: theme.colors.textSecondary,
      letterSpacing: 0.3,
    },
    batchSubtitle: {
      fontSize: 12,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    dayPill: {
      backgroundColor: theme.colors.primaryLight,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 9999,
      borderWidth: 1,
      borderColor: theme.colors.primaryBorder,
    },
    dayPillBold: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.colors.primary,
    },
    dayPillMuted: {
      color: theme.colors.primaryMedium,
      fontWeight: "400",
    },
    progressContainer: {
      marginTop: 16,
    },
    progressLabelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    progressLabel: {
      fontSize: 10,
      color: theme.colors.textMuted,
      fontWeight: "700",
      letterSpacing: 0.8,
    },
    progressPercent: {
      fontSize: 12,
      fontWeight: "800",
      color: theme.colors.textPrimary,
      fontVariant: ["tabular-nums"],
    },
    progressBarTrack: {
      height: 8,
      backgroundColor: theme.colors.surfaceSubtle,
      borderRadius: 9999,
      overflow: "hidden",
    },
    progressBarFill: {
      height: "100%",
      backgroundColor: theme.colors.primary,
      borderRadius: 9999,
    },
    phaseTrack: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 6,
    },
    phaseBlock: {},
    phaseText: {
      fontSize: 9,
      fontWeight: "600",
      color: theme.colors.textMuted,
      letterSpacing: 0.2,
    },
    progressFooterRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 6,
    },
    timeRemainingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    timeRemainingText: {
      fontSize: 11,
      color: theme.colors.textMuted,
      fontWeight: "500",
    },
    startBatchBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginTop: 8,
      alignSelf: "flex-start",
      backgroundColor: theme.colors.primaryLight,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.primaryBorder,
    },
    startBatchBtnText: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.colors.primary,
    },
    livabilityRow: {
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.surfaceBorder,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    livabilityLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    livabilityLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: "600",
    },
    livabilityValueRow: {
      alignItems: "flex-end",
    },
    livabilityValue: {
      fontSize: 14,
      fontWeight: "800",
      color: theme.colors.textPrimary,
      fontVariant: ["tabular-nums"],
    },
    benchmarkDelta: {
      fontSize: 10,
      fontWeight: "600",
      color: "#059669",
      marginTop: 1,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    card: {
      width: "48%",
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: 14,
      borderWidth: StyleSheet.hairlineWidth || 1,
      borderColor: theme.colors.cardBorder,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.03,
      shadowRadius: 4,
      elevation: 1,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    cardLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: theme.colors.textMuted,
      letterSpacing: 0.8,
    },
    cardValue: {
      fontSize: 22,
      fontWeight: "800",
      color: theme.colors.textPrimary,
      marginTop: 6,
      letterSpacing: -0.5,
      fontVariant: ["tabular-nums"],
    },
    unitRow: {
      flexDirection: "row",
      alignItems: "baseline",
    },
    unitText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.textMuted,
      marginLeft: 3,
    },
    cardSubtitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 4,
    },
    cardSubtitleRowBetween: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 4,
    },
    lossText: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.colors.rose,
      fontVariant: ["tabular-nums"],
    },
    dotSeparator: {
      color: theme.colors.cardBorder,
      fontSize: 10,
    },
    subtext: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      fontWeight: "500",
    },
    reorderBadge: {
      backgroundColor: theme.colors.amberLight,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: theme.colors.amberBorder,
    },
    reorderText: {
      fontSize: 9,
      fontWeight: "700",
      color: theme.colors.amber,
    },
    benchmarksCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderWidth: StyleSheet.hairlineWidth || 1,
      borderColor: theme.colors.cardBorder,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.03,
      shadowRadius: 4,
      elevation: 1,
    },
    benchmarkItem: {
      flex: 1,
    },
    benchmarkHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 4,
    },
    benchmarkLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: theme.colors.textMuted,
      letterSpacing: 0.8,
    },
    benchmarkValueRow: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 4,
    },
    benchmarkValue: {
      fontSize: 18,
      fontWeight: "800",
      color: theme.colors.textPrimary,
      letterSpacing: -0.5,
      fontVariant: ["tabular-nums"],
    },
    benchmarkUnit: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.colors.textMuted,
    },
    benchmarkSubtext: {
      fontSize: 11,
      fontWeight: "500",
      color: theme.colors.textSecondary,
      marginLeft: 2,
    },
    benchmarkDivider: {
      width: 1,
      height: 32,
      backgroundColor: theme.colors.cardBorder,
      marginHorizontal: 12,
    },
    tableCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      overflow: "hidden",
    },
    tableCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceBorder,
    },
    tableCardTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.colors.textPrimary,
    },
    countBadge: {
      backgroundColor: theme.colors.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 9999,
      borderWidth: 1,
      borderColor: theme.colors.primaryBorder,
    },
    countBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      color: theme.colors.primary,
    },
    tableHeaderRow: {
      flexDirection: "row",
      backgroundColor: theme.colors.surfaceSubtle,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceBorder,
    },
    th: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.colors.textMuted,
      letterSpacing: 0.4,
    },
    tableRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceBorder,
    },
    tdPrimary: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.colors.textPrimary,
    },
    tdSub: {
      fontSize: 11,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    tdValue: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.colors.textPrimary,
    },
    loadingContainer: {
      padding: 32,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    loadingText: {
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    emptyContainer: {
      padding: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.textPrimary,
      marginTop: 8,
    },
    emptySub: {
      fontSize: 12,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    fab: {
      position: "absolute",
      bottom: 18,
      right: 18,
      backgroundColor: theme.colors.headerBg,
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 9999,
      borderWidth: 1,
      borderColor: theme.colors.headerBorder,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
      zIndex: 99,
    },
    fabText: {
      color: "#ffffff",
      fontSize: 13,
      fontWeight: "800",
      letterSpacing: 0.2,
    },
  });
