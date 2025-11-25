/**
 * Pantalla de pruebas para el módulo NFC nativo
 * 
 * IMPORTANTE: Esta pantalla es solo para testing/debugging.
 * Eliminar o comentar antes de ir a producción.
 */

import React,{useState} from 'react';
import {
	ActivityIndicator,
	Alert,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';

import {
	isNfcSupported,
	scanCheckpointTag,
	writeCheckpointTag,
} from '@/utils/nfc';
import {darkTheme} from '@/assets/theme';

export default function NFCTestScreen() {
	const [isSupported,setIsSupported] = useState<boolean | null>(null);
	const [scanning,setScanning] = useState(false);
	const [writing,setWriting] = useState(false);
	const [lastScan,setLastScan] = useState<any>(null);
	const [logs,setLogs] = useState<string[]>([]);

	const addLog = (message: string) => {
		const timestamp = new Date().toLocaleTimeString();
		setLogs((prev) => [`[${timestamp}] ${message}`,...prev].slice(0,20));
	};

	// Test 1: Verificar soporte NFC
	const testNfcSupport = async () => {
		try {
			addLog('🔍 Verificando soporte NFC...');
			const supported = await isNfcSupported();
			setIsSupported(supported);

			if (supported) {
				addLog('✅ NFC soportado en este dispositivo');
				Alert.alert('Éxito','NFC está soportado en este dispositivo');
			} else {
				addLog('❌ NFC NO soportado');
				Alert.alert('Error','NFC no está soportado en este dispositivo');
			}
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			addLog(`❌ Error: ${msg}`);
			Alert.alert('Error',msg);
		}
	};

	// Test 2: Leer tag NFC
	const testReadTag = async () => {
		try {
			setScanning(true);
			addLog('📡 Iniciando lectura NFC...');
			addLog('⏳ Acerca el tag al dispositivo (10s timeout)...');

			const result = await scanCheckpointTag(10_000);

			addLog('✅ Tag leído exitosamente');
			addLog(`📍 UID: ${result.uid}`);
			addLog(`🔧 Tech: ${result.tech}`);

			if (result.ndef?.payload) {
				addLog(`📦 Payload: ${result.ndef.payload}`);

				// Intentar parsear como JSON
				try {
					const parsed = JSON.parse(result.ndef.payload);
					addLog(`✅ JSON válido: ${JSON.stringify(parsed,null,2)}`);
				} catch {
					addLog('⚠️ El payload no es un JSON válido');
				}
			} else {
				addLog('⚠️ El tag no tiene datos NDEF');
			}

			setLastScan(result);
			Alert.alert(
				'Tag Leído',
				`UID: ${result.uid}\n\nPayload: ${result.ndef?.payload || 'Sin datos'}`,
			);
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			addLog(`❌ Error al leer: ${msg}`);
			Alert.alert('Error',`Error al leer tag: ${msg}`);
		} finally {
			setScanning(false);
		}
	};

	// Test 3: Escribir tag de prueba
	const testWriteTag = async () => {
		try {
			// Pedir confirmación
			Alert.alert(
				'Escribir Tag de Prueba',
				'¿Escribir datos de prueba en el tag NFC?\n\nEstos datos sobrescribirán el contenido actual del tag.',
				[
					{style: 'cancel',text: 'Cancelar'},
					{
						onPress: async () => {
							try {
								setWriting(true);
								const testPayload = JSON.stringify({
									id: 999,
									latitude: -33.4489,
									longitude: -70.6693,
									name: 'Test Checkpoint',
									roundId: 888,
									timestamp: new Date().toISOString(),
								});

								addLog('📝 Iniciando escritura NFC...');
								addLog(`📦 Payload: ${testPayload}`);
								addLog('⏳ Acerca un tag escribible (10s timeout)...');

								await writeCheckpointTag(testPayload,{timeoutMs: 10_000});

								addLog('✅ Tag escrito exitosamente');
								Alert.alert(
									'Éxito',
									'Tag escrito correctamente.\n\nPuedes leerlo ahora para verificar.',
								);
							} catch (error) {
								const msg = error instanceof Error ? error.message : String(error);
								addLog(`❌ Error al escribir: ${msg}`);
								Alert.alert('Error',`Error al escribir tag: ${msg}`);
							} finally {
								setWriting(false);
							}
						},
						text: 'Escribir',
					},
				],
			);
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			addLog(`❌ Error: ${msg}`);
		}
	};

	// Test 4: Escribir tag personalizado
	const testWriteCustomTag = () => {
		Alert.prompt(
			'Escribir Tag Personalizado',
			'Ingresa los datos en formato JSON:',
			[
				{style: 'cancel',text: 'Cancelar'},
				{
					onPress: async (input) => {
						try {
							setWriting(true);
							const payload = input || '{}';

							// Validar JSON
							JSON.parse(payload);

							addLog('📝 Escribiendo tag personalizado...');
							addLog(`📦 Payload: ${payload}`);

							await writeCheckpointTag(payload,{timeoutMs: 10_000});

							addLog('✅ Tag personalizado escrito');
							Alert.alert('Éxito','Tag escrito correctamente');
						} catch (error) {
							const msg = error instanceof Error ? error.message : String(error);
							addLog(`❌ Error: ${msg}`);
							Alert.alert('Error',msg);
						} finally {
							setWriting(false);
						}
					},
					text: 'Escribir',
				},
			],
			'plain-text',
			'{"id":1,"roundId":10,"latitude":-33.4489,"longitude":-70.6693,"name":"Test"}',
		);
	};

	const clearLogs = () => {
		setLogs([]);
		addLog('🧹 Logs limpiados');
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>🧪 Pruebas Módulo NFC</Text>

			{/* Estado de soporte */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Estado del Módulo</Text>
				{isSupported === null ? (
					<Text style={styles.statusText}>No verificado aún</Text>
				) : isSupported ? (
					<Text style={[styles.statusText,styles.success]}>
						✅ NFC Soportado
					</Text>
				) : (
					<Text style={[styles.statusText,styles.error]}>
						❌ NFC No Soportado
					</Text>
				)}
			</View>

			{/* Botones de prueba */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Pruebas</Text>

				<TouchableOpacity onPress={testNfcSupport} style={styles.button}>
					<Text style={styles.buttonText}>1️⃣ Verificar Soporte NFC</Text>
				</TouchableOpacity>

				<TouchableOpacity
					disabled={scanning}
					onPress={testReadTag}
					style={[styles.button,scanning && styles.buttonDisabled]}>
					{scanning ? (
						<ActivityIndicator color="#fff" />
					) : (
						<Text style={styles.buttonText}>2️⃣ Leer Tag NFC</Text>
					)}
				</TouchableOpacity>

				<TouchableOpacity
					disabled={writing}
					onPress={testWriteTag}
					style={[styles.button,styles.buttonWarning,writing && styles.buttonDisabled]}>
					{writing ? (
						<ActivityIndicator color="#fff" />
					) : (
						<Text style={styles.buttonText}>3️⃣ Escribir Tag de Prueba</Text>
					)}
				</TouchableOpacity>

				<TouchableOpacity
					onPress={testWriteCustomTag}
					style={[styles.button,styles.buttonSecondary]}>
					<Text style={styles.buttonText}>4️⃣ Escribir Tag Personalizado</Text>
				</TouchableOpacity>
			</View>

			{/* Último escaneo */}
			{lastScan && (
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Último Escaneo</Text>
					<View style={styles.codeBlock}>
						<Text style={styles.code}>
							{JSON.stringify(lastScan,null,2)}
						</Text>
					</View>
				</View>
			)}

			{/* Logs */}
			<View style={[styles.section,styles.logsSection]}>
				<View style={styles.logsHeader}>
					<Text style={styles.sectionTitle}>Logs</Text>
					<TouchableOpacity onPress={clearLogs}>
						<Text style={styles.clearButton}>Limpiar</Text>
					</TouchableOpacity>
				</View>

				<ScrollView style={styles.logsContainer}>
					{logs.length === 0 ? (
						<Text style={styles.emptyLogs}>
							No hay logs aún. Ejecuta una prueba.
						</Text>
					) : (
						logs.map((log,index) => (
							<Text key={index} style={styles.log}>
								{log}
							</Text>
						))
					)}
				</ScrollView>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	button: {
		alignItems: 'center',
		backgroundColor: darkTheme.highlight,
		borderRadius: 8,
		marginBottom: 12,
		padding: 16,
	},
	buttonDisabled: {
		opacity: 0.5,
	},
	buttonSecondary: {
		backgroundColor: '#9C27B0',
	},
	buttonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
	buttonWarning: {
		backgroundColor: '#FF9800',
	},
	clearButton: {
		color: darkTheme.highlight,
		fontSize: 14,
	},
	code: {
		color: '#4EC9B0',
		fontFamily: 'monospace',
		fontSize: 12,
	},
	codeBlock: {
		backgroundColor: '#1E1E1E',
		borderRadius: 8,
		padding: 12,
	},
	container: {
		backgroundColor: darkTheme.background,
		flex: 1,
		padding: 16,
	},
	emptyLogs: {
		color: darkTheme.textSecondary,
		fontStyle: 'italic',
		textAlign: 'center',
	},
	error: {
		color: '#F44336',
	},
	log: {
		color: '#D4D4D4',
		fontFamily: 'monospace',
		fontSize: 12,
		marginBottom: 4,
	},
	logsContainer: {
		backgroundColor: '#1E1E1E',
		borderRadius: 8,
		flex: 1,
		padding: 12,
	},
	logsHeader: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	logsSection: {
		flex: 1,
	},
	section: {
		marginBottom: 24,
	},
	sectionTitle: {
		color: darkTheme.textPrimary,
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 12,
	},
	statusText: {
		color: darkTheme.textSecondary,
		fontSize: 16,
	},
	success: {
		color: '#4CAF50',
	},
	title: {
		color: darkTheme.textPrimary,
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 24,
		textAlign: 'center',
	},
});

