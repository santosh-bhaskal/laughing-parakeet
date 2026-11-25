import React, { useState, useEffect, useMemo } from 'react';
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
import { AppTheme } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';
import { dailyRecordService } from '../../api/services';
import DatePickerField from '../common/DatePickerField';

interface EditDailyRecordModalProps {
  visible: boolean;
  record: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditDailyRecordModal({
  visible,
  record,
  onClose,
  onSuccess,
}: EditDailyRecordModalProps) {
  const { theme, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const [date, setDate] = useState('');
  const [birdAge, setBirdAge] = useState('');
  const [feedConsumed, setFeedConsumed] = useState('');
  const [mortality, setMortality] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (record) {
      if (record.date) {
        try {
          setDate(new Date(record.date).toISOString().split('T')[0]);
        } catch {
          setDate(String(record.date).substring(0, 10));
        }
      } else {
        setDate(new Date().toISOString().split('T')[0]);
      }
      setBirdAge(String(record.birdAgeInDays ?? ''));
      setFeedConsumed(String(record.feedConsumedBags ?? ''));
      setMortality(String(record.mortalityCount ?? ''));
    }
  }, [record]);

  const handleUpdate = async () => {
    if (!record?.id) return;
    setLoading(true);
    try {
      const parsedDate = date.trim() ? new Date(date.trim()) : new Date();
      const isoDate = isNaN(parsedDate.getTime()) ? (record.date || new Date().toISOString()) : parsedDate.toISOString();

      await dailyRecordService.update(record.id, {
        date: isoDate,
        birdAgeInDays: Number(birdAge) || 0,
        feedConsumedBags: Number(feedConsumed) || 0,
        mortalityCount: Number(mortality) || 0,
      });
      Alert.alert('Updated', 'Daily entry updated successfully.');
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update record.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!record?.id) return;
    Alert.alert('Delete Record', 'Are you sure you want to remove this daily entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await dailyRecordService.delete(record.id);
            Alert.alert('Deleted', 'Daily record deleted.');
            onSuccess();
            onClose();
          } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Failed to delete record.';
            Alert.alert('Error', msg);
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
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
              <MaterialIcons name="edit" size={20} color={theme.colors.primary} />
              <Text style={styles.title}>Edit Daily Record #{record?.id}</Text>
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
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>FEED CONSUMED (BAGS)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={feedConsumed}
                onChangeText={setFeedConsumed}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>MORTALITY COUNT</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={mortality}
                onChangeText={setMortality}
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.deleteButton, deleting && styles.disabled]}
                onPress={handleDelete}
                disabled={deleting || loading}
                activeOpacity={0.7}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color={theme.colors.rose} />
                ) : (
                  <>
                    <Feather name="trash-2" size={16} color={theme.colors.rose} />
                    <Text style={styles.deleteText}>Delete</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.updateButton, loading && styles.disabled]}
                onPress={handleUpdate}
                disabled={loading || deleting}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.updateText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
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
    label: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.textMuted,
      letterSpacing: 0.6,
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
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    deleteButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: theme.colors.roseLight,
      borderWidth: 1,
      borderColor: theme.colors.roseBorder,
      paddingVertical: 14,
      borderRadius: 12,
    },
    deleteText: {
      color: theme.colors.rose,
      fontSize: 14,
      fontWeight: '700',
    },
    updateButton: {
      flex: 2,
      backgroundColor: theme.colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#166534',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2,
    },
    updateText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '800',
    },
    disabled: {
      opacity: 0.6,
    },
  });
