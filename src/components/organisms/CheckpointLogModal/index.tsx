import {Clock,MapPin,User} from 'lucide-react-native';
import React from 'react';
import {Modal,StyleSheet,Text,TouchableOpacity,View} from 'react-native';

import {useTheme} from '@/context/Theme';

type Props = {
  data: {
    checkpointName: string;
    guardName?: string;
    status: 'completed' | 'pending' | 'skipped';
    timestamp?: string;
  };
  onClose: () => void;
  visible: boolean;
};

const statusDetails = {
  completed: {color: '#4CAF50',label: 'Completado'},
  pending: {color: '#FFC107',label: 'Pendiente'},
  skipped: {color: '#F44336',label: 'Omitido'},
};

const CheckpointLogModal = ({data,onClose,visible}: Props) => {
  const {theme} = useTheme();
  const {checkpointName,guardName,status,timestamp} = data;

  return (
    <Modal style={styles.modalContainer} visible={visible}>
      <View style={[styles.modal,{backgroundColor: theme.cardBackground}]}>
        <Text style={[styles.title,{color: theme.textPrimary}]}>
          Detalle del Checkpoint
        </Text>

        <View style={styles.row}>
          <MapPin color={theme.textSecondary} size={20} />
          <Text style={[styles.text,{color: theme.textPrimary}]}>
            {checkpointName}
          </Text>
        </View>

        {guardName && (
          <View style={styles.row}>
            <User color={theme.textSecondary} size={20} />
            <Text style={[styles.text,{color: theme.textPrimary}]}>
              {guardName}
            </Text>
          </View>
        )}

        <View style={styles.row}>
          <Clock color={theme.textSecondary} size={20} />
          <Text style={[styles.text,{color: theme.textPrimary}]}>
            {timestamp
              ? new Date(timestamp).toLocaleTimeString()
              : 'Sin hora registrada'}
          </Text>
        </View>

        <View style={styles.row}>
          <View
            style={[
              styles.statusIndicator,
              {backgroundColor: statusDetails[status].color},
            ]}
          />
          <Text style={[styles.text,{color: theme.textPrimary}]}>
            {statusDetails[status].label}
          </Text>
        </View>

        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeText}>Cerrar</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export default CheckpointLogModal;

const styles = StyleSheet.create({
  closeBtn: {
    alignSelf: 'flex-end',
    marginTop: 16,
  },
  closeText: {
    color: '#E94560',
    fontWeight: '600',
  },
  modal: {
    borderRadius: 16,
    padding: 20,
  },
  modalContainer: {
    justifyContent: 'center',
    margin: 0,
    padding: 20,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statusIndicator: {
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  text: {
    fontSize: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});
