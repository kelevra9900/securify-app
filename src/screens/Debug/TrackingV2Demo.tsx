import React,{useEffect,useState} from 'react';
import {
	Alert,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

// Componentes
import {CSafeAreaView,Header,PrimaryButton} from '@/components/atoms';
import {useTheme} from '@/context/Theme';
import {colors} from '@/assets/theme';

// Hooks de tracking v2
import {
	useTrackConnectionV2,
	useTrackLocationV2,
	useTrackMetricsV2,
	useTrackUsersV2,
	useTrackWatchV2,
} from '@/sockets/TrackSocketV2Provider';

import {
	BATTERY_SAVER_CONFIG,
	PATROL_TRACKING_CONFIG,
	SUPERVISOR_TRACKING_CONFIG,
	useTrackingV2Integration,
} from '@/hooks/useTrackingV2Integration';

/**
 * Pantalla de demostración del WebSocket Tracker API v2
 * 
 * Esta pantalla muestra todas las funcionalidades del nuevo sistema:
 * - Conexión y estado del WebSocket v2
 * - Lista de usuarios en tiempo real
 * - Batch updates cada 200ms
 * - Watch de usuarios específicos
 * - Watch de zonas geográficas
 * - Integración con tracking nativo
 * - Métricas de rendimiento
 */
export default function TrackingV2DemoScreen() {
	const {top} = useSafeAreaInsets();
	const {theme} = useTheme();

	// ============================================================================
	// HOOKS DE TRACKING V2
	// ============================================================================

	const connection = useTrackConnectionV2();
	const {batchUpdates,clearBatchUpdates,refreshUsers,users} = useTrackUsersV2();
	const {canSendLocation,sendCurrentLocation} = useTrackLocationV2();
	const {
		toggleUserWatch,
		unwatchUser,
		unwatchZone,
		watchedUsers,
		watchedZones,
		watchUser,
		watchZone,
	} = useTrackWatchV2();
	const {debugInfo,metrics} = useTrackMetricsV2();

	// Hook de integración completa
	const integration = useTrackingV2Integration(PATROL_TRACKING_CONFIG);

	// ============================================================================
	// ESTADO LOCAL
	// ============================================================================

	const [selectedConfig,setSelectedConfig] = useState<'battery' | 'patrol' | 'supervisor'>('patrol');
	const [autoRefresh,setAutoRefresh] = useState(true);
	const [showMetrics,setShowMetrics] = useState(false);
	const [testZone,setTestZone] = useState({
		active: false,
		lat: 19.432_608,
		lng: -99.133_209,
		radius: 1000,
	});

	// ============================================================================
	// EFECTOS
	// ============================================================================

	// Auto-refresh de usuarios cada 30 segundos
	useEffect(() => {
		if (!autoRefresh) {return;}

		const interval = setInterval(() => {
			refreshUsers();
		},30_000);

		return () => clearInterval(interval);
	},[autoRefresh,refreshUsers]);

	// Limpiar batch updates procesados cada 5 segundos
	useEffect(() => {
		if (batchUpdates.length === 0) {return;}

		const timeout = setTimeout(() => {
			clearBatchUpdates();
		},5000);

		return () => clearTimeout(timeout);
	},[batchUpdates,clearBatchUpdates]);

	// ============================================================================
	// HANDLERS
	// ============================================================================

	const handleConfigChange = (config: typeof selectedConfig) => {
		setSelectedConfig(config);

		const configs = {
			battery: BATTERY_SAVER_CONFIG,
			patrol: PATROL_TRACKING_CONFIG,
			supervisor: SUPERVISOR_TRACKING_CONFIG,
		};

		Alert.alert(
			'Cambiar Configuración',
			`¿Quieres cambiar a la configuración de ${config}? Esto reiniciará el tracking.`,
			[
				{style: 'cancel',text: 'Cancelar'},
				{
					onPress: async () => {
						await integration.stopIntegratedTracking();
						// Aquí podrías reinicializar con la nueva configuración
						// integration = useTrackingV2Integration(configs[config]);
					},
					text: 'Cambiar',
				},
			]
		);
	};

	const handleZoneTest = () => {
		if (testZone.active) {
			unwatchZone(testZone.lat,testZone.lng,testZone.radius);
			setTestZone(prev => ({...prev,active: false}));
		} else {
			watchZone(testZone.lat,testZone.lng,testZone.radius);
			setTestZone(prev => ({...prev,active: true}));
		}
	};

	// ============================================================================
	// RENDERS DE SECCIONES
	// ============================================================================

	const renderConnectionStatus = () => (
		<View style={[styles.section,{backgroundColor: theme.card}]}>
			<Text style={[styles.sectionTitle,{color: theme.text}]}>
				🔌 Estado de Conexión
			</Text>

			<StatusRow
				label="WebSocket Conectado"
				theme={theme}
				value={connection.isConnected}
			/>
			<StatusRow
				label="Tracking Suscrito"
				theme={theme}
				value={connection.isSubscribed}
			/>
			<StatusRow
				label="Sistema Listo"
				theme={theme}
				value={connection.isReady}
			/>
			<StatusRow
				label="Tracking Activo"
				theme={theme}
				value={integration.isTrackingActive}
			/>

			{connection.lastError && (
				<Text style={[styles.errorText,{color: colors.error}]}>
					Error: {connection.lastError.code} - {connection.lastError.message}
				</Text>
			)}
		</View>
	);

	const renderUsersList = () => (
		<View style={[styles.section,{backgroundColor: theme.card}]}>
			<View style={styles.sectionHeader}>
				<Text style={[styles.sectionTitle,{color: theme.text}]}>
					👥 Usuarios Online ({users.length})
				</Text>
				<TouchableOpacity
					onPress={refreshUsers}
					style={[styles.refreshButton,{backgroundColor: colors.primary}]}
				>
					<Text style={styles.refreshButtonText}>🔄</Text>
				</TouchableOpacity>
			</View>

			{users.slice(0,5).map(user => (
				<View key={user.id} style={styles.userRow}>
					<View style={styles.userInfo}>
						<Text style={[styles.userName,{color: theme.text}]}>
							{user.name}
						</Text>
						<Text style={[styles.userDetails,{color: theme.textSecondary}]}>
							{user.jobPosition} • {user.online ? '🟢 Online' : '🔴 Offline'}
						</Text>
						{user.latitude && user.longitude && (
							<Text style={[styles.userLocation,{color: theme.textSecondary}]}>
								📍 {user.latitude.toFixed(4)}, {user.longitude.toFixed(4)}
							</Text>
						)}
					</View>

					<TouchableOpacity
						onPress={() => toggleUserWatch(user.id)}
						style={[
							styles.watchButton,
							{
								backgroundColor: watchedUsers.includes(user.id)
									? colors.success
									: colors.background,
							},
						]}
					>
						<Text style={styles.watchButtonText}>
							{watchedUsers.includes(user.id) ? '👁️' : '👁️‍🗨️'}
						</Text>
					</TouchableOpacity>
				</View>
			))}
		</View>
	);

	const renderBatchUpdates = () => (
		<View style={[styles.section,{backgroundColor: theme.card}]}>
			<View style={styles.sectionHeader}>
				<Text style={[styles.sectionTitle,{color: theme.text}]}>
					📦 Batch Updates ({batchUpdates.length})
				</Text>
				{batchUpdates.length > 0 && (
					<TouchableOpacity
						onPress={clearBatchUpdates}
						style={[styles.clearButton,{backgroundColor: colors.warning}]}
					>
						<Text style={styles.clearButtonText}>🗑️</Text>
					</TouchableOpacity>
				)}
			</View>

			{batchUpdates.slice(-3).map((update,index) => (
				<View key={`${update.userId}-${update.timestamp}`} style={styles.updateRow}>
					<Text style={[styles.updateText,{color: theme.text}]}>
						Usuario {update.userId}: {update.location.latitude.toFixed(4)}, {update.location.longitude.toFixed(4)}
					</Text>
					<Text style={[styles.updateTime,{color: theme.textSecondary}]}>
						{new Date(update.timestamp).toLocaleTimeString()}
					</Text>
				</View>
			))}

			{batchUpdates.length === 0 && (
				<Text style={[styles.emptyText,{color: theme.textSecondary}]}>
					No hay updates recientes
				</Text>
			)}
		</View>
	);

	const renderControls = () => (
		<View style={[styles.section,{backgroundColor: theme.card}]}>
			<Text style={[styles.sectionTitle,{color: theme.text}]}>
				🎮 Controles
			</Text>

			<PrimaryButton
				onPress={integration.isTrackingActive
					? integration.stopIntegratedTracking
					: integration.startIntegratedTracking
				}
				style={[
					styles.controlButton,
					{backgroundColor: integration.isTrackingActive ? colors.error : colors.primary}
				]}
				title={integration.isTrackingActive ? 'Detener Tracking' : 'Iniciar Tracking'}
			/>

			<PrimaryButton
				disabled={!canSendLocation}
				onPress={sendCurrentLocation}
				style={styles.controlButton}
				title="Enviar Ubicación Manual"
			/>

			<PrimaryButton
				onPress={handleZoneTest}
				style={styles.controlButton}
				title={testZone.active ? 'Dejar de Vigilar Zona' : 'Vigilar Zona de Prueba'}
			/>

			<View style={styles.switchRow}>
				<Text style={[styles.switchLabel,{color: theme.text}]}>
					Auto-refresh usuarios
				</Text>
				<Switch
					onValueChange={setAutoRefresh}
					trackColor={{false: theme.border,true: colors.primary}}
					value={autoRefresh}
				/>
			</View>

			<View style={styles.switchRow}>
				<Text style={[styles.switchLabel,{color: theme.text}]}>
					Mostrar métricas
				</Text>
				<Switch
					onValueChange={setShowMetrics}
					trackColor={{false: theme.border,true: colors.primary}}
					value={showMetrics}
				/>
			</View>
		</View>
	);

	const renderMetrics = () => {
		if (!showMetrics) {return null;}

		return (
			<View style={[styles.section,{backgroundColor: theme.card}]}>
				<Text style={[styles.sectionTitle,{color: theme.text}]}>
					📊 Métricas de Rendimiento
				</Text>

				<MetricRow label="Total Updates" theme={theme} value={metrics.totalUpdates} />
				<MetricRow label="Updates/Segundo" theme={theme} value={metrics.updatesPerSecond.toFixed(1)} />
				<MetricRow label="Latencia Promedio" theme={theme} value={`${metrics.avgLatency.toFixed(0)}ms`} />
				<MetricRow label="Reconexiones" theme={theme} value={metrics.reconnects} />
				<MetricRow label="Último Batch" theme={theme} value={metrics.lastBatchSize} />

				<Text style={[styles.debugTitle,{color: theme.text}]}>Debug Info:</Text>
				<Text style={[styles.debugText,{color: theme.textSecondary}]}>
					{JSON.stringify(debugInfo,null,2)}
				</Text>
			</View>
		);
	};

	// ============================================================================
	// RENDER PRINCIPAL
	// ============================================================================

	return (
		<CSafeAreaView style={[styles.container,{backgroundColor: theme.background}]}>
			<Header
				canGoBack={true}
				paddingTop={top}
				title="Tracking v2 Demo"
			/>

			<ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
				{renderConnectionStatus()}
				{renderUsersList()}
				{renderBatchUpdates()}
				{renderControls()}
				{renderMetrics()}
			</ScrollView>
		</CSafeAreaView>
	);
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

interface StatusRowProps {
	label: string;
	theme: any;
	value: boolean;
}

const StatusRow: React.FC<StatusRowProps> = ({label,theme,value}) => (
	<View style={styles.statusRow}>
		<Text style={[styles.statusLabel,{color: theme.text}]}>
			{label}
		</Text>
		<Text style={[styles.statusValue,{color: value ? colors.success : colors.error}]}>
			{value ? '✅ Sí' : '❌ No'}
		</Text>
	</View>
);

interface MetricRowProps {
	label: string;
	theme: any;
	value: number | string;
}

const MetricRow: React.FC<MetricRowProps> = ({label,theme,value}) => (
	<View style={styles.statusRow}>
		<Text style={[styles.statusLabel,{color: theme.text}]}>
			{label}
		</Text>
		<Text style={[styles.statusValue,{color: theme.textSecondary}]}>
			{value}
		</Text>
	</View>
);

// ============================================================================
// ESTILOS
// ============================================================================

const styles = StyleSheet.create({
	clearButton: {
		borderRadius: 8,
		padding: 8,
	},
	clearButtonText: {
		color: 'white',
		fontSize: 14,
	},
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		padding: 16,
	},
	controlButton: {
		marginBottom: 12,
	},
	debugText: {
		backgroundColor: colors.backgroundSecondary,
		borderRadius: 4,
		fontFamily: 'monospace',
		fontSize: 10,
		padding: 8,
	},
	debugTitle: {
		fontSize: 14,
		fontWeight: '600',
		marginBottom: 8,
		marginTop: 12,
	},
	emptyText: {
		fontSize: 14,
		fontStyle: 'italic',
		textAlign: 'center',
	},
	errorText: {
		fontSize: 12,
		fontStyle: 'italic',
		marginTop: 8,
	},
	refreshButton: {
		borderRadius: 8,
		padding: 8,
	},
	refreshButtonText: {
		color: 'white',
		fontSize: 14,
	},
	section: {
		borderRadius: 12,
		elevation: 2,
		marginBottom: 16,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: {height: 1,width: 0},
		shadowOpacity: 0.1,
		shadowRadius: 2,
	},
	sectionHeader: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 12,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 12,
	},
	statusLabel: {
		flex: 1,
		fontSize: 14,
	},
	statusRow: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingVertical: 4,
	},
	statusValue: {
		fontSize: 14,
		fontWeight: '500',
	},
	switchLabel: {
		fontSize: 14,
	},
	switchRow: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingVertical: 8,
	},
	updateRow: {
		paddingVertical: 4,
	},
	updateText: {
		fontFamily: 'monospace',
		fontSize: 12,
	},
	updateTime: {
		fontSize: 10,
		marginTop: 2,
	},
	userDetails: {
		fontSize: 12,
		marginTop: 2,
	},
	userInfo: {
		flex: 1,
	},
	userLocation: {
		fontFamily: 'monospace',
		fontSize: 10,
		marginTop: 2,
	},
	userName: {
		fontSize: 14,
		fontWeight: '500',
	},
	userRow: {
		alignItems: 'center',
		borderBottomColor: colors.border,
		borderBottomWidth: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingVertical: 8,
	},
	watchButton: {
		borderColor: colors.border,
		borderRadius: 8,
		borderWidth: 1,
		padding: 8,
	},
	watchButtonText: {
		fontSize: 16,
	},
});


