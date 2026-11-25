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
import { inventoryService } from "../api/services";
import AppHeader from "../components/common/AppHeader";
import { InventoriesSkeleton, TableRowsSkeleton } from "../components/common/Skeleton";
import AddBirdInventoryModal from "../components/modals/AddBirdInventoryModal";
import AddFeedInventoryModal from "../components/modals/AddFeedInventoryModal";
import InventoryDetailModal from "../components/modals/InventoryDetailModal";

export default function InventoriesScreen() {
  const { theme, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"birds" | "feed">("birds");
  const [isBirdModalOpen, setIsBirdModalOpen] = useState(false);
  const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const {
    data: birdsData,
    isLoading: isBirdsLoading,
    refetch: refetchBirds,
  } = useQuery({
    queryKey: ["birdInventories"],
    queryFn: inventoryService.getBirdInventories,
  });

  const {
    data: feedData,
    isLoading: isFeedLoading,
    refetch: refetchFeed,
  } = useQuery({
    queryKey: ["feedInventories"],
    queryFn: inventoryService.getFeedInventories,
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchBirds(), refetchFeed()]);
    setRefreshing(false);
  };

  const birdsList = Array.isArray(birdsData) ? birdsData.filter((b) => !b.isDeleted) : [];
  const feedList = Array.isArray(feedData) ? feedData.filter((f) => !f.isDeleted) : [];

  // Summary calculations (strictly dynamic, 0 if empty)
  const totalHousedBirds = birdsList.reduce(
    (sum, b) => sum + (Number(b.housedBirdCount) || 0),
    0,
  );
  const totalBoxMortality = birdsList.reduce(
    (sum, b) => sum + (Number(b.boxMortalityCount) || 0),
    0,
  );

  const totalFeedBags = feedList.reduce(
    (sum, f) => sum + (Number(f.bagsArrivedCount) || 0),
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

  const isLoading = activeTab === "birds" ? isBirdsLoading : isFeedLoading;

  return (
    <View style={styles.safeArea}>
      {/* Top Header */}
      <AppHeader title="Inventories & Supplies" />

      {/* Sub Header Tab Switcher */}
      <View style={styles.subHeader}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "birds" && styles.tabButtonActive]}
            onPress={() => setActiveTab("birds")}>
            <MaterialIcons
              name="egg"
              size={18}
              color={
                activeTab === "birds" ? theme.colors.primary : theme.colors.textMuted
              }
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "birds" ? styles.tabTextActive : styles.tabTextInactive,
              ]}>
              Bird Arrivals ({birdsList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === "feed" && styles.tabButtonActive]}
            onPress={() => setActiveTab("feed")}>
            <MaterialIcons
              name="inventory"
              size={18}
              color={activeTab === "feed" ? theme.colors.primary : theme.colors.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "feed" ? styles.tabTextActive : styles.tabTextInactive,
              ]}>
              Feed Stock ({feedList.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

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
        {(isBirdsLoading || isFeedLoading) && !birdsList.length && !feedList.length && !refreshing ? (
          <InventoriesSkeleton />
        ) : (
          <>
            {/* Metric Summary Cards */}
            {activeTab === "birds" ? (
          <View style={styles.grid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>TOTAL HOUSED</Text>
              <Text style={styles.metricValue}>{totalHousedBirds.toLocaleString()}</Text>
              <Text style={styles.metricSub}>{birdsList.length} arrival batches</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>BOX MORTALITY</Text>
              <Text style={[styles.metricValue, { color: theme.colors.rose }]}>
                {totalBoxMortality.toLocaleString()}
              </Text>
              <Text style={styles.metricSub}>Transit loss</Text>
            </View>
          </View>
        ) : (
          <View style={styles.grid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>ARRIVED BAGS</Text>
              <Text style={styles.metricValue}>{totalFeedBags.toLocaleString()}</Text>
              <Text style={styles.metricSub}>{feedList.length} shipments logged</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>TOTAL FEED (KG)</Text>
              <Text style={styles.metricValue}>
                {(totalFeedBags * 50).toLocaleString()} kg
              </Text>
              <Text style={styles.metricSub}>50 kg/bag</Text>
            </View>
          </View>
        )}

        {/* Section List / Table */}
        <View style={styles.tableCard}>
          <View style={styles.tableCardHeader}>
            <Text style={styles.tableCardTitle}>
              {activeTab === "birds" ? "Bird Arrival Records" : "Feed Intake Shipments"}
            </Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {activeTab === "birds"
                  ? `${birdsList.length} Batches`
                  : `${feedList.length} Deliveries`}
              </Text>
            </View>
          </View>

          {isLoading && !refreshing ? (
            <TableRowsSkeleton rows={5} columns={4} />
          ) : activeTab === "birds" ? (
            birdsList.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="egg" size={40} color={theme.colors.cardBorder} />
                <Text style={styles.emptyTitle}>No bird arrivals logged</Text>
                <Text style={styles.emptySub}>
                  Arrival records will appear here once added.
                </Text>
              </View>
            ) : (
              <View>
                {/* Table Header */}
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.th, { flex: 2 }]}>DATE</Text>
                  <Text style={[styles.th, { flex: 1.5, textAlign: "center" }]}>
                    ARRIVED
                  </Text>
                  <Text style={[styles.th, { flex: 1.5, textAlign: "center" }]}>
                    HOUSED
                  </Text>
                  <Text style={[styles.th, { flex: 1, textAlign: "right" }]}>
                    TRANSIT
                  </Text>
                </View>
                {birdsList.map((item: any, idx: number) => (
                  <TouchableOpacity
                    key={item.id || idx}
                    style={[
                      styles.tableRow,
                      idx === birdsList.length - 1 && { borderBottomWidth: 0 },
                    ]}
                    onPress={() => {
                      setSelectedRecord(item);
                      setIsDetailModalOpen(true);
                    }}
                    activeOpacity={0.7}>
                    <View style={{ flex: 2 }}>
                      <Text style={styles.tdPrimary}>{formatDate(item.date)}</Text>
                      <Text style={styles.tdSub}>Batch #{item.batchId || "-"}</Text>
                    </View>
                    <Text style={[styles.tdValue, { flex: 1.4, textAlign: "center" }]}>
                      {Number(item.birdsArrivedCount || 0).toLocaleString()}
                    </Text>
                    <Text
                      style={[
                        styles.tdValue,
                        { flex: 1.4, textAlign: "center", color: theme.colors.primary },
                      ]}>
                      {Number(item.housedBirdCount || 0).toLocaleString()}
                    </Text>
                    <Text
                      style={[
                        styles.tdValue,
                        { flex: 1, textAlign: "right", color: theme.colors.rose },
                      ]}>
                      {Number(item.boxMortalityCount || 0)}
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
            )
          ) : feedList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="inventory" size={40} color={theme.colors.cardBorder} />
              <Text style={styles.emptyTitle}>No feed shipments logged</Text>
              <Text style={styles.emptySub}>
                Feed deliveries will appear here once recorded.
              </Text>
            </View>
          ) : (
            <View>
              {/* Table Header */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { flex: 2 }]}>DATE & FEED</Text>
                <Text style={[styles.th, { flex: 1.5, textAlign: "center" }]}>BAGS</Text>
                <Text style={[styles.th, { flex: 2, textAlign: "right" }]}>DRIVER</Text>
              </View>
              {feedList.map((item: any, idx: number) => (
                <TouchableOpacity
                  key={item.id || idx}
                  style={[
                    styles.tableRow,
                    idx === feedList.length - 1 && { borderBottomWidth: 0 },
                  ]}
                  onPress={() => {
                    setSelectedRecord(item);
                    setIsDetailModalOpen(true);
                  }}
                  activeOpacity={0.7}>
                  <View style={{ flex: 2 }}>
                    <Text style={styles.tdPrimary}>
                      {item.feedName || "Standard Feed"}
                    </Text>
                    <Text style={styles.tdSub}>{formatDate(item.date)}</Text>
                  </View>
                  <Text style={[styles.tdValue, { flex: 1.4, textAlign: "center" }]}>
                    {Number(item.bagsArrivedCount || 0).toLocaleString()} bags
                  </Text>
                  <View style={{ flex: 1.8, alignItems: "flex-end" }}>
                    <Text style={styles.tdDriver}>{item.driverName || "N/A"}</Text>
                    {item.driverPhoneNumber && (
                      <Text style={styles.tdSub}>{item.driverPhoneNumber}</Text>
                    )}
                  </View>

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
        onPress={() =>
          activeTab === "birds" ? setIsBirdModalOpen(true) : setIsFeedModalOpen(true)
        }
        activeOpacity={0.85}>
        <Feather name="plus" size={18} color="#6bff8f" />
        <Text style={styles.fabText}>
          {activeTab === "birds" ? "New Bird Arrival" : "New Feed Delivery"}
        </Text>
      </TouchableOpacity>

      <AddBirdInventoryModal
        visible={isBirdModalOpen}
        onClose={() => setIsBirdModalOpen(false)}
        onSuccess={() => {
          refetchBirds();
          queryClient.invalidateQueries({ queryKey: ['dashboard-telemetry'] });
          queryClient.invalidateQueries({ queryKey: ['daily-records'] });
        }}
      />

      <AddFeedInventoryModal
        visible={isFeedModalOpen}
        onClose={() => setIsFeedModalOpen(false)}
        onSuccess={() => refetchFeed()}
      />

      <InventoryDetailModal
        visible={isDetailModalOpen}
        type={activeTab}
        record={selectedRecord}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedRecord(null);
        }}
        onSuccess={() => {
          refetchBirds();
          refetchFeed();
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
    subHeader: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.cardBorder,
    },
    headerAddBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "#6bff8f",
      paddingHorizontal: 10,
      paddingVertical: 6,
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
    tabBar: {
      flexDirection: "row",
      backgroundColor: theme.colors.surfaceSubtle,
      borderRadius: theme.borderRadius.md,
      padding: 3,
    },
    tabButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 8,
      borderRadius: theme.borderRadius.sm,
    },
    tabButtonActive: {
      backgroundColor: theme.colors.surface,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    tabText: {
      fontSize: 12,
      fontWeight: "600",
    },
    tabTextActive: {
      color: theme.colors.primary,
      fontWeight: "700",
    },
    tabTextInactive: {
      color: theme.colors.textMuted,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 90,
      gap: 16,
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
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: theme.borderRadius.sm,
    },
    addButtonText: {
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
    tdDriver: {
      fontSize: 13,
      fontWeight: "600",
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
  });
