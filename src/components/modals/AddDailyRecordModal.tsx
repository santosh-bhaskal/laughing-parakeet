import React, { useState, useMemo } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppTheme } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';
import { dailyRecordService } from '../../api/services';
import DatePickerField from '../common/DatePickerField';

interface AddDailyRecordModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultAge?: number;
}

export default function AddDailyRecordModal({
  visible,
  onClose,
  onSuccess,
  defaultAge = 1,
}: AddDailyRecordModalProps) {
  const { theme, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [birdAge, setBirdAge] = useState(String(defaultAge));
  const [feedConsumed, setFeedConsumed] = useState('');
  const [mortality, setMortality] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!feedConsumed.trim() && !mortality.trim()) {
      Alert.alert('Required', 'Please enter feed bags or mortality count.');
      return;
    }

    setLoading(true);
    try {
      const parsedDate = date.trim() ? new Date(date.trim()) : new Date();
      const isoDate = isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();

      await dailyRecordService.create({
        date: isoDate,
        birdAgeInDays: Number(birdAge) || defaultAge,
        feedConsumedBags: Number(feedConsumed) || 0,
        mortalityCount: Number(mortality) || 0,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Daily production log added successfully.');
      setFeedConsumed('');
      setMortality('');
      setDate(new Date().toISOString().split('T')[0]);
      onSuccess();
      onClose();
    } catch (err: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err.response?.data?.message || err.message || 'Failed to add daily record.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Bottom Sheet Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <MaterialIcons name="edit-calendar" size={20} color={theme.colors.primary} />
              <Text style={styles.title}>Log Daily Farm Record</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollForm} contentContainerStyle={styles.form}>
            {/* Record Date & Bird Age */}
            <View style={styles.row}>
              <DatePickerField
                label="RECORD DATE"
                value={date}
                onChange={setDate}
                style={{ flex: 1.3 }}
              />

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>BIRD AGE (DAYS)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={birdAge}
                  onChangeText={setBirdAge}
                  placeholder="e.g. 15"
                  placeholderTextColor={theme.colors.textMuted}
                />
              </View>
            </View>

            {/* Feed Consumed */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>FEED CONSUMED (50KG BAGS)</Text>
                <Text style={styles.labelHint}>50 kg per bag</Text>
              </View>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={feedConsumed}
                onChangeText={setFeedConsumed}
                placeholder="e.g. 4 bags"
                placeholderTextColor={theme.colors.textMuted}
              />
              {/* Quick Increment Helpers */}
              <View style={styles.quickRow}>
                {[1, 2, 4, 8].map((qty) => (
                  <TouchableOpacity
                    key={qty}
                    style={styles.quickChip}
                    onPress={() => setFeedConsumed(String((Number(feedConsumed) || 0) + qty))}
                  >
                    <Text style={styles.quickChipText}>+{qty}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.quickChipReset}
                  onPress={() => setFeedConsumed('')}
                >
                  <Text style={styles.quickChipResetText}>Reset</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Mortality */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>MORTALITY COUNT</Text>
                <Text style={styles.labelHint}>Dead birds today</Text>
              </View>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={mortality}
                onChangeText={setMortality}
                placeholder="e.g. 2 birds"
                placeholderTextColor={theme.colors.textMuted}
              />
              {/* Quick Mortality Helpers */}
              <View style={styles.quickRow}>
                <TouchableOpacity
                  style={[styles.quickChip, mortality === '0' && styles.quickChipActive]}
                  onPress={() => setMortality('0')}
                >
                  <Text style={[styles.quickChipText, mortality === '0' && styles.quickChipActiveText]}>
                    0 (Safe)
                  </Text>
                </TouchableOpacity>
                {[1, 2, 5].map((cnt) => (
                  <TouchableOpacity
                    key={cnt}
                    style={styles.quickChip}
                    onPress={() => setMortality(String((Number(mortality) || 0) + cnt))}
                  >
                    <Text style={styles.quickChipText}>+{cnt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitText}>Save Daily Entry</Text>
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
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 28,
      gap: 14,
      borderWidth: StyleSheet.hairlineWidth || 1,
      borderColor: theme.colors.cardBorder,
    },
    scrollForm: {
      maxHeight: 520,
    },
    row: {
      flexDirection: 'row',
      gap: 12,
    },
    dragHandle: {
      width: 38,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.cardBorder,
      alignSelf: 'center',
      marginBottom: 8,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 4,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    title: {
      fontSize: 17,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    closeButton: {
      padding: 6,
      borderRadius: 9999,
      backgroundColor: theme.colors.surfaceSubtle,
    },
    form: {
      gap: 14,
    },
    inputGroup: {
      gap: 6,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    label: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.textMuted,
      letterSpacing: 0.6,
    },
    labelHint: {
      fontSize: 10,
      color: theme.colors.textMuted,
      fontWeight: '500',
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 15,
      color: theme.colors.textPrimary,
      backgroundColor: theme.colors.surfaceSubtle,
      fontVariant: ['tabular-nums'],
    },
    quickRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 2,
    },
    quickChip: {
      backgroundColor: theme.colors.surfaceSubtle,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: StyleSheet.hairlineWidth || 1,
      borderColor: theme.colors.cardBorder,
    },
    quickChipActive: {
      backgroundColor: theme.colors.primaryLight,
      borderColor: theme.colors.primaryBorder,
    },
    quickChipText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.textSecondary,
    },
    quickChipActiveText: {
      color: theme.colors.primary,
    },
    quickChipReset: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    quickChipResetText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.textMuted,
    },
    submitButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      shadowColor: '#166534',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2,
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '800',
    },
  });
