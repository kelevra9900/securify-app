import { NativeModules, Platform } from 'react-native';

type ScanResult = {
  tech: string;
  uid: string;
};

const { NfcModule } = NativeModules as {
  NfcModule?: {
    isSupported: () => Promise<boolean>;
    scanTag: (options?: { timeoutMs?: number }) => Promise<ScanResult>;
  };
};

export async function scanCheckpointTag(
  timeoutMs = 10_000,
): Promise<ScanResult> {
  if (!NfcModule?.scanTag) {
    throw new Error('NfcModule not linked');
  }
  const supported = await NfcModule.isSupported();
  if (!supported) {
    throw new Error(
      Platform.OS === 'ios'
        ? 'Este iPhone no soporta NFC o no está habilitado.'
        : 'NFC no soportado en este dispositivo.',
    );
  }
  return NfcModule.scanTag({ timeoutMs });
}
