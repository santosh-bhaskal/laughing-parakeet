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
  Linking,
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { AppTheme } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';
import { inventoryService } from '../../api/services';

interface InventoryDetailModalProps {
  visible: boolean;
  type: 'birds' | 'feed';
  record: any | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function InventoryDetailModal({
  visible,
  type,
  record,
  onClose,
  onSuccess,
}: InventoryDetailModalProps) {
  const { theme, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Bird edit fields
  const [batchNo, setBatchNo] = useState('');
  const [boxCount, setBoxCount] = useState('');
  const [birdsPerBoxCount, setBirdsPerBoxCount] = useState('');
  const [birdsArrivedCount, setBirdsArrivedCount] = useState('');
  const [housedBirdCount, setHousedBirdCount] = useState('');
  const [boxMortalityCount, setBoxMortalityCount] = useState('');
  const [disabledBirdCount, setDisabledBirdCount] = useState('');
  const [weakBirdCount, setWeakBirdCount] = useState('');
  const [excessBirdCount, setExcessBirdCount] = useState('');

  // Feed edit fields
  const [feedName, setFeedName] = useState('');
  const [bagsArrivedCount, setBagsArrivedCount] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhoneNumber, setDriverPhoneNumber] = useState('');

  useEffect(() => {
    if (record) {
      setIsEditing(false);
      if (type === 'birds') {
        setBatchNo(String(record.batchId || record.batchNo || ''));
        setBoxCount(String(record.boxCount ?? ''));
        setBirdsPerBoxCount(String(record.birdsPerBoxCount ?? ''));
        setBirdsArrivedCount(String(record.birdsArrivedCount ?? ''));
        setHousedBirdCount(String(record.housedBirdCount ?? ''));
        setBoxMortalityCount(String(record.boxMortalityCount ?? ''));
        setDisabledBirdCount(String(record.disabledBirdCount ?? ''));
        setWeakBirdCount(String(record.weakBirdCount ?? ''));
        setExcessBirdCount(String(record.excessBirdCount ?? ''));
      } else {
        setBatchNo(String(record.batchId || record.batchNo || ''));
        setFeedName(record.feedName || '');
        setBagsArrivedCount(String(record.bagsArrivedCount ?? ''));
        setDriverName(record.driverName || '');
        setDriverPhoneNumber(record.driverPhoneNumber || '');
      }
    }
  }, [record, type, visible]);

  if (!record) return null;

  const isBirds = type === 'birds';

  const formatDate = (rawDate: string) => {
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return rawDate;
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return rawDate;
    }
  };

