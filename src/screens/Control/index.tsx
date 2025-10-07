import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {
	ActivityIndicator,
	Alert,
	Animated,
	KeyboardAvoidingView,
	NativeModules,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from 'react-native';
import {Nfc,SmartphoneNfc} from 'lucide-react-native';

import {colors,type ThemeType} from '@/assets/theme/colors';
import {CSafeAreaView,Header,PrimaryButton} from '@/components/atoms';
import {useTheme} from '@/context/Theme';
import {scanCheckpointTag} from '@/utils/nfc';

type ExtendedScanResult = {
	ndef?: {
		payload?: string;
		type?: string;
	};
	tech: string;
	uid: string;
};

type TagInfo = {
	action: 'scan' | 'write';
	ndefPayload?: string;
	ndefType?: string;
	tech: string;
	timestamp: string;
	uid: string;
};

type TagLogEntry = {
	action: 'error' | TagInfo['action'];
	id: string;
	message: string;
	timestamp: string;
};

type SupportState = 'checking' | 'module-missing' | 'supported' | 'unsupported';

type NativeNfcModule = {
	isSupported: () => Promise<boolean>;
	scanTag: (options?: {timeoutMs?: number}) => Promise<ExtendedScanResult>;
	writeTag?: (payload: string,options?: {timeoutMs?: number}) => Promise<void>;
};

const {NfcModule} = NativeModules as {NfcModule?: NativeNfcModule};

const TIMEOUT_MS = 12_000;

const ControlScreen: React.FC = () => {
	const {theme} = useTheme();
	const [supportState,setSupportState] = useState<SupportState>('checking');
	const [mode,setMode] = useState<'idle' | 'scanning' | 'writing'>('idle');
	const [tagInfo,setTagInfo] = useState<null | TagInfo>(null);
	const [alias,setAlias] = useState('');
	const [checkpointId,setCheckpointId] = useState('');
	const [logEntries,setLogEntries] = useState<TagLogEntry[]>([]);
	const [errorMessage,setErrorMessage] = useState<null | string>(null);

	const pulse = useRef(new Animated.Value(1)).current;

	const canWrite = Boolean(NfcModule?.writeTag);

	useEffect(() => {
		let mounted = true;

		async function checkSupport() {
			if (!NfcModule?.isSupported) {
				if (mounted) {
					setSupportState('module-missing');
				}
				return;
			}
			try {
				const supported = await NfcModule.isSupported();
				if (mounted) {
					setSupportState(supported ? 'supported' : 'unsupported');
				}
			} catch {
				if (mounted) {
					setSupportState('unsupported');
				}
			}
		}

		checkSupport();

		return () => {
			mounted = false;
		};
	},[]);

	useEffect(() => {
		if (mode === 'idle') {
			pulse.setValue(1);
			return;
		}

		const animation = Animated.loop(
			Animated.sequence([
				Animated.timing(pulse,{duration: 600,toValue: 1.08,useNativeDriver: true}),
				Animated.timing(pulse,{duration: 600,toValue: 1,useNativeDriver: true}),
			])
		);
		animation.start();

		return () => {
			animation.stop();
		};
	},[mode,pulse]);

	const pushLog = useCallback((entry: TagLogEntry) => {
		setLogEntries(prev => [entry,...prev].slice(0,6));
	},[]);

	const formattedSupportMessage = useMemo(() => {
		switch (supportState) {
			case 'checking':
				return 'Validando compatibilidad NFC...';
			case 'module-missing':
				return 'No encontramos el módulo NFC nativo. Verifica la instalación.';
			case 'unsupported':
				return 'Este dispositivo no soporta NFC o está deshabilitado.';
			default:
				return 'Listo para leer o escribir tags NFC.';
		}
	},[supportState]);

	const handleScan = useCallback(async () => {
		if (mode !== 'idle' || supportState !== 'supported') {
			return;
		}

		setErrorMessage(null);
		setMode('scanning');

		try {
			const rawResult = (await scanCheckpointTag(TIMEOUT_MS)) as ExtendedScanResult;
			const now = new Date().toISOString();
			const info: TagInfo = {
				action: 'scan',
				ndefPayload: rawResult.ndef?.payload,
				ndefType: rawResult.ndef?.type,
				tech: rawResult.tech,
				timestamp: now,
				uid: rawResult.uid,
			};
			setTagInfo(info);
			pushLog({
				action: 'scan',
				id: `scan-${now}`,
				message: `Tag ${rawResult.uid || 'desconocido'} leído correctamente`,
				timestamp: now,
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : 'No pudimos leer el tag NFC.';
			setErrorMessage(message);
			const now = new Date().toISOString();
			pushLog({
				action: 'error',
				id: `error-${now}`,
				message,
				timestamp: now,
			});
		} finally {
			setMode('idle');
		}
	},[mode,pushLog,supportState]);

	const buildPayload = useCallback(() => {
		const checkpoint = checkpointId.trim();
		if (!checkpoint) {
			throw new Error('Ingresa el identificador del checkpoint antes de escribir.');
		}

		const payload = {
			alias: alias.trim() || undefined,
			checkpointId: checkpoint,
			generatedAt: new Date().toISOString(),
		};

		return JSON.stringify(payload);
	},[alias,checkpointId]);

	const handleWrite = useCallback(async () => {
		if (mode !== 'idle' || supportState !== 'supported') {
			return;
		}
		if (!canWrite) {
			Alert.alert('Función no disponible','La escritura NFC no está implementada en este dispositivo.');
			return;
		}

		try {
			const payload = buildPayload();
			setErrorMessage(null);
			setMode('writing');
			if (!NfcModule?.writeTag) {
				throw new Error('Módulo de escritura NFC no disponible.');
			}
			await NfcModule.writeTag(payload,{timeoutMs: TIMEOUT_MS});
			const now = new Date().toISOString();
			setTagInfo({
				action: 'write',
				ndefPayload: payload,
				tech: 'NDEF',
				timestamp: now,
				uid: alias.trim() || checkpointId.trim(),
			});
			pushLog({
				action: 'write',
				id: `write-${now}`,
				message: 'Payload escrito, acerca el tag para validar.',
				timestamp: now,
			});
			Alert.alert('Tag listo','Acerca el tag al dispositivo para confirmar la escritura.');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'No pudimos escribir en el tag NFC.';
			setErrorMessage(message);
			const now = new Date().toISOString();
			pushLog({
				action: 'error',
				id: `write-error-${now}`,
				message,
				timestamp: now,
			});
		} finally {
			setMode('idle');
		}
	},[alias,buildPayload,canWrite,checkpointId,mode,pushLog,supportState]);

	const busyLabel = useMemo(() => {
		switch (mode) {
			case 'scanning':
				return 'Escaneando tag...';
			case 'writing':
				return 'Escribiendo tag...';
			default:
				return 'En espera';
		}
	},[mode]);

	return (
		<CSafeAreaView edges={['top','bottom']} style={[styles.container,{backgroundColor: theme.background}]}>
			<Header title="Control de Tags NFC" />
			<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
				<ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
					<Animated.View
						style={[
							styles.statusCard,
							{backgroundColor: theme.cardBackground,borderColor: theme.border},
						]}
					>
						<Animated.View
							style={[
								styles.pulse,
								{borderColor: theme.highlight},
								{transform: [{scale: pulse}]},
							]}
						>
							<View style={[styles.iconWrapper,{backgroundColor: theme.highlight}]}>
								<Nfc color={theme.textPrimary} size={28} />
							</View>
						</Animated.View>
						<View style={styles.statusTextBlock}>
							<Text style={[styles.statusTitle,{color: theme.textPrimary}]}>{busyLabel}</Text>
							<Text style={[styles.statusSubtitle,{color: theme.textSecondary}]}>{formattedSupportMessage}</Text>
						</View>
					</Animated.View>

					{supportState === 'checking' && (
						<View style={styles.loadingRow}>
							<ActivityIndicator color={theme.highlight} />
						</View>
					)}

					<View style={styles.actions}>
						<PrimaryButton
							disabled={mode !== 'idle' || supportState !== 'supported'}
							label="Leer tag NFC"
							loading={mode === 'scanning'}
							onPress={handleScan}
						/>
						<PrimaryButton
							disabled={mode !== 'idle' || supportState !== 'supported' || !canWrite}
							label={canWrite ? 'Crear/Actualizar tag' : 'Escritura no disponible'}
							loading={mode === 'writing'}
							onPress={handleWrite}
						/>
					</View>

					<View style={[styles.card,{backgroundColor: theme.cardBackground,borderColor: theme.border}]}>
						<Text style={[styles.cardTitle,{color: theme.textPrimary}]}>Generar payload</Text>
						<Text style={[styles.helper,{color: theme.textSecondary}]}>Identifica el checkpoint y un alias opcional para el tag.</Text>
						<View style={styles.inputGroup}>
							<Text style={[styles.label,{color: theme.textSecondary}]}>Checkpoint ID</Text>
							<TextInput
								autoCapitalize="none"
								autoCorrect={false}
								onChangeText={setCheckpointId}
								placeholder="Ej. CP-1234"
								placeholderTextColor={`${theme.textSecondary}80`}
								style={[styles.input,{borderColor: theme.border,color: theme.textPrimary}]}
								value={checkpointId}
							/>
						</View>
						<View style={styles.inputGroup}>
							<Text style={[styles.label,{color: theme.textSecondary}]}>Alias</Text>
							<TextInput
								autoCapitalize="words"
								autoCorrect={false}
								onChangeText={setAlias}
								placeholder="Nombre visible"
								placeholderTextColor={`${theme.textSecondary}80`}
								style={[styles.input,{borderColor: theme.border,color: theme.textPrimary}]}
								value={alias}
							/>
						</View>
						<View style={styles.payloadPreview}>
							<Text style={[styles.label,{color: theme.textSecondary}]}>Payload generado</Text>
							<Text style={[styles.payload,{color: theme.textPrimary}]}>
								{(() => {
									try {
										return JSON.stringify(JSON.parse(buildPayload()),null,2);
									} catch {
										return '{ }';
									}
								})()}
							</Text>
						</View>
					</View>

					{tagInfo && (
						<View style={[styles.card,{backgroundColor: theme.cardBackground,borderColor: theme.border}]}>
							<View style={styles.cardHeader}>
								<SmartphoneNfc color={theme.highlight} size={20} />
								<Text style={[styles.cardTitle,{color: theme.textPrimary}]}>Última acción</Text>
							</View>
							<Text style={[styles.label,{color: theme.textSecondary}]}>UID</Text>
							<Text selectable style={[styles.value,{color: theme.textPrimary}]}>{tagInfo.uid || '—'}</Text>
							<Text style={[styles.label,{color: theme.textSecondary}]}>Tecnología</Text>
							<Text style={[styles.value,{color: theme.textPrimary}]}>{tagInfo.tech}</Text>
							<Text style={[styles.label,{color: theme.textSecondary}]}>Fecha</Text>
							<Text style={[styles.value,{color: theme.textPrimary}]}> {new Date(tagInfo.timestamp).toLocaleString()}</Text>
							{tagInfo.ndefType && (
								<>
									<Text style={[styles.label,{color: theme.textSecondary}]}>Tipo NDEF</Text>
									<Text style={[styles.value,{color: theme.textPrimary}]}>{tagInfo.ndefType}</Text>
								</>
							)}
							{tagInfo.ndefPayload && (
								<>
									<Text style={[styles.label,{color: theme.textSecondary}]}>Payload</Text>
									<Text selectable style={[styles.value,{color: theme.textPrimary}]}>{tagInfo.ndefPayload}</Text>
								</>
							)}
						</View>
					)}

					{errorMessage && (
						<Text style={[styles.error,{color: theme.error}]}>{errorMessage}</Text>
					)}

					{logEntries.length > 0 && (
						<View style={[styles.card,{backgroundColor: theme.cardBackground,borderColor: theme.border}]}>
							<Text style={[styles.cardTitle,{color: theme.textPrimary}]}>Historial rápido</Text>
							{logEntries.map(entry => (
								<View key={entry.id} style={styles.logRow}>
									<View style={[styles.logIndicator,getLogIndicatorStyle(entry.action,theme)]} />
									<View style={styles.logTextWrapper}>
										<Text style={[styles.value,{color: theme.textPrimary}]}>{entry.message}</Text>
										<Text style={[styles.logTimestamp,{color: theme.textSecondary}]}>
											{new Date(entry.timestamp).toLocaleTimeString()}
										</Text>
									</View>
								</View>
							))}
						</View>
					)}
				</ScrollView>
			</KeyboardAvoidingView>
		</CSafeAreaView>
	);
};

function getLogIndicatorStyle(action: TagLogEntry['action'],theme: ThemeType) {
	switch (action) {
		case 'scan':
			return {backgroundColor: theme.highlight};
		case 'write':
			return {backgroundColor: colors.success};
		default:
			return {backgroundColor: theme.error};
	}
}

const styles = StyleSheet.create({
	actions: {
		marginBottom: 16,
		marginTop: 20,
	},
	card: {
		borderRadius: 16,
		borderWidth: StyleSheet.hairlineWidth,
		marginBottom: 16,
		padding: 16,
	},
	cardHeader: {alignItems: 'center',flexDirection: 'row',gap: 8,marginBottom: 16},
	cardTitle: {fontSize: 16,fontWeight: '600',marginBottom: 8},
	container: {flex: 1},
	error: {fontSize: 14,fontWeight: '500',marginBottom: 16,textAlign: 'center'},
	flex: {flex: 1},
	helper: {fontSize: 13,marginBottom: 16},
	iconWrapper: {alignItems: 'center',borderRadius: 999,justifyContent: 'center',padding: 16},
	input: {borderRadius: 12,borderWidth: StyleSheet.hairlineWidth,fontSize: 16,marginTop: 6,paddingHorizontal: 14,paddingVertical: 12},
	inputGroup: {marginBottom: 12},
	label: {fontSize: 13,letterSpacing: 0.2,textTransform: 'uppercase'},
	loadingRow: {alignItems: 'center',marginBottom: 16},
	logIndicator: {borderRadius: 4,height: 8,width: 8},
	logRow: {alignItems: 'center',flexDirection: 'row',gap: 12,marginBottom: 10},
	logTextWrapper: {flex: 1},
	logTimestamp: {fontSize: 12},
	payload: {fontFamily: Platform.select({android: 'monospace',ios: 'Menlo'}),fontSize: 13,marginTop: 8},
	payloadPreview: {marginTop: 8},
	pulse: {
		alignItems: 'center',
		borderRadius: 120,
		borderWidth: 2,
		height: 120,
		justifyContent: 'center',
		marginBottom: 16,
		width: 120,
	},
	scroll: {padding: 16},
	statusCard: {alignItems: 'center',borderRadius: 20,borderWidth: StyleSheet.hairlineWidth,flexDirection: 'row',padding: 16},
	statusSubtitle: {fontSize: 13,marginTop: 4},
	statusTextBlock: {flex: 1,marginLeft: 16},
	statusTitle: {fontSize: 18,fontWeight: '600'},
	value: {fontSize: 15,marginTop: 4},
});

export default ControlScreen;
