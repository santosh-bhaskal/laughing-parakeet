import React, { useState, useEffect, useMemo } from 'react';
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
import { useAppTheme } from '../../context/ThemeContext';
import { AppTheme } from '../../constants/theme';
import { inventoryService, dashboardService } from '../../api/services';
import * as Haptics from 'expo-haptics';
import DatePickerField from '../common/DatePickerField';

interface AddBirdInventoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddBirdInventoryModal({
  visible,
  onClose,
  onSuccess,
}: AddBirdInventoryModalProps) {
  const { theme, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [batchNo, setBatchNo] = useState('');
  const [boxCount, setBoxCount] = useState('');
  const [birdsPerBox, setBirdsPerBox] = useState('100');
  const [boxMortality, setBoxMortality] = useState('0');
  const [disabledBirds, setDisabledBirds] = useState('0');
  const [weakBirds, setWeakBirds] = useState('0');
  const [excessBirds, setExcessBirds] = useState('0');
  const [shortBirds, setShortBirds] = useState('0');
  const [loading, setLoading] = useState(false);
  const [hasActiveBatch, setHasActiveBatch] = useState<boolean | null>(null);
  const [nextBatchNo, setNextBatchNo] = useState<number | null>(null);

  // Check if there is already an active batch when the modal opens
  useEffect(() => {
    if (visible) {
      checkBatchStatus();
    }
  }, [visible]);

  const checkBatchStatus = async () => {
    try {
      const telemetry = await dashboardService.getTelemetry();
      const isActive = !!telemetry?.activeBatchId;
      setHasActiveBatch(isActive);
      setNextBatchNo(isActive ? telemetry.activeBatchId : null);
    } catch {
      setHasActiveBatch(false);
      setNextBatchNo(null);
    }
  };

  // Auto-calculated fields
  const boxes = Number(boxCount) || 0;
  const perBox = Number(birdsPerBox) || 0;
  const arrived = boxes * perBox;
  const mortality = Number(boxMortality) || 0;
  const weak = Number(weakBirds) || 0;
  const disabled = Number(disabledBirds) || 0;
  const short = Number(shortBirds) || 0;
  const excess = Number(excessBirds) || 0;

  const housed = Math.max(0, arrived + excess - (mortality + weak + disabled + short));

  const handleSubmit = async () => {
    if (!boxCount.trim() || boxes <= 0) {
      Alert.alert('Required', 'Please enter a valid box count.');
      return;
    }

    setLoading(true);
    try {
      const parsedDate = date.trim() ? new Date(date.trim()) : new Date();
      const isoDate = isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();

      const payload: any = {
        date: isoDate,
        boxCount: boxes,
        birdsPerBoxCount: perBox,
        totalBirdCount: arrived,
        birdsArrivedCount: arrived,
        boxMortalityCount: mortality,
        disabledBirdCount: disabled,
        weakBirdCount: weak,
        shortBirdCount: short,
        excessBirdCount: excess,
        housedBirdCount: housed,
      };

      if (batchNo.trim() && !isNaN(Number(batchNo.trim())) && Number(batchNo.trim()) > 0) {
        payload.batchNo = Number(batchNo.trim());
      }

      await inventoryService.createBirdInventory(payload);

      Alert.alert(
        '🐣 New Batch Started!',
        `Batch #${payload.batchNo || 'auto'} is now active.\n\n${housed.toLocaleString()} chicks housed successfully.`
      );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setBoxCount('');
      setBatchNo('');
      setDate(new Date().toISOString().split('T')[0]);
      onSuccess();
      onClose();
    } catch (err: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err.response?.data?.message || err.message || 'Failed to add bird inventory.';
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
              <MaterialIcons name="egg" size={22} color={theme.colors.primary} />
              <Text style={styles.title}>Log Day-Old Chicks Arrival</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* New Batch Banner */}
          {hasActiveBatch === false && (
            <View style={styles.newBatchBanner}>
              <View style={styles.newBatchBannerIcon}>
                <Feather name="play-circle" size={18} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.newBatchBannerTitle}>A New Batch Will Be Started</Text>
                <Text style={styles.newBatchBannerSub}>
                  Saving this arrival will automatically create a new active batch cycle.
                </Text>
              </View>
            </View>
          )}

          {hasActiveBatch === true && (
            <View style={styles.activeBatchWarning}>
              <Feather name="alert-circle" size={15} color={theme.colors.amber} />
              <Text style={styles.activeBatchWarningText}>
                An active batch is already running. Close it with a Final Settlement before starting a new one.
              </Text>
            </View>
          )}

          <ScrollView style={styles.scrollForm} contentContainerStyle={styles.form}>
            {/* Arrival Date & Batch Number */}
            <View style={styles.row}>
              <DatePickerField
                label="ARRIVAL DATE"
                value={date}
                onChange={setDate}
                style={{ flex: 1.3 }}
              />

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>BATCH NO</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="Auto (e.g. 1)"
                  placeholderTextColor={theme.colors.textMuted}
                  value={batchNo}
                  onChangeText={setBatchNo}
                />
              </View>
            </View>

            {/* Box Count & Birds per Box */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>BOX COUNT</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="e.g. 50"
                  placeholderTextColor={theme.colors.textMuted}
                  value={boxCount}
                  onChangeText={setBoxCount}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>BIRDS PER BOX</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="e.g. 100"
                  placeholderTextColor={theme.colors.textMuted}
                  value={birdsPerBox}
                  onChangeText={setBirdsPerBox}
                />
              </View>
            </View>

            {/* Arrived Summary Banner */}
            <View style={styles.summaryBanner}>
              <Text style={styles.summaryLabel}>Total Chicks Arrived:</Text>
              <Text style={styles.summaryValue}>{arrived.toLocaleString()}</Text>
            </View>

            {/* Deductions: Box Mortality & Weak */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>BOX MORTALITY</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={boxMortality}
                  onChangeText={setBoxMortality}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>WEAK / DISABLED</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={weakBirds}
                  onChangeText={setWeakBirds}
                />
              </View>
            </View>

            {/* Adjustments: Short & Excess */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>SHORT BIRDS (-)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={shortBirds}
                  onChangeText={setShortBirds}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>EXCESS BIRDS (+)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={excessBirds}
                  onChangeText={setExcessBirds}
                />
              </View>
            </View>

            {/* Final Housed Result */}
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>NET CHICKS HOUSED</Text>
              <Text style={styles.resultValue}>{housed.toLocaleString()} birds</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                (loading || hasActiveBatch === true) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading || hasActiveBatch === true}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitText}>
                  {hasActiveBatch === true ? 'Batch Already Active' : '🐣 Save & Start New Batch'}
                </Text>
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
      maxHeight: '90%',
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
    scrollForm: {
      maxHeight: 500,
    },
    form: {
      gap: 14,
      paddingBottom: 16,
    },
    row: {
      flexDirection: 'row',
      gap: 12,
    },
    inputGroup: {
      gap: 6,
    },
    label: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.textMuted,
      letterSpacing: 0.4,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 9,
      fontSize: 14,
      color: theme.colors.textPrimary,
      backgroundColor: theme.colors.surfaceSubtle,
    },
    summaryBanner: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors.primaryLight,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.primaryBorder,
    },
    summaryLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    summaryValue: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.colors.primary,
    },
    resultCard: {
      backgroundColor: theme.colors.surfaceSubtle,
      padding: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      alignItems: 'center',
      gap: 4,
    },
    resultLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.textMuted,
      letterSpacing: 0.5,
    },
    resultValue: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    submitButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 6,
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '700',
    },
    newBatchBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(22, 101, 52, 0.08)',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(22, 101, 52, 0.2)',
      padding: 12,
    },
    newBatchBannerIcon: {
      marginTop: 1,
    },
    newBatchBannerTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 2,
    },
    newBatchBannerSub: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      lineHeight: 16,
    },
    activeBatchWarning: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      backgroundColor: theme.colors.amberLight,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.amberBorder,
      padding: 12,
    },
    activeBatchWarningText: {
      flex: 1,
      fontSize: 12,
      color: theme.colors.amber,
      fontWeight: '600',
      lineHeight: 17,
    },
  });
