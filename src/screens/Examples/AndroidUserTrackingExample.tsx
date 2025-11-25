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

// Hook especializado para Android
import {type TrackingMode,useAndroidUserTracking} from '@/hooks/useAndroidUserTracking';

/**
 * Pantalla de ejemplo para usuarios Android
 * 
 * Demuestra cómo usar el sistema completo de tracking para usuarios finales:
 * - Tracking nativo en segundo plano
 * - WebSocket v2 para confirmaciones inmediatas
 * - Diferentes modos de tracking
 * - Métricas en tiempo real
 */
export default function AndroidUserTrackingExampleScreen() {
	const {top} = useSafeAreaInsets();
	const {theme} = useTheme();

	// ============================================================================
	// HOOK PRINCIPAL DE ANDROID TRACKING
	// ============================================================================

	const {
		canSendLocation,
		changeTrackingMode,
		connectionStatus,
		currentUser,
		isTrackingActive,
		lastManualLocation,
		metrics,
		sendManualLocation,
		startPatrolTracking,
		stopPatrolTracking,
		trackingMode,
		wsConnected,
	} = useAndroidUserTracking('normal');

	// ============================================================================
	// ESTADO LOCAL
	// ============================================================================

	const [autoLocationEnabled,setAutoLocationEnabled] = useState(false);
	const [showAdvancedMetrics,setShowAdvancedMetrics] = useState(false);

	// ============================================================================
	// AUTO ENVÍO DE UBICACIÓN CADA 30 SEGUNDOS (EJEMPLO)
	// ============================================================================

	useEffect(() => {
		if (!autoLocationEnabled || !canSendLocation) {return;}

		const interval = setInterval(async () => {
			console.log('[Example] 🔄 Auto-enviando ubicación...');
			await sendManualLocation();
		},30_000); // 30 segundos

		return () => clearInterval(interval);
	},[autoLocationEnabled,canSendLocation,sendManualLocation]);

	// ============================================================================
	// HANDLERS
	// ============================================================================

	const handleToggleTracking = async () => {
		if (isTrackingActive) {
			Alert.alert(
				'Finalizar Patrullaje',
				'¿Estás seguro de que quieres finalizar el patrullaje?',
				[
					{style: 'cancel',text: 'Cancelar'},
					{onPress: stopPatrolTracking,style: 'destructive',text: 'Finalizar'},
				]
			);
		} else {
			Alert.alert(
				'Iniciar Patrullaje',
				'¿Quieres iniciar el tracking de patrullaje? Se activará el GPS y el envío de ubicaciones.',
				[
					{style: 'cancel',text: 'Cancelar'},
					{onPress: startPatrolTracking,text: 'Iniciar'},
				]
			);
		}
	};

	const handleChangeModePress = () => {
		const modes: Array<{description: string; mode: TrackingMode; title: string;}> = [
			{
				description: 'Tracking completo con GPS activo y confirmaciones WebSocket',
				mode: 'normal',
				title: 'Normal'
			},
			{
				description: 'Tracking reducido con intervalos más largos',
				mode: 'battery_saver',
				title: 'Ahorro de Batería'
			},
			{
				description: 'Solo ubicaciones manuales, sin tracking automático',
				mode: 'manual_only',
				title: 'Solo Manual'
			},
		];

		Alert.alert(
			'Cambiar Modo de Tracking',
			'Selecciona el modo de tracking:',
			modes.map(({description,mode,title}) => ({
				onPress: () => {
					Alert.alert(title,description,[
						{style: 'cancel',text: 'Cancelar'},
						{onPress: () => changeTrackingMode(mode),text: 'Cambiar'},
					]);
				},
				text: `${title}${trackingMode === mode ? ' ✓' : ''}`,
			})).concat([{style: 'cancel',text: 'Cancelar'}])
		);
	};

	const handleSendLocationPress = async () => {
		const success = await sendManualLocation();

		if (success) {
			Alert.alert('✅ Éxito','Ubicación enviada correctamente');
		} else {
			Alert.alert('❌ Error','No se pudo enviar la ubicación. Verifique la conexión.');
		}
	};

	// ============================================================================
	// RENDERS DE SECCIONES
	// ============================================================================

	const renderUserInfo = () => (
		<View style={[styles.section,{backgroundColor: theme.card}]}>
			<Text style={[styles.sectionTitle,{color: theme.text}]}>
				👤 Usuario Actual
			</Text>

			{currentUser ? (
				<>
					<InfoRow label="Nombre" theme={theme} value={`${currentUser.firstName} ${currentUser.lastName}`} />
					<InfoRow label="Email" theme={theme} value={currentUser.email} />
					<InfoRow label="Rol" theme={theme} value={currentUser.role || 'N/A'} />
				</>
			) : (
				<Text style={[styles.noData,{color: theme.textSecondary}]}>
					No hay información de usuario disponible
				</Text>
			)}
		</View>
	);

	const renderTrackingStatus = () => (
		<View style={[styles.section,{backgroundColor: theme.card}]}>
			<Text style={[styles.sectionTitle,{color: theme.text}]}>
				📍 Estado del Tracking
			</Text>

			<StatusRow
				icon={isTrackingActive ? '🟢' : '🔴'}
				label="Tracking Activo"
				theme={theme}
				value={isTrackingActive}
			/>
			<StatusRow
				icon={wsConnected ? '🟢' : '🔴'}
				label="WebSocket Conectado"
				theme={theme}
				value={wsConnected}
			/>
			<StatusRow
				icon={canSendLocation ? '✅' : '❌'}
				label="Puede Enviar Ubicación"
				theme={theme}
				value={canSendLocation}
			/>

			<InfoRow label="Modo Actual" theme={theme} value={trackingMode.replace('_',' ').toUpperCase()} />

			{lastManualLocation && (
				<View style={styles.locationRow}>
					<Text style={[styles.locationLabel,{color: theme.text}]}>
						📍 Última Ubicación:
					</Text>
					<Text style={[styles.locationValue,{color: theme.textSecondary}]}>
						{lastManualLocation.lat.toFixed(6)}, {lastManualLocation.lng.toFixed(6)}
					</Text>
				</View>
			)}
		</View>
	);

	const renderControls = () => (
		<View style={[styles.section,{backgroundColor: theme.card}]}>
			<Text style={[styles.sectionTitle,{color: theme.text}]}>
				🎮 Controles
			</Text>

			<PrimaryButton
				onPress={handleToggleTracking}
				style={[
					styles.controlButton,
					{backgroundColor: isTrackingActive ? colors.error : colors.primary}
				]}
				title={isTrackingActive ? '⏹️ Finalizar Patrullaje' : '▶️ Iniciar Patrullaje'}
			/>

			<PrimaryButton
				disabled={!canSendLocation}
				onPress={handleSendLocationPress}
				style={styles.controlButton}
				title="📍 Enviar Ubicación Manual"
			/>

			<PrimaryButton
				onPress={handleChangeModePress}
				style={[styles.controlButton,{backgroundColor: colors.info}]}
				title={`🔄 Cambiar Modo (${trackingMode})`}
			/>

			<View style={styles.switchRow}>
				<Text style={[styles.switchLabel,{color: theme.text}]}>
					🔄 Auto-envío cada 30s
				</Text>
				<Switch
					disabled={!canSendLocation}
					onValueChange={setAutoLocationEnabled}
					trackColor={{false: theme.border,true: colors.success}}
					value={autoLocationEnabled}
				/>
			</View>
		</View>
	);

	const renderMetrics = () => (
		<View style={[styles.section,{backgroundColor: theme.card}]}>
			<View style={styles.sectionHeader}>
				<Text style={[styles.sectionTitle,{color: theme.text}]}>
					📊 Métricas de Rendimiento
				</Text>
				<TouchableOpacity
					onPress={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
					style={[styles.toggleButton,{backgroundColor: colors.info}]}
				>
					<Text style={styles.toggleButtonText}>
						{showAdvancedMetrics ? '📈' : '📊'}
					</Text>
				</TouchableOpacity>
			</View>

			<MetricRow label="Ubicaciones Enviadas" theme={theme} value={metrics.locationsSubmitted} />
			<MetricRow label="Ubicaciones Confirmadas" theme={theme} value={metrics.locationsConfirmed} />
			<MetricRow label="Tasa de Éxito" theme={theme} value={`${metrics.locationsSubmitted > 0 ? Math.round((metrics.locationsConfirmed / metrics.locationsSubmitted) * 100) : 0}%`} />

			{showAdvancedMetrics && (
				<>
					<MetricRow label="Latencia Promedio" theme={theme} value={`${metrics.avgLatency.toFixed(0)}ms`} />
					<MetricRow label="Reconexiones" theme={theme} value={metrics.reconnects} />
					<MetricRow label="Errores" theme={theme} value={metrics.errors} />
					<MetricRow label="Último Envío" theme={theme} value={
						metrics.lastLocationTime > 0
							? new Date(metrics.lastLocationTime).toLocaleTimeString()
							: 'N/A'
					} />
				</>
			)}
		</View>
	);

	const renderInstructions = () => (
		<View style={[styles.section,{backgroundColor: theme.card}]}>
			<Text style={[styles.sectionTitle,{color: theme.text}]}>
				ℹ️ Instrucciones de Uso
			</Text>

			<Text style={[styles.instructionText,{color: theme.textSecondary}]}>
				1. <Text style={{fontWeight: 'bold'}}>Iniciar Patrullaje:</Text> Activa el tracking automático y las ubicaciones periódicas
			</Text>

			<Text style={[styles.instructionText,{color: theme.textSecondary}]}>
				2. <Text style={{fontWeight: 'bold'}}>Envío Manual:</Text> Envía tu ubicación actual inmediatamente
			</Text>

			<Text style={[styles.instructionText,{color: theme.textSecondary}]}>
				3. <Text style={{fontWeight: 'bold'}}>Modos de Tracking:</Text> Normal (completo), Ahorro de Batería (reducido), Solo Manual
			</Text>

			<Text style={[styles.instructionText,{color: theme.textSecondary}]}>
				4. <Text style={{fontWeight: 'bold'}}>Sistema Dual:</Text> Tracking nativo en segundo plano + WebSocket para confirmaciones
			</Text>
		</View>
	);

	// ============================================================================
	// RENDER PRINCIPAL
	// ============================================================================

	return (
		<CSafeAreaView style={[styles.container,{backgroundColor: theme.background}]}>
			<Header
				canGoBack={true}
				paddingTop={top}
				title="Android User Tracking"
			/>

			<ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
				{renderUserInfo()}
				{renderTrackingStatus()}
				{renderControls()}
				{renderMetrics()}
				{renderInstructions()}
			</ScrollView>
		</CSafeAreaView>
	);
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

interface StatusRowProps {
	icon?: string;
	label: string;
	theme: any;
	value: boolean;
}

const StatusRow: React.FC<StatusRowProps> = ({icon,label,theme,value}) => (
	<View style={styles.statusRow}>
		<Text style={[styles.statusLabel,{color: theme.text}]}>
			{icon && `${icon} `}{label}
		</Text>
		<Text style={[styles.statusValue,{color: value ? colors.success : colors.error}]}>
			{value ? 'Sí' : 'No'}
		</Text>
	</View>
);

interface InfoRowProps {
	label: string;
	theme: any;
	value: string;
}

const InfoRow: React.FC<InfoRowProps> = ({label,theme,value}) => (
	<View style={styles.statusRow}>
		<Text style={[styles.statusLabel,{color: theme.text}]}>
			{label}
		</Text>
		<Text style={[styles.statusValue,{color: theme.textSecondary}]}>
			{value}
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
	instructionText: {
		fontSize: 13,
		lineHeight: 18,
		marginBottom: 8,
	},
	locationLabel: {
		fontSize: 14,
		fontWeight: '500',
	},
	locationRow: {
		paddingVertical: 4,
	},
	locationValue: {
		fontFamily: 'monospace',
		fontSize: 12,
		marginTop: 2,
	},
	noData: {
		fontSize: 14,
		fontStyle: 'italic',
		paddingVertical: 8,
		textAlign: 'center',
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
		flex: 1,
		fontSize: 14,
	},
	switchRow: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 8,
		paddingVertical: 8,
	},
	toggleButton: {
		borderRadius: 8,
		padding: 8,
	},
	toggleButtonText: {
		color: 'white',
		fontSize: 16,
	},
});


