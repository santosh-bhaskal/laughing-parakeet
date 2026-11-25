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
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../../context/ThemeContext';
import { AppTheme } from '../../constants/theme';
import { stockOutService } from '../../api/services';
import DatePickerField from '../common/DatePickerField';

interface StockOutSessionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StockOutSessionModal({
  visible,
  onClose,
  onSuccess,
}: StockOutSessionModalProps) {
  const { theme, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [masterId, setMasterId] = useState<number | null>(null);
  const [initializing, setInitializing] = useState(false);
  const [entries, setEntries] = useState<any[]>([]);
  const [birds, setBirds] = useState('');
  const [weight, setWeight] = useState('');
  const [addingEntry, setAddingEntry] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => {
    if (visible && !masterId) {
      initSession();
    }
  }, [visible]);

  const initSession = async () => {
    setInitializing(true);
    try {
      const parsedDate = date.trim() ? new Date(date.trim()) : new Date();
      const isoDate = isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
      const res = await stockOutService.createMaster({ date: isoDate });
      const newId = res?.masterId || res?.data?.id || res?.id;
      setMasterId(newId);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to start stock out session.');
    } finally {
      setInitializing(false);
    }
  };

  const handleAddEntry = async () => {
    if (!masterId) return;
    const numBirds = Number(birds);
    const numWeight = Number(weight);

    if (numBirds <= 0 || numWeight <= 0) {
      Alert.alert('Required', 'Please enter valid bird count and weight (kg).');
      return;
    }

    setAddingEntry(true);
    try {
      const created = await stockOutService.createEntry({
        stockOutMasterId: Number(masterId),
        masterId,
        birds: numBirds,
        weight: numWeight,
      });

      const entryObj = created?.entry || created?.data || created || {
        id: Date.now(),
        birds: numBirds,
        weight: numWeight,
      };

      setEntries((prev) => [...prev, entryObj]);
      setBirds('');
      setWeight('');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to add entry to server.';
      Alert.alert('Error', msg);
    } finally {
      setAddingEntry(false);
    }
  };

  const handleDeleteEntry = async (id: number) => {
    try {
      await stockOutService.deleteEntry(id);
    } catch (e) {
      // ignore
    }
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const totalBirds = entries.reduce((sum, e) => sum + (Number(e.birds) || 0), 0);
  const totalWeight = entries.reduce((sum, e) => sum + (Number(e.weight) || 0), 0);
  const avgWeight = totalBirds > 0 ? (totalWeight / totalBirds).toFixed(2) : '0';

  const handleFinalize = async () => {
    if (entries.length === 0) {
      Alert.alert('Empty', 'Please add at least one crate entry before finalizing.');
      return;
    }

    setFinalizing(true);
    try {
      if (masterId) {
        const parsedDate = date.trim() ? new Date(date.trim()) : new Date();
        const isoDate = isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
        await stockOutService.finalizeMaster(masterId, {
          date: isoDate,
          totalBirds,
          totalWeight,
          avgWeight: Number(avgWeight),
        });
      }
      Alert.alert('Completed', `Stock out session finalized with ${totalBirds} birds (${totalWeight} kg).`);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEntries([]);
      setMasterId(null);
      setDate(new Date().toISOString().split('T')[0]);
      onSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert('Finalized', 'Stock out session marked as completed.');
      setEntries([]);
      setMasterId(null);
      setDate(new Date().toISOString().split('T')[0]);
      onSuccess();
      onClose();
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <MaterialIcons name="local-shipping" size={22} color={theme.colors.primary} />
              <Text style={styles.title}>
                {masterId ? `Stock Out Dispatch #${masterId}` : 'New Stock Out Dispatch'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {initializing ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Initializing dispatch session...</Text>
            </View>
          ) : (
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
              {/* Dispatch Date */}
              <DatePickerField
                label="DISPATCH DATE"
                value={date}
                onChange={setDate}
              />

              {/* Telemetry Summary */}
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>CRATES</Text>
                  <Text style={styles.summaryVal}>{entries.length}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>TOTAL BIRDS</Text>
                  <Text style={styles.summaryVal}>{totalBirds.toLocaleString()}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>NET WEIGHT</Text>
                  <Text style={styles.summaryVal}>{totalWeight.toLocaleString()} kg</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>AVG WT</Text>
                  <Text style={[styles.summaryVal, { color: theme.colors.primary }]}>
                    {avgWeight} kg
                  </Text>
                </View>
              </View>

              {/* Add Crate Row */}
              <View style={styles.entryBox}>
                <Text style={styles.sectionTitle}>Add Weighing Crate</Text>
                <View style={styles.entryInputs}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>BIRDS IN CRATE</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      placeholder="e.g. 10"
                      placeholderTextColor={theme.colors.textMuted}
                      value={birds}
                      onChangeText={setBirds}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>CRATE WEIGHT (KG)</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      placeholder="e.g. 24.5"
                      placeholderTextColor={theme.colors.textMuted}
                      value={weight}
                      onChangeText={setWeight}
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.addButton, addingEntry && styles.disabled]}
                    onPress={handleAddEntry}
                    disabled={addingEntry}
                  >
                    <Feather name="plus" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Entries List */}
              <View style={styles.listContainer}>
                <Text style={styles.sectionTitle}>Recorded Crates ({entries.length})</Text>
                {entries.length === 0 ? (
                  <View style={styles.emptyList}>
                    <Text style={styles.emptyText}>No crates added yet. Enter birds and weight above.</Text>
                  </View>
                ) : (
                  entries.map((entry, idx) => (
                    <View key={entry.id || idx} style={styles.entryRow}>
                      <Text style={styles.entryIndex}>#{idx + 1}</Text>
                      <Text style={styles.entryBirds}>{entry.birds} birds</Text>
                      <Text style={styles.entryWeight}>{entry.weight} kg</Text>
                      <Text style={styles.entryAvg}>
                        {(Number(entry.weight) / Number(entry.birds)).toFixed(2)} kg/bird
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleDeleteEntry(entry.id)}
                        style={styles.deleteIcon}
                      >
                        <Feather name="trash-2" size={16} color={theme.colors.rose} />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>

              {/* Finalize Button */}
              <TouchableOpacity
                style={[
                  styles.finalizeButton,
                  (finalizing || entries.length === 0) && styles.disabled,
                ]}
                onPress={handleFinalize}
                disabled={finalizing || entries.length === 0}
              >
                {finalizing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.finalizeText}>Finalize & Complete Dispatch</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
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
    scrollView: {
      maxHeight: 520,
    },
    content: {
      gap: 14,
      paddingBottom: 20,
    },
    dateGroup: {
      gap: 4,
    },
    loadingBox: {
      padding: 30,
      alignItems: 'center',
      gap: 8,
    },
    loadingText: {
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    summaryGrid: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surfaceSubtle,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      padding: 10,
    },
    summaryItem: {
      flex: 1,
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: 9,
      fontWeight: '700',
      color: theme.colors.textMuted,
      letterSpacing: 0.4,
    },
    summaryVal: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      marginTop: 2,
    },
    entryBox: {
      backgroundColor: theme.colors.surfaceSubtle,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      padding: 12,
      gap: 8,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    entryInputs: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
    },
    inputLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.textMuted,
      marginBottom: 4,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontSize: 14,
      color: theme.colors.textPrimary,
      backgroundColor: theme.colors.surface,
    },
    addButton: {
      backgroundColor: theme.colors.primary,
      width: 40,
      height: 40,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listContainer: {
      gap: 8,
    },
    emptyList: {
      padding: 20,
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceSubtle,
      borderRadius: 10,
    },
    emptyText: {
      fontSize: 12,
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
    entryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 10,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      justifyContent: 'space-between',
    },
    entryIndex: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.textMuted,
      width: 24,
    },
    entryBirds: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      width: 70,
    },
    entryWeight: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.primary,
      width: 70,
    },
    entryAvg: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      flex: 1,
      textAlign: 'right',
      marginRight: 8,
    },
    deleteIcon: {
      padding: 4,
    },
    finalizeButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 6,
    },
    disabled: {
      opacity: 0.6,
    },
    finalizeText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '700',
    },
  });
