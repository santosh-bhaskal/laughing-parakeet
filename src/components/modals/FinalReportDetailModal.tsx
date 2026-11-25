import React, { useState, useEffect, useMemo } from 'react';
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
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { AppTheme } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';
import { finalReportService } from '../../api/services';

interface FinalReportDetailModalProps {
  visible: boolean;
  record: any | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function FinalReportDetailModal({
  visible,
  record,
  onClose,
  onSuccess,
}: FinalReportDetailModalProps) {
  const { theme, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Editable fields
  const [birdRate, setBirdRate] = useState('');
  const [feedRate, setFeedRate] = useState('');
  const [medicineCost, setMedicineCost] = useState('');
  const [adminCost, setAdminCost] = useState('');
  const [stdCostPerKg, setStdCostPerKg] = useState('');
  const [totalRearingCharges, setTotalRearingCharges] = useState('');
  const [totalAmountPayable, setTotalAmountPayable] = useState('');

  const reportId = record?.id;

  const { data: fullReportData, isLoading: isLoadingFull } = useQuery({
    queryKey: ['finalReportDetail', reportId],
    queryFn: () => finalReportService.getById(reportId),
    enabled: visible && !!reportId,
  });

  const report = fullReportData || record;

  useEffect(() => {
    if (report) {
      setIsEditing(false);
      setBirdRate(String(report.birdRate ?? ''));
      setFeedRate(String(report.feedRate ?? ''));
      setMedicineCost(String(report.medicineCost ?? ''));
      setAdminCost(String(report.adminCost ?? ''));
      setStdCostPerKg(String(report.stdCostPerKg ?? ''));
      setTotalRearingCharges(String(report.totalRearingCharges ?? ''));
      setTotalAmountPayable(String(report.totalAmountPayable ?? ''));
    }
  }, [report, visible]);

  if (!record) return null;

  const formatDate = (rawDate: string) => {
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return rawDate;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return rawDate || '-';
    }
  };

  const totalBirds = Number(report.totalBirds || 0);
  const totalSoldBirds = Number(report.totalSoldBirds || 0);
  const mortalityCount =
    totalBirds > totalSoldBirds ? totalBirds - totalSoldBirds : Number(report.mortalityCount || 0);
  const livabilityPercent =
    totalBirds > 0 ? (((totalBirds - mortalityCount) / totalBirds) * 100).toFixed(1) : '100';

  const totalFeedKg = Number(report.totalFeedKg || Number(report.totalBags || 0) * 50);
  const totalBirdsWeight = Number(report.totalBirdsWeight || report.totalWeight || 0);
  const avgBodyWeight =
    report.avgBodyWeight !== undefined
      ? Number(report.avgBodyWeight)
      : totalSoldBirds > 0
      ? Number((totalBirdsWeight / totalSoldBirds).toFixed(2))
      : 0;

  const fcr =
    report.fcr !== undefined
      ? Number(report.fcr)
      : totalBirdsWeight > 0
      ? Number((totalFeedKg / totalBirdsWeight).toFixed(2))
      : 0;

  const currentPayable = Number(report.totalAmountPayable || 0);
  const currentRearing = Number(report.totalRearingCharges || 0);

  const handleUpdate = async () => {
    if (!record?.id) return;
    setSubmitting(true);
    try {
      const payload = {
        ...report,
        birdRate: Number(birdRate) || report.birdRate || 0,
        feedRate: Number(feedRate) || report.feedRate || 0,
        medicineCost: Number(medicineCost) || report.medicineCost || 0,
        adminCost: Number(adminCost) || report.adminCost || 0,
        stdCostPerKg: Number(stdCostPerKg) || report.stdCostPerKg || 0,
        totalRearingCharges: Number(totalRearingCharges) || currentRearing,
        totalAmountPayable: Number(totalAmountPayable) || currentPayable,
      };

      await finalReportService.update(record.id, payload);
      Alert.alert('Updated', 'Final settlement statement updated successfully.');
      setIsEditing(false);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update report.';
      Alert.alert('Update Failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!record?.id) return;
    Alert.alert(
      'Delete Settlement Report',
      'Are you sure you want to delete this batch settlement report?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await finalReportService.delete(record.id);
              Alert.alert('Deleted', 'Settlement report deleted successfully.');
              onSuccess?.();
              onClose();
            } catch (err: any) {
              const msg = err.response?.data?.message || err.message || 'Failed to delete report.';
              Alert.alert('Error', msg);
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

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
                <MaterialIcons name="assessment" size={20} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>
                  {isEditing ? 'Edit Settlement Report' : `Settlement #${report.batchId || report.id}`}
                </Text>
                <Text style={styles.subtitle}>
                  Period: {formatDate(report.startDate)} – {formatDate(report.endDate || report.date)}
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleDelete}
                style={[styles.actionBtn, styles.deleteActionBtn]}
                disabled={submitting || deleting}
                activeOpacity={0.7}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color={theme.colors.rose} />
                ) : (
                  <Feather name="trash-2" size={15} color={theme.colors.rose} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsEditing(!isEditing)}
                style={[styles.actionBtn, isEditing && styles.actionBtnActive]}
                activeOpacity={0.7}
              >
                <Feather
                  name={isEditing ? 'eye' : 'edit-2'}
                  size={16}
                  color={isEditing ? '#ffffff' : theme.colors.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                <Feather name="x" size={20} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
            {isEditing ? (
              /* ================= EDIT MODE ================= */
              <View style={styles.formContainer}>
                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Chick Rate (₹ / bird)</Text>
                    <TextInput
                      style={styles.input}
                      value={birdRate}
                      onChangeText={setBirdRate}
                      placeholder="e.g. 38"
                      keyboardType="numeric"
                      placeholderTextColor={theme.colors.textMuted}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Feed Rate (₹ / kg)</Text>
                    <TextInput
                      style={styles.input}
                      value={feedRate}
                      onChangeText={setFeedRate}
                      placeholder="e.g. 42"
                      keyboardType="numeric"
                      placeholderTextColor={theme.colors.textMuted}
                    />
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Medicine Cost (₹)</Text>
                    <TextInput
                      style={styles.input}
                      value={medicineCost}
                      onChangeText={setMedicineCost}
                      placeholder="Medicine ₹"
                      keyboardType="numeric"
                      placeholderTextColor={theme.colors.textMuted}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Admin Charges (₹)</Text>
                    <TextInput
                      style={styles.input}
                      value={adminCost}
                      onChangeText={setAdminCost}
                      placeholder="Admin ₹"
                      keyboardType="numeric"
                      placeholderTextColor={theme.colors.textMuted}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Standard Cost Benchmark (₹ / kg)</Text>
                  <TextInput
                    style={styles.input}
                    value={stdCostPerKg}
                    onChangeText={setStdCostPerKg}
                    placeholder="e.g. 95"
                    keyboardType="numeric"
                    placeholderTextColor={theme.colors.textMuted}
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Total Rearing (₹)</Text>
                    <TextInput
                      style={styles.input}
                      value={totalRearingCharges}
                      onChangeText={setTotalRearingCharges}
                      placeholder="Rearing charges ₹"
                      keyboardType="numeric"
                      placeholderTextColor={theme.colors.textMuted}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Net Farmer Payable (₹)</Text>
                    <TextInput
                      style={styles.input}
                      value={totalAmountPayable}
                      onChangeText={setTotalAmountPayable}
                      placeholder="Total payable ₹"
                      keyboardType="numeric"
                      placeholderTextColor={theme.colors.textMuted}
                    />
                  </View>
                </View>

                {/* Edit Action Buttons */}
                <View style={styles.buttonStack}>
                  <TouchableOpacity
                    style={[styles.primaryBtn, submitting && styles.btnDisabled]}
                    onPress={handleUpdate}
                    disabled={submitting || deleting}
                    activeOpacity={0.8}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Feather name="check" size={16} color="#ffffff" />
                        <Text style={styles.primaryBtnText}>Save Settlement</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <View style={styles.editSecondaryRow}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => setIsEditing(false)}
                      disabled={submitting || deleting}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={handleDelete}
                      disabled={submitting || deleting}
                      activeOpacity={0.7}
                    >
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
                {/* Net Payout Banner */}
                <View style={styles.payoutCard}>
                  <View>
                    <Text style={styles.payoutLabel}>NET FARMER PAYABLE</Text>
                    <Text style={styles.payoutAmount}>
                      ₹{Math.round(currentPayable).toLocaleString()}
                    </Text>
                    <Text style={styles.payoutSub}>Total approved settlement payout</Text>
                  </View>
                  <View style={styles.livabilityBadge}>
                    <Text style={styles.livabilityLabel}>LIVABILITY</Text>
                    <Text style={styles.livabilityValue}>{livabilityPercent}%</Text>
                  </View>
                </View>

                {/* 4-Stat Performance Grid */}
                <View style={styles.metricGrid}>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>SOLD BIRDS</Text>
                    <Text style={styles.metricValue}>{totalSoldBirds.toLocaleString()}</Text>
                    <Text style={styles.metricSub}>Housed: {totalBirds.toLocaleString()}</Text>
                  </View>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>HARVEST WT</Text>
                    <Text style={styles.metricValue}>
                      {totalBirdsWeight.toLocaleString()} <Text style={styles.unitText}>kg</Text>
                    </Text>
                    <Text style={styles.metricSub}>Avg: {avgBodyWeight} kg</Text>
                  </View>
                </View>

                <View style={styles.metricGrid}>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>FEED CONSUMED</Text>
                    <Text style={styles.metricValue}>
                      {totalFeedKg.toLocaleString()} <Text style={styles.unitText}>kg</Text>
                    </Text>
                    <Text style={styles.metricSub}>{Number(report.totalBags || 0)} bags (50kg)</Text>
                  </View>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>FLOCK FCR</Text>
                    <Text style={[styles.metricValue, { color: theme.colors.primaryMedium }]}>
                      {fcr}
                    </Text>
                    <Text style={styles.metricSub}>Conversion ratio</Text>
                  </View>
                </View>

                {/* Flock Mortality Audit */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionHeader}>Flock Audit & Livability</Text>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Initial Chicks Placed</Text>
                    <Text style={styles.detailValue}>{totalBirds.toLocaleString()} birds</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Total Harvested & Sold</Text>
                    <Text style={styles.detailValueBold}>{totalSoldBirds.toLocaleString()} birds</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Flock Mortality Count</Text>
                    <Text style={[styles.detailValueBold, { color: theme.colors.rose }]}>
                      {mortalityCount.toLocaleString()} birds
                    </Text>
                  </View>

                  {report.birdRate ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Chick Placement Rate</Text>
                      <Text style={styles.detailValue}>
                        ₹{Number(report.birdRate)} / chick (₹
                        {Number(report.birdCost || 0).toLocaleString()})
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Production & Financial Breakdown */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionHeader}>Financial Cost & Incentive Audit</Text>

                  {report.feedRate ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Feed Cost Rate</Text>
                      <Text style={styles.detailValue}>
                        ₹{Number(report.feedRate)} / kg (₹
                        {Number(report.feedCost || 0).toLocaleString()})
                      </Text>
                    </View>
                  ) : null}

                  {report.medicineCost ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Medicine & Vaccine Cost</Text>
                      <Text style={styles.detailValue}>
                        ₹{Number(report.medicineCost).toLocaleString()}
                      </Text>
                    </View>
                  ) : null}

                  {report.adminCost ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Administrative Charges</Text>
                      <Text style={styles.detailValue}>
                        ₹{Number(report.adminCost).toLocaleString()}
                      </Text>
                    </View>
                  ) : null}

                  {report.grossProductionCost ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Gross Production Cost</Text>
                      <Text style={styles.detailValueBold}>
                        ₹{Math.round(Number(report.grossProductionCost)).toLocaleString()}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.divider} />

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Net Production Cost / kg</Text>
                    <Text style={styles.detailValueBold}>
                      ₹{Number(report.netCostPerKg || 0)} / kg
                    </Text>
                  </View>

                  {report.stdCostPerKg ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Standard Benchmark / kg</Text>
                      <Text style={styles.detailValue}>₹{Number(report.stdCostPerKg)} / kg</Text>
                    </View>
                  ) : null}

                  {report.productionCostIncentive !== undefined ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Cost Efficiency Incentive</Text>
                      <Text style={[styles.detailValueBold, { color: theme.colors.primary }]}>
                        +₹{Number(report.productionCostIncentive || 0)} / kg
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Rearing Charges Base</Text>
                    <Text style={styles.detailValue}>
                      ₹{Number(report.rearingChargesStd || 6.5)} / kg
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Total Grower Rearing Compensation</Text>
                    <Text style={[styles.detailValueBold, { color: theme.colors.primary }]}>
                      ₹{Math.round(currentRearing).toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* View Mode Footer Actions */}
                <View style={styles.footerRow}>
                  <TouchableOpacity
                    style={styles.deleteOutlineBtn}
                    onPress={handleDelete}
                    disabled={deleting}
                    activeOpacity={0.8}
                  >
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
                    activeOpacity={0.8}
                  >
                    <Feather name="edit-2" size={15} color={theme.colors.primary} />
                    <Text style={styles.editOutlineBtnText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.8}>
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
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 24,
      maxHeight: '88%',
      borderTopWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    dragHandle: {
      width: 44,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.surfaceBorder,
      alignSelf: 'center',
      marginBottom: 10,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceBorder,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    iconBadge: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primaryLight,
    },
    title: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    subtitle: {
      fontSize: 12,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    actionBtn: {
      padding: 7,
      borderRadius: 9999,
      backgroundColor: theme.colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionBtnActive: {
      backgroundColor: theme.colors.primary,
    },
    deleteActionBtn: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2',
    },
    deleteOutlineBtn: {
      flex: 1,
      height: 46,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.colors.rose,
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    deleteOutlineBtnText: {
      fontSize: 14,
      fontWeight: '700',
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
    payoutCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceSubtle,
      borderRadius: theme.borderRadius.lg,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    payoutLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.textMuted,
      letterSpacing: 0.8,
    },
    payoutAmount: {
      fontSize: 26,
      fontWeight: '800',
      color: theme.colors.primary,
      marginTop: 2,
      fontVariant: ['tabular-nums'],
    },
    payoutSub: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    livabilityBadge: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primaryLight,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.surfaceBorder,
    },
    livabilityLabel: {
      fontSize: 9,
      fontWeight: '800',
      color: theme.colors.primary,
      letterSpacing: 0.6,
    },
    livabilityValue: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.colors.primary,
      marginTop: 2,
    },
    metricGrid: {
      flexDirection: 'row',
      gap: 10,
    },
    metricCard: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    metricLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.textMuted,
      letterSpacing: 0.6,
    },
    metricValue: {
      fontSize: 17,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      marginTop: 4,
      fontVariant: ['tabular-nums'],
    },
    unitText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    metricSub: {
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
    sectionHeader: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 2,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 3,
    },
    detailLabel: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    detailValue: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      fontVariant: ['tabular-nums'],
    },
    detailValueBold: {
      fontSize: 13,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.surfaceBorder,
      marginVertical: 4,
    },
    /* Edit form styles */
    formContainer: {
      gap: 12,
    },
    inputGroup: {
      gap: 6,
    },
    inputRow: {
      flexDirection: 'row',
      gap: 10,
    },
    label: {
      fontSize: 12,
      fontWeight: '700',
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    primaryBtnText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '700',
    },
    btnDisabled: {
      opacity: 0.6,
    },
    editSecondaryRow: {
      flexDirection: 'row',
      gap: 10,
    },
    cancelBtn: {
      flex: 1,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    deleteBtn: {
      flex: 1,
      height: 44,
      borderRadius: 12,
      backgroundColor: isDark ? '#2e1217' : '#fee2e2',
      borderWidth: 1,
      borderColor: isDark ? '#4c1d24' : '#fecaca',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    deleteBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.rose,
    },
    footerRow: {
      flexDirection: 'row',
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    editOutlineBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    doneBtn: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      height: 46,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    doneBtnText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '700',
    },
  });
