import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { AppTheme } from "../constants/theme";
import { useAppTheme } from "../context/ThemeContext";
import { stockOutService } from "../api/services";
import AppHeader from "../components/common/AppHeader";
import { StockOutSkeleton, TableRowsSkeleton } from "../components/common/Skeleton";
import StockOutSessionModal from "../components/modals/StockOutSessionModal";
import StockOutDetailModal from "../components/modals/StockOutDetailModal";

export default function StockOutScreen() {
  const { theme, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const [isSessionOpen, setIsSessionOpen] = useState(false);
  const [selectedMaster, setSelectedMaster] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["stockoutMasters"],
    queryFn: stockOutService.getMasters,
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const mastersList = Array.isArray(data) ? data.filter((m) => !m.isDeleted) : [];

  // Summary calculations strictly dynamic - 0 if empty
  const totalDispatches = mastersList.length;
  const totalBirdsSold = mastersList.reduce(
    (sum, m) => sum + (Number(m.totalBirds) || 0),
    0,
  );
  const totalWeightKg = mastersList.reduce(
    (sum, m) => sum + (Number(m.totalWeight) || 0),
    0,
  );
  const overallAvgWeight =
    totalBirdsSold > 0 ? (totalWeightKg / totalBirdsSold).toFixed(2) : "0";

  const formatDate = (rawDate: string) => {
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return rawDate;
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return rawDate;
    }
  };

  return (
    <View style={styles.safeArea}>
      {/* Top Header */}
      <AppHeader title="Live Harvest & Stock Out" />

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
        {isLoading && !mastersList.length && !refreshing ? (
          <StockOutSkeleton />
        ) : (
          <>
            {/* Metric Cards Grid - Strictly 0 if no data */}
            <View style={styles.grid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>SESSIONS</Text>
            <Text style={styles.metricValue}>{totalDispatches}</Text>
            <Text style={styles.metricSub}>{mastersList.filter(m => Number(m.totalBirds) > 0).length} finalized</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>BIRDS SOLD</Text>
            <Text style={styles.metricValue}>{totalBirdsSold.toLocaleString()}</Text>
            <Text style={styles.metricSub}>Harvest count</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>TOTAL WEIGHT</Text>
            <Text style={styles.metricValue}>{totalWeightKg.toLocaleString()} kg</Text>
            <Text style={styles.metricSub}>Gross net meat</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>AVG WEIGHT</Text>
            <Text style={styles.metricValue}>{overallAvgWeight} kg</Text>
            <Text style={styles.metricSub}>Per harvested bird</Text>
          </View>
        </View>

        {/* Dispatches Table */}
        <View style={styles.tableCard}>
          <View style={styles.tableCardHeader}>
            <Text style={styles.tableCardTitle}>Dispatch History</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{mastersList.length} Dispatches</Text>
            </View>
          </View>

          {isLoading && !refreshing ? (
            <TableRowsSkeleton rows={4} columns={4} />
          ) : mastersList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="local-shipping" size={40} color={theme.colors.cardBorder} />
              <Text style={styles.emptyTitle}>No harvest dispatches found</Text>
              <Text style={styles.emptySub}>
                Dispatched truck loads will show here once logged.
              </Text>
            </View>
          ) : (
            <View>
              {/* Table Header */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { flex: 2 }]}>DISPATCH #</Text>
                <Text style={[styles.th, { flex: 1.5, textAlign: "center" }]}>BIRDS</Text>
                <Text style={[styles.th, { flex: 1.5, textAlign: "center" }]}>
                  WEIGHT
                </Text>
                <Text style={[styles.th, { flex: 1.5, textAlign: "right" }]}>AVG WT</Text>
              </View>

              {mastersList.map((item: any, idx: number) => (
                <TouchableOpacity
                  key={item.id || idx}
                  style={[
                    styles.tableRow,
                    idx === mastersList.length - 1 && { borderBottomWidth: 0 },
                  ]}
                  onPress={() => {
                    setSelectedMaster(item);
                    setIsDetailOpen(true);
                  }}
                  activeOpacity={0.7}>
                  <View style={{ flex: 2 }}>
                    <Text style={styles.tdPrimary}>
                      Load #{item.stockOutNo || item.id}
                    </Text>
                    <Text style={styles.tdSub}>{formatDate(item.date)}</Text>
                    <View style={Number(item.totalBirds) > 0 ? styles.statusBadgeFinalized : styles.statusBadgeOpen}>
                      <Text style={Number(item.totalBirds) > 0 ? styles.statusTextFinalized : styles.statusTextOpen}>
                        {Number(item.totalBirds) > 0 ? "Finalized" : "Open"}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.tdValue, { flex: 1.4, textAlign: "center" }]}>
                    {Number(item.totalBirds) > 0 ? Number(item.totalBirds).toLocaleString() : "—"}
                  </Text>
                  <Text
                    style={[
                      styles.tdValue,
                      { flex: 1.4, textAlign: "center", color: theme.colors.primary },
                    ]}>
                    {Number(item.totalWeight) > 0 ? `${Number(item.totalWeight).toLocaleString()} kg` : "—"}
                  </Text>
                  <Text
                    style={[
                      styles.tdValue,
                      {
                        flex: 1.4,
                        textAlign: "right",
                        color: theme.colors.primaryMedium,
                      },
                    ]}>
                    {Number(item.avgWeight) > 0 ? `${item.avgWeight} kg` : "—"}
                  </Text>
                  <Feather
                    name="chevron-right"
                    size={16}
                    color={theme.colors.textMuted}
                    style={{ marginLeft: 2 }}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        </>
        )}
      </ScrollView>

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsSessionOpen(true)}
        activeOpacity={0.85}>
        <Feather name="plus" size={18} color="#6bff8f" />
        <Text style={styles.fabText}>Start Live Dispatch</Text>
      </TouchableOpacity>

      <StockOutSessionModal
        visible={isSessionOpen}
        onClose={() => setIsSessionOpen(false)}
        onSuccess={() => refetch()}
      />

      <StockOutDetailModal
        visible={isDetailOpen}
        record={selectedMaster}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedMaster(null);
        }}
        onSuccess={() => refetch()}
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
    headerTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
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
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    headerLogo: {
      width: 42,
      height: 42,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: "#ffffff",
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 90,
      gap: 14,
    },
    grid: {
      flexDirection: "row",
      gap: 12,
    },
    metricCard: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      padding: 14,
      borderRadius: theme.borderRadius.lg,
      borderWidth: StyleSheet.hairlineWidth || 1,
      borderColor: theme.colors.cardBorder,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.03,
      shadowRadius: 3,
      elevation: 1,
    },
    metricLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: theme.colors.textMuted,
      letterSpacing: 0.8,
      marginBottom: 4,
    },
    metricValue: {
      fontSize: 20,
      fontWeight: "800",
      color: theme.colors.textPrimary,
      fontVariant: ["tabular-nums"],
    },
    metricSub: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginTop: 2,
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
    addDispatchBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: theme.borderRadius.sm,
    },
    addDispatchBtnText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "700",
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
    statusBadgeFinalized: {
      marginTop: 4,
      alignSelf: "flex-start",
      backgroundColor: "#dcfce7",
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: "#bbf7d0",
    },
    statusBadgeOpen: {
      marginTop: 4,
      alignSelf: "flex-start",
      backgroundColor: "#fef3c7",
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: "#fde68a",
    },
    statusTextFinalized: {
      fontSize: 9,
      fontWeight: "700",
      color: "#166534",
    },
    statusTextOpen: {
      fontSize: 9,
      fontWeight: "700",
      color: "#92400e",
    },
  });