  const handleCallDriver = (phone: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch(() => {});
    }
  };

  const handleUpdate = async () => {
    if (!record?.id) return;
    setSubmitting(true);
    try {
      if (isBirds) {
        const payload = {
          date: record.date || new Date().toISOString(),
          batchNo: batchNo || record.batchId,
          boxCount: Number(boxCount) || 0,
          birdsPerBoxCount: Number(birdsPerBoxCount) || 0,
          birdsArrivedCount: Number(birdsArrivedCount) || 0,
          housedBirdCount: Number(housedBirdCount) || 0,
          boxMortalityCount: Number(boxMortalityCount) || 0,
          disabledBirdCount: Number(disabledBirdCount) || 0,
          weakBirdCount: Number(weakBirdCount) || 0,
          excessBirdCount: Number(excessBirdCount) || 0,
        };
        await inventoryService.updateBirdInventory(record.id, payload);
        Alert.alert('Success', 'Bird arrival record updated successfully.');
      } else {
        const payload = {
          date: record.date || new Date().toISOString(),
          batchId: Number(batchNo) || record.batchId,
          feedName: feedName.trim(),
          bagsArrivedCount: Number(bagsArrivedCount) || 0,
          driverName: driverName.trim(),
          driverPhoneNumber: driverPhoneNumber.trim(),
        };
        await inventoryService.updateFeedInventory(record.id, payload);
        Alert.alert('Success', 'Feed delivery record updated successfully.');
      }
      setIsEditing(false);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update record.';
      Alert.alert('Update Failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!record?.id) return;
    Alert.alert(
      'Delete Inventory Record',
      `Are you sure you want to delete this ${isBirds ? 'bird arrival' : 'feed shipment'} record?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              if (isBirds) {
                await inventoryService.deleteBirdInventory(record.id);
              } else {
                await inventoryService.deleteFeedInventory(record.id);
              }
              Alert.alert('Deleted', 'Record removed successfully.');
              onSuccess?.();
              onClose();
            } catch (err: any) {
              const msg = err.response?.data?.message || err.message || 'Failed to delete record.';
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
              <View
                style={[
                  styles.iconBadge,
                  { backgroundColor: isBirds ? theme.colors.primaryLight : '#f0fdf4' },
                ]}
              >
                <MaterialIcons
                  name={isBirds ? 'egg' : 'inventory'}
                  size={20}
                  color={isBirds ? theme.colors.primary : '#059669'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>
                  {isEditing
                    ? isBirds
                      ? 'Edit Bird Arrival'
                      : 'Edit Feed Delivery'
                    : isBirds
                    ? 'Bird Arrival Intake'
                    : 'Feed Delivery Receipt'}
                </Text>
                <Text style={styles.subtitle}>
                  Batch #{record.batchId || record.batchNo || '-'} • {formatDate(record.date)}
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
                {isBirds ? (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Batch Number</Text>
                      <TextInput
                        style={styles.input}
                        value={batchNo}
                        onChangeText={setBatchNo}
                        placeholder="Batch ID"
                        placeholderTextColor={theme.colors.textMuted}
                      />
                    </View>

                    <View style={styles.inputRow}>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Boxes Delivered</Text>
                        <TextInput
                          style={styles.input}
                          value={boxCount}
                          onChangeText={(val) => {
                            setBoxCount(val);
                            const b = Number(val) || 0;
                            const ppb = Number(birdsPerBoxCount) || 0;
                            if (b && ppb) setBirdsArrivedCount(String(b * ppb));
                          }}
                          placeholder="e.g. 50"
                          keyboardType="numeric"
                          placeholderTextColor={theme.colors.textMuted}
                        />
                      </View>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Birds Per Box</Text>
                        <TextInput
                          style={styles.input}
                          value={birdsPerBoxCount}
                          onChangeText={(val) => {
                            setBirdsPerBoxCount(val);
                            const b = Number(boxCount) || 0;
                            const ppb = Number(val) || 0;
                            if (b && ppb) setBirdsArrivedCount(String(b * ppb));
                          }}
                          placeholder="e.g. 100"
                          keyboardType="numeric"
                          placeholderTextColor={theme.colors.textMuted}
                        />
                      </View>
                    </View>

                    <View style={styles.inputRow}>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Total Arrived Birds</Text>
                        <TextInput
                          style={styles.input}
                          value={birdsArrivedCount}
                          onChangeText={setBirdsArrivedCount}
                          placeholder="Gross count"
                          keyboardType="numeric"
                          placeholderTextColor={theme.colors.textMuted}
                        />
                      </View>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Housed Birds</Text>
                        <TextInput
                          style={styles.input}
                          value={housedBirdCount}
                          onChangeText={setHousedBirdCount}
                          placeholder="Net housed"
                          keyboardType="numeric"
                          placeholderTextColor={theme.colors.textMuted}
                        />
                      </View>
                    </View>

                    <View style={styles.inputRow}>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Box Mortality</Text>
                        <TextInput
                          style={styles.input}
                          value={boxMortalityCount}
                          onChangeText={setBoxMortalityCount}
                          placeholder="Transit loss"
                          keyboardType="numeric"
                          placeholderTextColor={theme.colors.textMuted}
                        />
                      </View>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Disabled Birds</Text>
                        <TextInput
                          style={styles.input}
                          value={disabledBirdCount}
                          onChangeText={setDisabledBirdCount}
                          placeholder="Disabled"
                          keyboardType="numeric"
                          placeholderTextColor={theme.colors.textMuted}
                        />
                      </View>
                    </View>

                    <View style={styles.inputRow}>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Weak Birds</Text>
                        <TextInput
                          style={styles.input}
                          value={weakBirdCount}
                          onChangeText={setWeakBirdCount}
                          placeholder="Weak"
                          keyboardType="numeric"
                          placeholderTextColor={theme.colors.textMuted}
                        />
                      </View>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Excess Birds</Text>
                        <TextInput
                          style={styles.input}
                          value={excessBirdCount}
                          onChangeText={setExcessBirdCount}
                          placeholder="Excess"
                          keyboardType="numeric"
                          placeholderTextColor={theme.colors.textMuted}
                        />
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Feed Formulation / Brand</Text>
                      <TextInput
                        style={styles.input}
                        value={feedName}
                        onChangeText={setFeedName}
                        placeholder="e.g. Starter Feed / Broiler Finisher"
                        placeholderTextColor={theme.colors.textMuted}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Bags Arrived (50 kg / bag)</Text>
                      <TextInput
                        style={styles.input}
                        value={bagsArrivedCount}
                        onChangeText={setBagsArrivedCount}
                        placeholder="e.g. 100"
                        keyboardType="numeric"
                        placeholderTextColor={theme.colors.textMuted}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Driver Name</Text>
                      <TextInput
                        style={styles.input}
                        value={driverName}
                        onChangeText={setDriverName}
                        placeholder="Driver full name"
                        placeholderTextColor={theme.colors.textMuted}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Driver Phone Number</Text>
                      <TextInput
                        style={styles.input}
                        value={driverPhoneNumber}
                        onChangeText={setDriverPhoneNumber}
                        placeholder="10-digit mobile number"
                        keyboardType="phone-pad"
                        placeholderTextColor={theme.colors.textMuted}
                      />
                    </View>
                  </>
                )}

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
                        <Text style={styles.primaryBtnText}>Save Updates</Text>
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
                {isBirds ? (
                  <>
                    {/* Primary Allocation Stats */}
                    <View style={styles.highlightCard}>
                      <View style={styles.statCol}>
                        <Text style={styles.statLabel}>CHICKS HOUSED</Text>
                        <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                          {Number(record.housedBirdCount || 0).toLocaleString()}
                        </Text>
                        <Text style={styles.statSub}>Ready in shed</Text>
                      </View>
                      <View style={styles.statDivider} />
                      <View style={styles.statCol}>
                        <Text style={styles.statLabel}>TOTAL ARRIVED</Text>
                        <Text style={styles.statValue}>
                          {Number(record.birdsArrivedCount || 0).toLocaleString()}
                        </Text>
                        <Text style={styles.statSub}>Gross delivered</Text>
                      </View>
                    </View>

                    {/* Box Logistics */}
                    <View style={styles.sectionCard}>
                      <Text style={styles.sectionHeader}>Box Allocation & Density</Text>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Boxes Delivered</Text>
                        <Text style={styles.detailValue}>{record.boxCount || '-'} boxes</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Birds Per Box</Text>
                        <Text style={styles.detailValue}>
                          {record.birdsPerBoxCount || '-'} chicks/box
                        </Text>
                      </View>
                    </View>

                    {/* Mortality & Discards */}
                    <View style={styles.sectionCard}>
                      <Text style={styles.sectionHeader}>Quality & Mortality Audit</Text>
                      <View style={styles.detailRow}>
                        <View style={styles.statusLabelRow}>
                          <View style={[styles.dot, { backgroundColor: theme.colors.rose }]} />
                          <Text style={styles.detailLabel}>Box / Transit Mortality</Text>
                        </View>
                        <Text style={[styles.detailValueBold, { color: theme.colors.rose }]}>
                          {record.boxMortalityCount || 0} chicks
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <View style={styles.statusLabelRow}>
                          <View style={[styles.dot, { backgroundColor: '#f59e0b' }]} />
                          <Text style={styles.detailLabel}>Disabled Chicks</Text>
                        </View>
                        <Text style={styles.detailValue}>{record.disabledBirdCount || 0} chicks</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <View style={styles.statusLabelRow}>
                          <View style={[styles.dot, { backgroundColor: '#eab308' }]} />
                          <Text style={styles.detailLabel}>Weak Chicks</Text>
                        </View>
                        <Text style={styles.detailValue}>{record.weakBirdCount || 0} chicks</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <View style={styles.statusLabelRow}>
                          <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
                          <Text style={styles.detailLabel}>Excess Birds Received</Text>
                        </View>
                        <Text style={[styles.detailValueBold, { color: theme.colors.primary }]}>
                          +{record.excessBirdCount || 0} chicks
                        </Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    {/* Primary Feed Stats */}
                    <View style={styles.highlightCard}>
                      <View style={styles.statCol}>
                        <Text style={styles.statLabel}>BAGS ARRIVED</Text>
                        <Text style={[styles.statValue, { color: '#059669' }]}>
                          {Number(record.bagsArrivedCount || 0).toLocaleString()}
                        </Text>
                        <Text style={styles.statSub}>50 kg sacks</Text>
                      </View>
                      <View style={styles.statDivider} />
                      <View style={styles.statCol}>
                        <Text style={styles.statLabel}>TOTAL WEIGHT</Text>
                        <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                          {((Number(record.bagsArrivedCount) || 0) * 50).toLocaleString()} kg
                        </Text>
                        <Text style={styles.statSub}>Net metric feed</Text>
                      </View>
                    </View>

                    {/* Feed Spec */}
                    <View style={styles.sectionCard}>
                      <Text style={styles.sectionHeader}>Feed Specification</Text>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Feed Formulation</Text>
                        <Text style={styles.detailValueBold}>
                          {record.feedName || 'Standard Poultry Feed'}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Batch / Lot No.</Text>
                        <Text style={styles.detailValue}>
                          Batch #{record.batchId || record.batchNo || '-'}
                        </Text>
                      </View>
                    </View>

                    {/* Logistics & Driver */}
                    <View style={styles.sectionCard}>
                      <Text style={styles.sectionHeader}>Logistics & Transport</Text>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Delivery Driver</Text>
                        <Text style={styles.detailValueBold}>{record.driverName || 'Not recorded'}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Contact Phone</Text>
                        <Text style={styles.detailValue}>
                          {record.driverPhoneNumber || 'Not provided'}
                        </Text>
                      </View>
                      {record.driverPhoneNumber ? (
                        <TouchableOpacity
                          style={styles.callButton}
                          onPress={() => handleCallDriver(record.driverPhoneNumber)}
                          activeOpacity={0.8}
                        >
                          <MaterialIcons name="phone" size={16} color="#ffffff" />
                          <Text style={styles.callButtonText}>
                            Call Driver ({record.driverPhoneNumber})
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </>
                )}

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
    highlightCard: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surfaceSubtle,
      borderRadius: theme.borderRadius.lg,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    statCol: {
      flex: 1,
      alignItems: 'center',
    },
    statDivider: {
      width: 1,
      backgroundColor: theme.colors.surfaceBorder,
      marginHorizontal: 12,
    },
    statLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.textMuted,
      letterSpacing: 0.8,
    },
    statValue: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      marginTop: 4,
      fontVariant: ['tabular-nums'],
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
    statusLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
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
    callButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.colors.primary,
      paddingVertical: 10,
      borderRadius: theme.borderRadius.sm,
      marginTop: 4,
    },
    callButtonText: {
      color: '#ffffff',
      fontSize: 13,
      fontWeight: '700',
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
