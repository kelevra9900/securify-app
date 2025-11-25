import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {
	ActivityIndicator,
	Alert,
	Animated,
	FlatList,
	KeyboardAvoidingView,
	Modal,
	NativeModules,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import {Nfc,SmartphoneNfc} from 'lucide-react-native';

import {colors,type ThemeType} from '@/assets/theme/colors';
import type {Checkpoint} from '@/types/checkpoint';
import {CSafeAreaView,Header,PrimaryButton,ScanModal} from '@/components/atoms';
import {useTheme} from '@/context/Theme';
import {scanCheckpointTag,writeCheckpointTag} from '@/utils/nfc';
import {useGetCheckpoints} from '@/hooks/checkpoints/useGetCheckpoints';

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
	const [selectedCheckpoint,setSelectedCheckpoint] = useState<Checkpoint | null>(null);
	const [checkpointModalVisible,setCheckpointModalVisible] = useState(false);
	const [logEntries,setLogEntries] = useState<TagLogEntry[]>([]);
	const [errorMessage,setErrorMessage] = useState<null | string>(null);
	const [writeModalVisible,setWriteModalVisible] = useState(false);
	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isPending,
	} = useGetCheckpoints({limit: 30});
	const checkpoints = useMemo(
		() => data?.pages.flatMap(page => page.items) ?? [],
		[data],
	);
	const isLoadingCheckpoints = isPending && checkpoints.length === 0;
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

	const handleOpenCheckpointPicker = useCallback(() => {
		setCheckpointModalVisible(true);
	},[]);

	const handleCloseCheckpointPicker = useCallback(() => {
		setCheckpointModalVisible(false);
	},[]);

	const handleSelectCheckpoint = useCallback((checkpoint: Checkpoint) => {
		setSelectedCheckpoint(checkpoint);
		setCheckpointId(String(checkpoint.id));
		setCheckpointModalVisible(false);
	},[]);

	const loadMoreCheckpoints = useCallback(() => {
		if (hasNextPage && !isFetchingNextPage) {
			void fetchNextPage();
		}
	},[fetchNextPage,hasNextPage,isFetchingNextPage]);

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

			// eslint-disable-next-line no-console
			console.log('📖 [SCAN] Tag detectado - Raw result:',JSON.stringify(rawResult,null,2));

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

			// eslint-disable-next-line no-console
			console.log('📊 [SCAN] Información procesada:',JSON.stringify(info,null,2));

			if (!rawResult.ndef?.payload) {
				// eslint-disable-next-line no-console
				console.warn('⚠️ [SCAN] El tag NO tiene datos NDEF. Puede estar vacío o no formateado correctamente.');
			} else {
				// eslint-disable-next-line no-console
				console.log('✅ [SCAN] Payload NDEF leído exitosamente:',rawResult.ndef.payload);
			}

			pushLog({
				action: 'scan',
				id: `scan-${now}`,
				message: rawResult.ndef?.payload
					? `Tag ${rawResult.uid} leído con datos NDEF`
					: `Tag ${rawResult.uid} leído (sin datos NDEF)`,
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
			throw new Error('Selecciona un checkpoint antes de escribir.');
		}

		const payload = {
			alias: alias.trim() || undefined,
			checkpointId: checkpoint,
			generatedAt: new Date().toISOString(),
		};

		return JSON.stringify(payload);
	},[alias,checkpointId]);

	const handleWrite = useCallback(async () => {
		// eslint-disable-next-line no-console
		console.log('handleWrite ====>');
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

			// Mostrar modal de escritura
			setWriteModalVisible(true);
			setMode('writing');

			// Pequeño delay para que el modal se renderice
			await new Promise((resolve) => setTimeout(resolve,500));

			// eslint-disable-next-line no-console
			console.log('📝 [WRITE] Payload a escribir:',payload);
			// eslint-disable-next-line no-console
			console.log('📝 [WRITE] Tamaño del payload:',payload.length,'bytes');

			// Usar writeCheckpointTag con timeout
			await writeCheckpointTag(payload,{timeoutMs: TIMEOUT_MS});

			// eslint-disable-next-line no-console
			console.log('✅ [WRITE] Escritura completada sin errores');

			const now = new Date().toISOString();
			setTagInfo({
				action: 'write',
				ndefPayload: payload,
				tech: 'NDEF',
				timestamp: now,
				uid: 'written-tag',
			});

			pushLog({
				action: 'write',
				id: `write-${now}`,
				message: 'Tag NFC escrito exitosamente',
				timestamp: now,
			});

			// eslint-disable-next-line no-console
			console.log('🔍 [WRITE] Ahora lee el tag para verificar la escritura');

			Alert.alert(
				'✅ Escritura completada',
				'Ahora lee el tag con "Leer tag NFC" para verificar que los datos se escribieron correctamente.',
				[{text: 'OK'}]
			);
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
			setWriteModalVisible(false);
		}
	},[buildPayload,canWrite,mode,pushLog,supportState]);

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

	const renderCheckpointItem = useCallback(
		({item}: {item: Checkpoint}) => (
			<TouchableOpacity
				activeOpacity={0.85}
				onPress={() => handleSelectCheckpoint(item)}
				style={[
					styles.checkpointRow,
					{backgroundColor: theme.background,borderColor: theme.border},
				]}
			>
				<View style={styles.checkpointRowText}>
					<Text style={[styles.checkpointRowTitle,{color: theme.textPrimary}]}>
						{item.location}
					</Text>
					<Text style={[styles.checkpointRowSubtitle,{color: theme.textSecondary}]}>
						ID: {item.id}
					</Text>
				</View>
			</TouchableOpacity>
		),
		[handleSelectCheckpoint,theme],
	);

	const checkpointKeyExtractor = useCallback((item: Checkpoint) => item.id.toString(),[]);

	const renderEmptyCheckpoints = useCallback(() => (
		<View style={styles.modalEmpty}>
			{isLoadingCheckpoints ? (
				<ActivityIndicator color={theme.highlight} />
			) : (
				<Text style={[styles.checkpointRowSubtitle,{color: theme.textSecondary}]}>
					No encontramos checkpoints disponibles.
				</Text>
			)}
		</View>
	),[isLoadingCheckpoints,theme]);

	const renderCheckpointFooter = useCallback(() => {
		if (!isFetchingNextPage) {
			return null;
		}
		return (
			<View style={styles.modalFooter}>
				<ActivityIndicator color={theme.highlight} />
			</View>
		);
	},[isFetchingNextPage,theme]);

	return (
		<CSafeAreaView edges={['top','bottom']} style={[styles.container,{backgroundColor: theme.background}]}>
			<Header title="Control de Tags NFC" />
			<Modal
				animationType="slide"
				onRequestClose={handleCloseCheckpointPicker}
				transparent
				visible={checkpointModalVisible}
			>
				<View style={styles.modalOverlay}>
					<View
						style={[
							styles.modalContent,
							{backgroundColor: theme.cardBackground,borderColor: theme.border},
						]}
					>
						<Text style={[styles.modalTitle,{color: theme.textPrimary}]}>
							Selecciona un checkpoint
						</Text>
						<FlatList<Checkpoint>
							contentContainerStyle={styles.modalListContent}
							data={checkpoints}
							ItemSeparatorComponent={() => (
								<View style={[styles.separator,{backgroundColor: theme.border}]} />
							)}
							keyboardShouldPersistTaps="handled"
							keyExtractor={checkpointKeyExtractor}
							ListEmptyComponent={renderEmptyCheckpoints}
							ListFooterComponent={renderCheckpointFooter}
							onEndReached={loadMoreCheckpoints}
							onEndReachedThreshold={0.4}
							renderItem={renderCheckpointItem}
						/>
						<PrimaryButton
							label="Cerrar"
							onPress={handleCloseCheckpointPicker}
							style={styles.modalCloseButton}
						/>
					</View>
				</View>
			</Modal>

			{/* Modal de escritura NFC */}
			<ScanModal
				isReady={true}
				name={selectedCheckpoint?.location || 'Escribiendo tag NFC'}
				onCancel={() => {
					setWriteModalVisible(false);
					setMode('idle');
				}}
				visible={writeModalVisible}
			/>

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
							<Text style={[styles.label,{color: theme.textSecondary}]}>Checkpoint</Text>
							<TouchableOpacity
								activeOpacity={0.85}
								onPress={handleOpenCheckpointPicker}
								style={[
									styles.selectInput,
									{
										backgroundColor: theme.background,
										borderColor: theme.border,
									},
								]}
							>
								<View style={styles.selectLabels}>
									<Text
										numberOfLines={1}
										style={[
											styles.selectText,
											{color: theme.textPrimary},
										]}
									>
										{selectedCheckpoint
											? selectedCheckpoint.location
											: isLoadingCheckpoints
												? 'Cargando checkpoints...'
												: 'Selecciona un checkpoint'}
									</Text>
									{selectedCheckpoint && (
										<Text
											style={[
												styles.selectSecondary,
												{color: theme.textSecondary},
											]}
										>
											ID: {selectedCheckpoint.id}
										</Text>
									)}
								</View>
								{isLoadingCheckpoints ? (
									<ActivityIndicator color={theme.highlight} size="small" />
								) : (
									<Text style={[styles.selectIndicator,{color: theme.textSecondary}]}>v</Text>
								)}
							</TouchableOpacity>
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
									<Text selectable style={[styles.payload,{color: theme.textPrimary}]}>
										{(() => {
											try {
												// Intentar formatear como JSON si es válido
												const parsed = JSON.parse(tagInfo.ndefPayload);
												return JSON.stringify(parsed,null,2);
											} catch {
												// Si no es JSON válido, mostrar tal cual
												return tagInfo.ndefPayload;
											}
										})()}
									</Text>
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
	checkpointRow: {
		borderRadius: 12,
		borderWidth: StyleSheet.hairlineWidth,
		marginBottom: 4,
		paddingHorizontal: 14,
		paddingVertical: 12,
	},
	checkpointRowSubtitle: {fontSize: 13,marginTop: 4},
	checkpointRowText: {flex: 1},
	checkpointRowTitle: {fontSize: 16,fontWeight: '500'},
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
	modalCloseButton: {marginTop: 16},
	modalContent: {
		borderRadius: 18,
		borderWidth: StyleSheet.hairlineWidth,
		maxHeight: '70%',
		padding: 16,
		width: '90%',
	},
	modalEmpty: {alignItems: 'center',justifyContent: 'center',minHeight: 140},
	modalFooter: {alignItems: 'center',paddingVertical: 12},
	modalListContent: {paddingBottom: 8},
	modalOverlay: {
		alignItems: 'center',
		backgroundColor: 'rgba(0,0,0,0.45)',
		flex: 1,
		justifyContent: 'center',
		padding: 16,
	},
	modalTitle: {fontSize: 18,fontWeight: '600',marginBottom: 8,textAlign: 'center'},
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
	selectIndicator: {fontSize: 16,marginLeft: 12},
	selectInput: {
		alignItems: 'center',
		borderRadius: 12,
		borderWidth: StyleSheet.hairlineWidth,
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 6,
		paddingHorizontal: 14,
		paddingVertical: 12,
	},
	selectLabels: {flex: 1,marginRight: 12},
	selectSecondary: {fontSize: 13,marginTop: 2},
	selectText: {fontSize: 16,fontWeight: '500'},
	separator: {height: 8},
	statusCard: {alignItems: 'center',borderRadius: 20,borderWidth: StyleSheet.hairlineWidth,flexDirection: 'row',padding: 16},
	statusSubtitle: {fontSize: 13,marginTop: 4},
	statusTextBlock: {flex: 1,marginLeft: 16},
	statusTitle: {fontSize: 18,fontWeight: '600'},
	value: {fontSize: 15,marginTop: 4},
});

export default ControlScreen;
