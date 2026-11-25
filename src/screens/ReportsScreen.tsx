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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppTheme } from "../constants/theme";
import { useAppTheme } from "../context/ThemeContext";
import { finalReportService } from "../api/services";
import AppHeader from "../components/common/AppHeader";
import { ReportsSkeleton, TableRowsSkeleton } from "../components/common/Skeleton";
import CreateFinalReportModal from "../components/modals/CreateFinalReportModal";
import FinalReportDetailModal from "../components/modals/FinalReportDetailModal";

export default function ReportsScreen() {
  const { theme, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["finalReports"],
    queryFn: finalReportService.getAll,
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const reportsList = Array.isArray(data) ? data.filter((r) => !r.isDeleted) : [];

  // Summary calculations strictly dynamic - 0 if empty
  const totalSettledBatches = reportsList.length;
  const totalBirdsSold = reportsList.reduce(
    (sum, r) => sum + (Number(r.totalSoldBirds) || 0),
    0,
  );
  const totalRearingCharges = reportsList.reduce(
    (sum, r) => sum + (Number(r.totalRearingCharges) || 0),
    0,
  );
  const totalAmountPayable = reportsList.reduce(
    (sum, r) => sum + (Number(r.totalAmountPayable) || 0),
    0,
  );

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
      <AppHeader title="Batch Settlements & Reports" />

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
        {isLoading && !reportsList.length && !refreshing ? (
          <ReportsSkeleton />
        ) : (
          <>
            {/* Metric Cards Grid - Strictly 0 if no data */}
            <View style={styles.grid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>SETTLED BATCHES</Text>
            <Text style={styles.metricValue}>{totalSettledBatches}</Text>
            <Text style={styles.metricSub}>Completed cycles</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>TOTAL SOLD BIRDS</Text>
            <Text style={styles.metricValue}>{totalBirdsSold.toLocaleString()}</Text>
            <Text style={styles.metricSub}>Harvest volume</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>REARING CHARGES</Text>
            <Text style={styles.metricValue}>
              ₹{Math.round(totalRearingCharges).toLocaleString()}
            </Text>
            <Text style={styles.metricSub}>Grower compensation</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>NET PAYABLE</Text>
            <Text style={[styles.metricValue, { color: theme.colors.primary }]}>
              ₹{Math.round(totalAmountPayable).toLocaleString()}
            </Text>
            <Text style={styles.metricSub}>Disbursed payout</Text>
          </View>
        </View>

        {/* Reports Table */}
        <View style={styles.tableCard}>
          <View style={styles.tableCardHeader}>
            <Text style={styles.tableCardTitle}>Settlement Statements</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{reportsList.length} Statements</Text>
            </View>
          </View>

          {isLoading && !refreshing ? (
            <TableRowsSkeleton rows={4} columns={4} />
          ) : reportsList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="assessment" size={40} color={theme.colors.cardBorder} />
              <Text style={styles.emptyTitle}>No settlement reports found</Text>
              <Text style={styles.emptySub}>
                Final batch settlements will appear here when closed.
              </Text>
              <TouchableOpacity
                style={styles.emptyCtaBtn}
                onPress={() => setIsReportOpen(true)}>
                <Feather name="plus-circle" size={14} color={theme.colors.primary} />
                <Text style={styles.emptyCtaBtnText}>Create Settlement</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {/* Table Header */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { flex: 2 }]}>BATCH & DATE</Text>
                <Text style={[styles.th, { flex: 1.5, textAlign: "center" }]}>BIRDS</Text>
                <Text style={[styles.th, { flex: 1.5, textAlign: "center" }]}>
                  AVG WT
                </Text>
                <Text style={[styles.th, { flex: 2, textAlign: "right" }]}>
                  NET PAYABLE
                </Text>
              </View>

              {reportsList.map((item: any, idx: number) => (
                <TouchableOpacity
                  key={item.id || idx}
                  style={[
                    styles.tableRow,
                    idx === reportsList.length - 1 && { borderBottomWidth: 0 },
                  ]}
                  onPress={() => {
                    setSelectedReport(item);
                    setIsDetailOpen(true);
                  }}
                  activeOpacity={0.7}>
                  <View style={{ flex: 2 }}>
                    <Text style={styles.tdPrimary}>Batch #{item.batchId}</Text>
                    <Text style={styles.tdSub}>
                      {item.startDate ? formatDate(item.startDate) : "—"} → {formatDate(item.endDate || item.startDate)}
                    </Text>
                  </View>
                  <Text style={[styles.tdValue, { flex: 1.4, textAlign: "center" }]}>
                    {Number(item.totalSoldBirds || 0).toLocaleString()}
                  </Text>
                  <Text
                    style={[
                      styles.tdValue,
                      {
                        flex: 1.4,
                        textAlign: "center",
                        color: theme.colors.primaryMedium,
                      },
                    ]}>
                    {item.avgBodyWeight || "0"} kg
                  </Text>
                  <Text
                    style={[
                      styles.tdValue,
                      { flex: 1.8, textAlign: "right", color: theme.colors.primary },
                    ]}>
                    ₹{Math.round(Number(item.totalAmountPayable || 0)).toLocaleString()}
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
        onPress={() => setIsReportOpen(true)}
        activeOpacity={0.85}>
        <Feather name="plus" size={18} color="#6bff8f" />
        <Text style={styles.fabText}>Final Settlement</Text>
      </TouchableOpacity>

      <CreateFinalReportModal
        visible={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        onSuccess={() => {
          refetch();
          queryClient.invalidateQueries();
        }}
      />

      <FinalReportDetailModal
        visible={isDetailOpen}
        record={selectedReport}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedReport(null);
        }}
        onSuccess={() => {
          refetch();
          queryClient.invalidateQueries();
        }}
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
    addSettlementBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: theme.borderRadius.sm,
    },
    addSettlementBtnText: {
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
    emptyCtaBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 14,
      backgroundColor: theme.colors.primaryLight,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: theme.colors.primaryBorder,
    },
    emptyCtaBtnText: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.colors.primary,
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
  });
