import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { AppTheme } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";
import { stockOutService } from "../../api/services";

interface StockOutDetailModalProps {
  visible: boolean;
  record: any | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function StockOutDetailModal({
  visible,
  record,
  onClose,
  onSuccess,
}: StockOutDetailModalProps) {
  const { theme, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Editable fields
  const [stockOutNo, setStockOutNo] = useState("");
  const [batchNo, setBatchNo] = useState("");
  const [totalBirds, setTotalBirds] = useState("");
  const [totalWeight, setTotalWeight] = useState("");
  const [avgWeight, setAvgWeight] = useState("");

  const masterId = record?.id;
  // New crate entry input state
  const [crateBirds, setCrateBirds] = useState("");
  const [crateWeight, setCrateWeight] = useState("");
  const [isAddingCrate, setIsAddingCrate] = useState(false);

  const {
    data: entriesData,
    isLoading: isLoadingEntries,
    refetch: refetchEntries,
  } = useQuery({
    queryKey: ["stockoutEntries", masterId],
    queryFn: async () => {
      try {
        const res = await stockOutService.getEntries(masterId);
        if (Array.isArray(res) && res.length > 0) return res;
        if (Array.isArray((res as any)?.entries) && (res as any).entries.length > 0) {
          return (res as any).entries;
        }
      } catch (e) {}

      try {
        const masterRes = await stockOutService.getMasterById(masterId);
        if (masterRes?.entries && Array.isArray(masterRes.entries)) {
          return masterRes.entries;
        }
      } catch (e) {}

      return [];
    },
    enabled: visible && !!masterId,
  });

  useEffect(() => {
    if (record) {
      setIsEditing(false);
      setStockOutNo(String(record.stockOutNo || record.id || ""));
      setBatchNo(String(record.batchId || record.batchNo || ""));
      setTotalBirds(String(record.totalBirds ?? ""));
      setTotalWeight(String(record.totalWeight ?? ""));
      setAvgWeight(String(record.avgWeight ?? ""));
    }
  }, [record, visible]);

  if (!record) return null;

  const entriesList = Array.isArray(entriesData)
    ? entriesData
    : Array.isArray((entriesData as any)?.entries)
      ? (entriesData as any).entries
      : Array.isArray(record.entries)
        ? record.entries
        : [];

  const formatDate = (rawDate: string) => {
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return rawDate;
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return rawDate;
    }
  };

  const handleUpdate = async () => {
    if (!record?.id) return;
    setSubmitting(true);
    try {
      const birds = Number(totalBirds) || 0;
      const weight = Number(totalWeight) || 0;
      const avg =
        birds > 0 ? Number((weight / birds).toFixed(2)) : Number(avgWeight) || 0;

      const payload = {
        date: record.date || new Date().toISOString(),
        batchId: Number(batchNo) || record.batchId,
        stockOutNo: Number(stockOutNo) || record.stockOutNo,
        totalBirds: birds,
        totalWeight: weight,
        avgWeight: avg,
      };

      await stockOutService.updateMaster(record.id, payload);
      Alert.alert("Updated", "Dispatch session updated successfully.");
      setIsEditing(false);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      const msg =
        err.response?.data?.message || err.message || "Failed to update dispatch.";
      Alert.alert("Update Failed", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!record?.id) return;
    Alert.alert(
      "Delete Dispatch Record",
      "Are you sure you want to delete this harvest dispatch session?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await stockOutService.deleteMaster(record.id);
              Alert.alert("Deleted", "Dispatch record deleted successfully.");
              onSuccess?.();
              onClose();
            } catch (err: any) {
              const msg =
                err.response?.data?.message ||
                err.message ||
                "Failed to delete dispatch.";
              Alert.alert("Error", msg);
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  const handleDeleteEntry = (entryId: number | string, crateNo: number) => {
    Alert.alert("Delete Crate Log", `Remove Crate #${crateNo} weighment entry?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await stockOutService.deleteEntry(entryId);
            refetchEntries();
            onSuccess?.();
          } catch (err: any) {
            const msg =
              err.response?.data?.message || err.message || "Failed to remove crate.";
            Alert.alert("Error", msg);
          }
        },
      },
    ]);
  };

  const handleAddCrate = async () => {
    if (!masterId) return;
    const b = Number(crateBirds);
    const w = Number(crateWeight);
    if (b <= 0 || w <= 0) {
      Alert.alert("Required", "Please enter valid bird count and weight (kg).");
      return;
    }
    setIsAddingCrate(true);
    try {
      await stockOutService.createEntry({
        stockOutMasterId: Number(masterId),
        birds: b,
        weight: w,
      });
      setCrateBirds("");
      setCrateWeight("");
      await refetchEntries();
      onSuccess?.();
    } catch (err: any) {
      const msg =
        err.response?.data?.message || err.message || "Failed to add crate entry.";
      Alert.alert("Error", msg);
    } finally {
      setIsAddingCrate(false);
    }
  };

  const currentBirds = Number(record.totalBirds || 0);
  const currentWeight = Number(record.totalWeight || 0);
  const currentAvgWeight =
    record.avgWeight !== undefined
      ? Number(record.avgWeight)
      : currentBirds > 0
        ? Number((currentWeight / currentBirds).toFixed(2))
        : 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Bottom Sheet Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.iconBadge}>
                <MaterialIcons
                  name="local-shipping"
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>
                  {isEditing
                    ? "Edit Dispatch Load"
                    : `Dispatch Load #${record.stockOutNo || record.id}`}
                </Text>
                <Text style={styles.subtitle}>
                  Batch #{record.batchId || record.batchNo || "-"} •{" "}
                  {formatDate(record.date)}
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleDelete}
                style={[styles.actionBtn, styles.deleteActionBtn]}
                disabled={submitting || deleting}
                activeOpacity={0.7}>
                {deleting ? (
                  <ActivityIndicator size="small" color={theme.colors.rose} />
                ) : (
                  <Feather name="trash-2" size={15} color={theme.colors.rose} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsEditing(!isEditing)}
                style={[styles.actionBtn, isEditing && styles.actionBtnActive]}
                activeOpacity={0.7}>
                <Feather
                  name={isEditing ? "eye" : "edit-2"}
                  size={16}
                  color={isEditing ? "#ffffff" : theme.colors.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                activeOpacity={0.7}>
                <Feather name="x" size={20} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
            {isEditing ? (
              /* ================= EDIT MODE ================= */
              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Dispatch / Load Number</Text>
                  <TextInput
                    style={styles.input}
                    value={stockOutNo}
                    onChangeText={setStockOutNo}
                    placeholder="Load number"
                    keyboardType="numeric"
                    placeholderTextColor={theme.colors.textMuted}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Batch Number</Text>
                  <TextInput
                    style={styles.input}
                    value={batchNo}
                    onChangeText={setBatchNo}
                    placeholder="Batch ID"
                    keyboardType="numeric"
                    placeholderTextColor={theme.colors.textMuted}
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Total Birds Sold</Text>
                    <TextInput
                      style={styles.input}
                      value={totalBirds}
                      onChangeText={(val) => {
                        setTotalBirds(val);
                        const b = Number(val) || 0;
                        const w = Number(totalWeight) || 0;
                        if (b > 0 && w > 0) setAvgWeight((w / b).toFixed(2));
                      }}
                      placeholder="e.g. 500"
                      keyboardType="numeric"
                      placeholderTextColor={theme.colors.textMuted}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Total Weight (kg)</Text>
                    <TextInput
                      style={styles.input}
                      value={totalWeight}
                      onChangeText={(val) => {
                        setTotalWeight(val);
                        const b = Number(totalBirds) || 0;
                        const w = Number(val) || 0;
                        if (b > 0 && w > 0) setAvgWeight((w / b).toFixed(2));
                      }}
                      placeholder="e.g. 1100"
                      keyboardType="numeric"
                      placeholderTextColor={theme.colors.textMuted}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Average Weight per Bird (kg)</Text>
                  <TextInput
                    style={styles.input}
                    value={avgWeight}
                    onChangeText={setAvgWeight}
                    placeholder="Auto or manual avg weight"
                    keyboardType="numeric"
                    placeholderTextColor={theme.colors.textMuted}
                  />
                </View>

                {/* Edit Action Buttons */}
                <View style={styles.buttonStack}>
                  <TouchableOpacity
                    style={[styles.primaryBtn, submitting && styles.btnDisabled]}
                    onPress={handleUpdate}
                    disabled={submitting || deleting}
                    activeOpacity={0.8}>
                    {submitting ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Feather name="check" size={16} color="#ffffff" />
                        <Text style={styles.primaryBtnText}>Save Dispatch</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <View style={styles.editSecondaryRow}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => setIsEditing(false)}
                      disabled={submitting || deleting}
                      activeOpacity={0.7}>
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={handleDelete}
                      disabled={submitting || deleting}
                      activeOpacity={0.7}>
                      {deleting ? (
                        <ActivityIndicator size="small" color={theme.colors.rose} />
                      ) : (
                        <>
                          <Feather name="trash-2" size={15} color={theme.colors.rose} />
                          <Text style={styles.deleteBtnText}>Delete</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              /* ================= VIEW MODE ================= */
              <>
                {/* Primary KPI Highlights */}
                <View style={styles.highlightCard}>
                  <View style={styles.statCol}>
                    <Text style={styles.statLabel}>BIRDS SOLD</Text>
                    <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                      {currentBirds.toLocaleString()}
                    </Text>
                    <Text style={styles.statSub}>Harvest count</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statCol}>
                    <Text style={styles.statLabel}>TOTAL WEIGHT</Text>
                    <Text
                      style={[styles.statValue, { color: theme.colors.primaryMedium }]}>
                      {currentWeight.toLocaleString()}{" "}
                      <Text style={styles.unitText}>kg</Text>
                    </Text>
                    <Text style={styles.statSub}>Gross meat yield</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statCol}>
                    <Text style={styles.statLabel}>AVG WEIGHT</Text>
                    <Text style={styles.statValue}>
                      {currentAvgWeight} <Text style={styles.unitText}>kg</Text>
                    </Text>
                    <Text style={styles.statSub}>Per live bird</Text>
                  </View>
                </View>

                {/* Session Metadata Card */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionHeader}>Dispatch Session Details</Text>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Dispatch / Load Number</Text>
                    <Text style={styles.detailValueBold}>
                      #{record.stockOutNo || record.id}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Assigned Batch</Text>
                    <Text style={styles.detailValueBold}>
                      Batch #{record.batchId || record.batchNo || "-"}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Dispatch Date</Text>
                    <Text style={styles.detailValue}>{formatDate(record.date)}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Weighing Crates Count</Text>
                    <Text style={styles.detailValue}>
                      {entriesList.length > 0
                        ? `${entriesList.length} weighments`
                        : "Direct Bulk"}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Load Status</Text>
                    <View style={styles.statusBadge}>
                      <View style={styles.statusDot} />
                      <Text style={styles.statusBadgeText}>Finalized & Dispatched</Text>
                    </View>
                  </View>
                </View>

                {/* Crate / Entry Weighments Breakdown */}
                <View style={styles.sectionCard}>
                  <View style={styles.entriesHeaderRow}>
                    <Text style={styles.sectionHeader}>Crate Weighment Logs</Text>
                    {isLoadingEntries && (
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                    )}
                  </View>

                  {isLoadingEntries ? (
                    <View style={styles.loadingBox}>
                      <Text style={styles.loadingText}>
                        Fetching weighment entries...
                      </Text>
                    </View>
                  ) : entriesList.length === 0 ? (
                    <View style={styles.noEntriesBox}>
                      <MaterialIcons
                        name="scale"
                        size={28}
                        color={theme.colors.textMuted}
                      />
                      <Text style={styles.noEntriesText}>
                        No individual crate weighment entries attached.
                      </Text>
                      <Text style={styles.noEntriesSub}>
                        Total summary values recorded as bulk load.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.tableBox}>
                      <View style={styles.tableHead}>
                        <Text style={[styles.th, { flex: 1.2 }]}>CRATE #</Text>
                        <Text style={[styles.th, { flex: 1.2, textAlign: "center" }]}>
                          BIRDS
                        </Text>
                        <Text style={[styles.th, { flex: 1.4, textAlign: "right" }]}>
                          NET WT (KG)
                        </Text>
                        <Text style={[styles.th, { flex: 0.6, textAlign: "center" }]}>
                          ACT
                        </Text>
                      </View>
                      {entriesList.map((entry: any, index: number) => {
                        const entryBirds = Number(entry.birds || 0);
                        const entryWeight = Number(entry.weight || 0);
                        return (
                          <View
                            key={entry.id || index}
                            style={[
                              styles.tableEntryRow,
                              index === entriesList.length - 1 && {
                                borderBottomWidth: 0,
                              },
                            ]}>
                            <Text style={[styles.tdCrate, { flex: 1.2 }]}>
                              Crate #{entry.srNo || index + 1}
                            </Text>
                            <Text
                              style={[styles.tdVal, { flex: 1.2, textAlign: "center" }]}>
                              {entryBirds} birds
                            </Text>
                            <Text
                              style={[
                                styles.tdValBold,
                                {
                                  flex: 1.4,
                                  textAlign: "right",
                                  color: theme.colors.primary,
                                },
                              ]}>
                              {entryWeight} kg
                            </Text>
                            <TouchableOpacity
                              style={[styles.entryDeleteBtn, { flex: 0.6 }]}
                              onPress={() =>
                                handleDeleteEntry(entry.id, entry.srNo || index + 1)
                              }
                              activeOpacity={0.7}>
                              <Feather
                                name="trash-2"
                                size={13}
                                color={theme.colors.rose}
                              />
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {/* Inline Add Crate Form */}
                  <View style={styles.inlineAddCrateContainer}>
                    <Text style={styles.inlineAddTitle}>Log New Crate Weighment</Text>
                    <View style={styles.inlineAddRow}>
                      <TextInput
                        style={[styles.inlineInput, { flex: 1 }]}
                        placeholder="Birds"
                        placeholderTextColor={theme.colors.textMuted}
                        value={crateBirds}
                        onChangeText={setCrateBirds}
                        keyboardType="numeric"
                      />
                      <TextInput
                        style={[styles.inlineInput, { flex: 1.2 }]}
                        placeholder="Weight (kg)"
                        placeholderTextColor={theme.colors.textMuted}
                        value={crateWeight}
                        onChangeText={setCrateWeight}
                        keyboardType="numeric"
                      />
                      <TouchableOpacity
                        style={[styles.inlineAddBtn, isAddingCrate && { opacity: 0.7 }]}
                        onPress={handleAddCrate}
                        disabled={isAddingCrate}
                        activeOpacity={0.8}>
                        {isAddingCrate ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <>
                            <Feather name="plus" size={14} color="#ffffff" />
                            <Text style={styles.inlineAddBtnText}>Add Crate</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* View Mode Footer Actions */}
                <View style={styles.footerRow}>
                  <TouchableOpacity
                    style={styles.deleteOutlineBtn}
                    onPress={handleDelete}
                    disabled={deleting}
                    activeOpacity={0.8}>
                    {deleting ? (
                      <ActivityIndicator size="small" color={theme.colors.rose} />
                    ) : (
                      <>
                        <Feather name="trash-2" size={15} color={theme.colors.rose} />
                        <Text style={styles.deleteOutlineBtnText}>Delete</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.editOutlineBtn}
                    onPress={() => setIsEditing(true)}
                    activeOpacity={0.8}>
                    <Feather name="edit-2" size={15} color={theme.colors.primary} />
                    <Text style={styles.editOutlineBtnText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.doneBtn}
                    onPress={onClose}
                    activeOpacity={0.8}>
                    <Text style={styles.doneBtnText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: AppTheme, isDark: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.55)",
      justifyContent: "flex-end",
    },
    container: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 24,
      maxHeight: "88%",
      borderTopWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    dragHandle: {
      width: 44,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.surfaceBorder,
      alignSelf: "center",
      marginBottom: 10,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceBorder,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
    iconBadge: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primaryLight,
    },
    title: {
      fontSize: 16,
      fontWeight: "800",
      color: theme.colors.textPrimary,
    },
    subtitle: {
      fontSize: 12,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    actionBtn: {
      padding: 7,
      borderRadius: 9999,
      backgroundColor: theme.colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
    },
    actionBtnActive: {
      backgroundColor: theme.colors.primary,
    },
    deleteActionBtn: {
      backgroundColor: isDark ? "rgba(239, 68, 68, 0.15)" : "#fee2e2",
    },
    deleteOutlineBtn: {
      flex: 1,
      height: 46,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.colors.rose,
      backgroundColor: isDark ? "rgba(239, 68, 68, 0.12)" : "#fef2f2",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    deleteOutlineBtnText: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.colors.rose,
    },
    closeBtn: {
      padding: 6,
      borderRadius: 9999,
      backgroundColor: theme.colors.surfaceSubtle,
    },
    scrollView: {
      maxHeight: 540,
    },
    content: {
      paddingVertical: 14,
      gap: 12,
    },
    highlightCard: {
      flexDirection: "row",
      backgroundColor: theme.colors.surfaceSubtle,
      borderRadius: theme.borderRadius.lg,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    statCol: {
      flex: 1,
      alignItems: "center",
    },
    statDivider: {
      width: 1,
      backgroundColor: theme.colors.surfaceBorder,
      marginHorizontal: 8,
    },
    statLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: theme.colors.textMuted,
      letterSpacing: 0.8,
    },
    statValue: {
      fontSize: 20,
      fontWeight: "800",
      color: theme.colors.textPrimary,
      marginTop: 4,
      fontVariant: ["tabular-nums"],
    },
    unitText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.textSecondary,
    },
    statSub: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    sectionCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      gap: 10,
    },
    entriesHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    sectionHeader: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: 2,
    },
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 3,
    },
    detailLabel: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    detailValue: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.colors.textPrimary,
      fontVariant: ["tabular-nums"],
    },
    detailValueBold: {
      fontSize: 13,
      fontWeight: "800",
      color: theme.colors.textPrimary,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: theme.colors.primaryLight,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 9999,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.primary,
    },
    statusBadgeText: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.colors.primary,
    },
    loadingBox: {
      paddingVertical: 16,
      alignItems: "center",
    },
    loadingText: {
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    noEntriesBox: {
      paddingVertical: 16,
      alignItems: "center",
      gap: 4,
    },
    noEntriesText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.textSecondary,
    },
    noEntriesSub: {
      fontSize: 11,
      color: theme.colors.textMuted,
    },
    tableBox: {
      borderWidth: 1,
      borderColor: theme.colors.surfaceBorder,
      borderRadius: theme.borderRadius.sm,
      overflow: "hidden",
    },
    tableHead: {
      flexDirection: "row",
      backgroundColor: theme.colors.surfaceSubtle,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceBorder,
    },
    th: {
      fontSize: 10,
      fontWeight: "700",
      color: theme.colors.textMuted,
      letterSpacing: 0.5,
    },
    tableEntryRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceBorder,
    },
    tdCrate: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.textPrimary,
    },
    tdVal: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    tdValBold: {
      fontSize: 12,
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
    },
    entryDeleteBtn: {
      alignItems: "center",
      justifyContent: "center",
      padding: 4,
    },
    /* Edit form styles */
    formContainer: {
      gap: 12,
    },
    inputGroup: {
      gap: 6,
    },
    inputRow: {
      flexDirection: "row",
      gap: 10,
    },
    label: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.colors.textSecondary,
    },
    input: {
      height: 44,
      backgroundColor: theme.colors.surfaceSubtle,
      borderRadius: theme.borderRadius.sm,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      paddingHorizontal: 12,
      fontSize: 14,
      color: theme.colors.textPrimary,
    },
    buttonStack: {
      marginTop: 8,
      gap: 10,
    },
    primaryBtn: {
      backgroundColor: theme.colors.primary,
      height: 48,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    primaryBtnText: {
      color: "#ffffff",
      fontSize: 14,
      fontWeight: "700",
    },
    btnDisabled: {
      opacity: 0.6,
    },
    editSecondaryRow: {
      flexDirection: "row",
      gap: 10,
    },
    cancelBtn: {
      flex: 1,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelBtnText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.colors.textSecondary,
    },
    deleteBtn: {
      flex: 1,
      height: 44,
      borderRadius: 12,
      backgroundColor: isDark ? "#2e1217" : "#fee2e2",
      borderWidth: 1,
      borderColor: isDark ? "#4c1d24" : "#fecaca",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    deleteBtnText: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.colors.rose,
    },
    footerRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 6,
    },
    editOutlineBtn: {
      flex: 1,
      height: 46,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryLight,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    editOutlineBtnText: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.colors.primary,
    },
    doneBtn: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      height: 46,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    doneBtnText: {
      color: "#ffffff",
      fontSize: 14,
      fontWeight: "700",
    },
    inlineAddCrateContainer: {
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: theme.colors.surfaceBorder,
      gap: 6,
    },
    inlineAddTitle: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    inlineAddRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    inlineInput: {
      height: 40,
      backgroundColor: theme.colors.surfaceSubtle,
      borderRadius: theme.borderRadius.sm,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      paddingHorizontal: 10,
      fontSize: 13,
      color: theme.colors.textPrimary,
    },
    inlineAddBtn: {
      backgroundColor: theme.colors.primary,
      height: 40,
      borderRadius: theme.borderRadius.sm,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    inlineAddBtnText: {
      color: "#ffffff",
      fontSize: 12,
      fontWeight: "700",
    },
  });
