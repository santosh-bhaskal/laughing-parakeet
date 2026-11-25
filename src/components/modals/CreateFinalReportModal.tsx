import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../../context/ThemeContext';
import { AppTheme } from '../../constants/theme';
import { finalReportService } from '../../api/services';

interface CreateFinalReportModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateFinalReportModal({
  visible,
  onClose,
  onSuccess,
}: CreateFinalReportModalProps) {
  const { theme, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const [activeBatchDbId, setActiveBatchDbId] = useState<number | null>(null);
  const [batchStartDate, setBatchStartDate] = useState<string | null>(null);
  const [fetchingPrepare, setFetchingPrepare] = useState(false);
  const [hasLoadedPrepare, setHasLoadedPrepare] = useState(false);

  const [batchId, setBatchId] = useState('1');
  const [totalBirds, setTotalBirds] = useState('0');
  const [birdRate, setBirdRate] = useState('35');
  const [totalBags, setTotalBags] = useState('0');
  const [feedRate, setFeedRate] = useState('30');
  const [soldBirds, setSoldBirds] = useState('0');
  const [soldWeight, setSoldWeight] = useState('0');
  const [medicineCost, setMedicineCost] = useState('0');
  const [adminCost, setAdminCost] = useState('0');
  const [stdCostPerKg, setStdCostPerKg] = useState('80');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadPrepareData();
    }
  }, [visible]);

  const loadPrepareData = async () => {
    setFetchingPrepare(true);
    try {
      const res = await finalReportService.getPrepareData();
      const data = res?.data || res;
      if (data) {
        setActiveBatchDbId(data.id || null);
        setBatchId(String(data.batchNo || data.id || '1'));
        setTotalBirds(String(data.totalHousedBirds ?? 0));
        setTotalBags(String(data.totalFeedBags ?? 0));
        setSoldBirds(String(data.totalSoldBirds ?? 0));
        setSoldWeight(String(data.totalExportedWeight ?? 0));
        if (data.startDate) {
          setBatchStartDate(data.startDate);
        }
        setHasLoadedPrepare(true);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Could not auto-fetch active batch.';
      console.log('Prepare data error:', msg);
    } finally {
      setFetchingPrepare(false);
    }
  };

  // Computed Formulas (Matching poultry-web FinalReportForm exactly):
  const numTotalBirds = Number(totalBirds) || 0;
  const numBirdRate = Number(birdRate) || 0;
  const birdCost = numTotalBirds * numBirdRate;

  const numBags = Number(totalBags) || 0;
  const totalFeedKg = numBags * 50;
  const numFeedRate = Number(feedRate) || 0;
  const feedCost = totalFeedKg * numFeedRate;

  const numSoldBirds = Number(soldBirds) || 0;
  const numSoldWeight = Number(soldWeight) || 0;
  const avgBodyWeight = numSoldBirds > 0 ? (numSoldWeight / numSoldBirds).toFixed(2) : '0';

  const numMed = Number(medicineCost) || 0;
  const numAdmin = Number(adminCost) || 0;

  const grossProductionCost = birdCost + feedCost + numMed + numAdmin;
  const netCostPerKg = numSoldWeight > 0 ? (grossProductionCost / numSoldWeight).toFixed(2) : '0';

  const numStdCost = Number(stdCostPerKg) || 80;
  const costDiff = numStdCost - Number(netCostPerKg);
  const productionCostIncentive = costDiff > 0 ? (costDiff * 0.1).toFixed(2) : '0';
  const rearingChargesStd = 13.13;
  const rearingChargesPerBird = (
    rearingChargesStd * Number(avgBodyWeight) +
    Number(productionCostIncentive)
  ).toFixed(2);

  const totalAmountPayable = Math.round(numSoldBirds * Number(rearingChargesPerBird));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await finalReportService.create({
        batchId: activeBatchDbId || Number(batchId) || 1,
        startDate: batchStartDate || new Date().toISOString(),
        endDate: new Date().toISOString(),
        totalBirds: numTotalBirds,
        birdRate: numBirdRate,
        birdCost: birdCost,
        totalBags: numBags,
        totalFeedKg: totalFeedKg,
        feedRate: numFeedRate,
        feedCost: feedCost,
        totalSoldBirds: numSoldBirds,
        totalBirdsWeight: numSoldWeight,
        avgBodyWeight: Number(avgBodyWeight),
        chicksCost: birdCost,
        medicineCost: numMed,
        adminCost: numAdmin,
        grossProductionCost: grossProductionCost,
        netCostPerKg: Number(netCostPerKg),
        stdCostPerKg: numStdCost,
        rearingChargesStd: rearingChargesStd,
        productionCostIncentive: Number(productionCostIncentive),
        rearingChargesPerBird: Number(rearingChargesPerBird),
        totalRearingCharges: totalAmountPayable,
        totalAmountPayable: totalAmountPayable,
      });

      Alert.alert(
        'Settlement Finalized',
        `Batch #${batchId} has been successfully settled and marked as complete.\n\nNet Payable: ₹${totalAmountPayable.toLocaleString()}`
      );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess();
      onClose();
    } catch (err: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err.response?.data?.message || err.message || 'Failed to create final settlement.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <MaterialIcons name="assessment" size={22} color={theme.colors.primary} />
              <Text style={styles.title}>Final Batch Settlement</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
            {/* Batch & Data Sync Banner */}
            {fetchingPrepare ? (
              <View style={styles.prepareLoadingBanner}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.prepareLoadingText}>
                  Fetching checkout & inventory data...
                </Text>
              </View>
            ) : hasLoadedPrepare ? (
              <View style={styles.batchInfoBanner}>
                <View style={styles.batchInfoHeader}>
                  <View style={styles.batchBadge}>
                    <Feather name="layers" size={13} color={theme.colors.primary} />
                    <Text style={styles.batchBadgeText}>Active Batch #{batchId}</Text>
                  </View>
                  <View style={styles.syncedBadge}>
                    <Feather name="check-circle" size={12} color="#16a34a" />
                    <Text style={styles.syncedBadgeText}>Checkout Data Synced</Text>
                  </View>
                </View>
                <View style={styles.batchMetricsRow}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricItemLabel}>SOLD BIRDS</Text>
                    <Text style={styles.metricItemVal}>{numSoldBirds.toLocaleString()}</Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricItem}>
                    <Text style={styles.metricItemLabel}>CHECKOUT WT</Text>
                    <Text style={styles.metricItemVal}>{numSoldWeight.toLocaleString()} kg</Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricItem}>
                    <Text style={styles.metricItemLabel}>CHICKS</Text>
                    <Text style={styles.metricItemVal}>{numTotalBirds.toLocaleString()}</Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricItem}>
                    <Text style={styles.metricItemLabel}>FEED BAGS</Text>
                    <Text style={styles.metricItemVal}>{numBags.toLocaleString()}</Text>
                  </View>
                </View>
              </View>
            ) : null}

            {/* Batch ID */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>BATCH NUMBER</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={batchId}
                  onChangeText={setBatchId}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>STD COST/KG (₹)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={stdCostPerKg}
                  onChangeText={setStdCostPerKg}
                />
              </View>
            </View>

            {/* Bird Input & Rate */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>TOTAL CHICKS</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={totalBirds}
                  onChangeText={setTotalBirds}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>CHICK RATE (₹)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={birdRate}
                  onChangeText={setBirdRate}
                />
              </View>
            </View>

            {/* Feed Bags & Rate */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>FEED BAGS</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={totalBags}
                  onChangeText={setTotalBags}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>FEED RATE (₹/KG)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={feedRate}
                  onChangeText={setFeedRate}
                />
              </View>
            </View>

            {/* Harvested Sales */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>SOLD BIRDS</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={soldBirds}
                  onChangeText={setSoldBirds}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>TOTAL WEIGHT (KG)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={soldWeight}
                  onChangeText={setSoldWeight}
                />
              </View>
            </View>

            {/* Medicine & Admin */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>MEDICINE COST (₹)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={medicineCost}
                  onChangeText={setMedicineCost}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>ADMIN / OVERHEAD (₹)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={adminCost}
                  onChangeText={setAdminCost}
                />
              </View>
            </View>

            {/* Derived Settlement Summary Banner */}
            <View style={styles.resultCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.resLabel}>AVG BODY WEIGHT:</Text>
                <Text style={styles.resVal}>{avgBodyWeight} kg</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.resLabel}>NET COST / KG:</Text>
                <Text style={styles.resVal}>₹{netCostPerKg}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.resLabel}>REARING / BIRD:</Text>
                <Text style={styles.resVal}>₹{rearingChargesPerBird}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>TOTAL NET PAYABLE:</Text>
                <Text style={styles.totalVal}>₹{totalAmountPayable.toLocaleString()}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.disabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitText}>Save & Finalize Settlement</Text>
              )}
            </TouchableOpacity>
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
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '92%',
      padding: 20,
      gap: 14,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    closeButton: {
      padding: 6,
      borderRadius: 9999,
      backgroundColor: theme.colors.surfaceSubtle,
    },
    scrollView: {
      maxHeight: 520,
    },
    content: {
      gap: 12,
      paddingBottom: 24,
    },
    prepareLoadingBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: theme.colors.surfaceSubtle,
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    prepareLoadingText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    batchInfoBanner: {
      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.08)' : 'rgba(34, 197, 94, 0.1)',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(34, 197, 94, 0.25)' : 'rgba(34, 197, 94, 0.3)',
      padding: 12,
      gap: 10,
    },
    batchInfoHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    batchBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    batchBadgeText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    syncedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.15)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
    },
    syncedBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#16a34a',
    },
    batchMetricsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    metricItem: {
      flex: 1,
      alignItems: 'center',
    },
    metricItemLabel: {
      fontSize: 9,
      fontWeight: '700',
      color: theme.colors.textMuted,
      marginBottom: 2,
    },
    metricItemVal: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    metricDivider: {
      width: 1,
      height: 20,
      backgroundColor: theme.colors.cardBorder,
    },
    row: {
      flexDirection: 'row',
      gap: 10,
    },
    inputGroup: {
      gap: 4,
    },
    label: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.textMuted,
      letterSpacing: 0.4,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 13,
      color: theme.colors.textPrimary,
      backgroundColor: theme.colors.surfaceSubtle,
    },
    resultCard: {
      backgroundColor: theme.colors.surfaceSubtle,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      padding: 14,
      gap: 6,
      marginTop: 4,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    resLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    resVal: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    totalRow: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.cardBorder,
      paddingTop: 8,
      marginTop: 4,
    },
    totalLabel: {
      fontSize: 13,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    totalVal: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.colors.primary,
    },
    submitButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
    },
    disabled: {
      opacity: 0.6,
    },
    submitText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '700',
    },
  });
