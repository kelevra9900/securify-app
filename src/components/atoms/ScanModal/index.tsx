import {MotiView} from 'moti';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {darkTheme} from '@/assets/theme';

function ScanModal({
  isReady = false,
  name,
  onCancel,
  visible,
}: {
  isReady?: boolean;
  name: string;
  onCancel: () => void;
  visible: boolean;
}) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      transparent
      visible={visible}
    >
      <View style={styles.modalBackdrop}>
        <MotiView
          animate={{opacity: 1,scale: 1}}
          from={{opacity: 0,scale: 0.95}}
          style={styles.modalCard}
          transition={{duration: 200,type: 'timing'}}
        >
          <Text style={styles.modalTitle}>
            {isReady ? '✅ Acerca el tag NFC ahora' : '⏳ Preparando escaneo...'}
          </Text>
          <Text numberOfLines={2} style={styles.modalMeta}>
            {isReady
              ? `Checkpoint: ${name}`
              : 'NO acerques el tag aún, espera un momento'
            }
          </Text>

          <View style={{height: 16}} />
          <ActivityIndicator color={darkTheme.highlight} />
          <View style={{height: 16}} />

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onCancel}
            style={styles.modalBtn}
          >
            <Text style={styles.modalBtnText}>Cancelar</Text>
          </TouchableOpacity>
        </MotiView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    flex: 1,
    justifyContent: 'center',
  },
  modalBtn: {
    alignSelf: 'center',
    backgroundColor: darkTheme.cardBackground,
    borderColor: darkTheme.border,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modalBtnText: {color: darkTheme.textPrimary,fontWeight: '700'},
  modalCard: {
    backgroundColor: darkTheme.cardBackground,
    borderColor: darkTheme.border,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    width: '86%',
  },

  modalMeta: {color: darkTheme.textSecondary,fontSize: 12,marginTop: 6},
  modalTitle: {color: darkTheme.textPrimary,fontSize: 16,fontWeight: '700'},
});

export default ScanModal;
