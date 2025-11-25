import React,{useState} from 'react';
import {
	ActivityIndicator,
	Modal,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import {MotiView} from 'moti';
import {colors,darkTheme} from '@/assets/theme';

interface EndRoundDialogProps {
	completionPercentage: number;
	isCompleted: boolean;
	isLoading: boolean;
	onCancel: () => void;
	onConfirm: (notes?: string) => void;
	roundName?: string;
	visible: boolean;
	willStopTracking: boolean;
}

/**
 * Diálogo personalizado para finalizar rondas
 * 
 * Características:
 * - UI/UX mejorada con animaciones Moti
 * - Estados adaptativos (completa vs incompleta)
 * - Opción de agregar notas
 * - Información sobre tracking
 * - Estados de loading
 */
export const EndRoundDialog: React.FC<EndRoundDialogProps> = ({
	completionPercentage,
	isCompleted,
	isLoading,
	onCancel,
	onConfirm,
	roundName,
	visible,
	willStopTracking,
}) => {
	const [showNotesInput,setShowNotesInput] = useState(false);
	const [notes,setNotes] = useState('');

	console.log('[DEBUG EndRoundDialog] Props:',{
		completionPercentage,
		isCompleted,
		isLoading,
		roundName,
		visible,
		willStopTracking
	});

	const handleConfirm = () => {
		onConfirm(notes.trim() || undefined);
		setNotes('');
		setShowNotesInput(false);
	};

	const handleCancel = () => {
		onCancel();
		setNotes('');
		setShowNotesInput(false);
	};

	const handleAddNotes = () => {
		setShowNotesInput(true);
	};

	const title = isCompleted ? 'Finalizar Ronda' : 'Terminar Ronda';
	const emoji = isCompleted ? '✅' : '⚠️';
	const statusColor = isCompleted ? colors.success : colors.yellowLight;

	const message = isCompleted
		? `La ronda "${roundName}" está completa (${completionPercentage}%). ¿Deseas finalizarla?`
		: `La ronda "${roundName}" no está completa (${completionPercentage}%). ¿Deseas terminarla de todas formas?`;

	return (
		<Modal
			animationType="fade"
			onRequestClose={handleCancel}
			transparent
			visible={visible}
		>
			<View style={styles.modalBackdrop}>
				<MotiView
					animate={{opacity: 1,scale: 1}}
					from={{opacity: 0,scale: 0.95}}
					style={styles.modalCard}
					transition={{duration: 250,type: 'timing'}}
				>
					{/* Header */}
					<View style={styles.header}>
						<View style={[styles.iconContainer,{backgroundColor: statusColor}]}>
							<Text style={styles.headerEmoji}>{emoji}</Text>
						</View>
						<Text style={styles.modalTitle}>{title}</Text>
					</View>

					{/* Content */}
					<View style={styles.content}>
						<Text style={styles.modalMessage}>{message}</Text>

						{/* Progress indicator */}
						<View style={styles.progressContainer}>
							<View style={styles.progressBackground}>
								<View
									style={[
										styles.progressFill,
										{
											backgroundColor: colors.yellowColor1,
											width: `${completionPercentage}%`
										}
									]}
								/>
							</View>
							<Text style={styles.progressText}>{completionPercentage}% completado</Text>
						</View>

						{/* Tracking warning */}
						{willStopTracking && (
							<View style={styles.trackingWarning}>
								<Text style={styles.trackingIcon}>📍</Text>
								<Text style={styles.trackingText}>
									El seguimiento de ubicación se detendrá automáticamente
								</Text>
							</View>
						)}

						{/* Notes input */}
						{showNotesInput && (
							<MotiView
								animate={{height: 'auto',opacity: 1}}
								from={{height: 0,opacity: 0}}
								style={styles.notesContainer}
								transition={{duration: 200}}
							>
								<Text style={styles.notesLabel}>Notas opcionales:</Text>
								<TextInput
									autoFocus
									maxLength={500}
									multiline
									numberOfLines={3}
									onChangeText={setNotes}
									placeholder="Agrega comentarios sobre esta ronda..."
									placeholderTextColor={darkTheme.textSecondary}
									style={styles.notesInput}
									value={notes}
								/>
								<Text style={styles.characterCount}>{notes.length}/500</Text>
							</MotiView>
						)}
					</View>

					{/* Actions */}
					<View style={styles.actions}>
						{!showNotesInput ? (
							// Primera vista: opciones principales
							<>
								<TouchableOpacity
									disabled={isLoading}
									onPress={handleCancel}
									style={[styles.button,styles.cancelButton]}
								>
									<Text style={styles.cancelButtonText}>Cancelar</Text>
								</TouchableOpacity>

								<TouchableOpacity
									disabled={isLoading}
									onPress={handleAddNotes}
									style={[styles.button,styles.secondaryButton]}
								>
									<Text style={styles.secondaryButtonText}>+ Nota</Text>
								</TouchableOpacity>

								<TouchableOpacity
									disabled={isLoading}
									onPress={handleConfirm}
									style={[
										styles.button,
										styles.primaryButton,
										{backgroundColor: colors.yellowColor1},
										isLoading && styles.disabledButton
									]}
								>
									{isLoading ? (
										<ActivityIndicator color="white" size="small" />
									) : (
										<Text style={styles.primaryButtonText}>
											{isCompleted ? 'Finalizar' : 'Terminar'}
										</Text>
									)}
								</TouchableOpacity>
							</>
						) : (
							// Segunda vista: con input de notas
							<>
								<TouchableOpacity
									disabled={isLoading}
									onPress={() => setShowNotesInput(false)}
									style={[styles.button,styles.cancelButton]}
								>
									<Text style={styles.cancelButtonText}>Volver</Text>
								</TouchableOpacity>

								<TouchableOpacity
									disabled={isLoading}
									onPress={handleConfirm}
									style={[
										styles.button,
										styles.primaryButton,
										{backgroundColor: colors.yellowColor1},
										isLoading && styles.disabledButton
									]}
								>
									{isLoading ? (
										<ActivityIndicator color="white" size="small" />
									) : (
										<Text style={styles.primaryButtonText}>
											{isCompleted ? 'Finalizar' : 'Terminar'}
										</Text>
									)}
								</TouchableOpacity>
							</>
						)}
					</View>
				</MotiView>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	actions: {
		flexDirection: 'row',
		gap: 12,
		padding: 24,
	},

	button: {
		alignItems: 'center',
		borderRadius: 8,
		flex: 1,
		justifyContent: 'center',
		minHeight: 44,
		paddingHorizontal: 16,
		paddingVertical: 12,
		textAlign: 'center',
		// align text to center
		textAlignVertical: 'center',
	},

	cancelButton: {
		backgroundColor: 'transparent',
		borderColor: darkTheme.border,
		borderWidth: 1,
	},

	cancelButtonText: {
		color: darkTheme.textSecondary,
		fontSize: 16,
		fontWeight: '600',
	},

	characterCount: {
		color: darkTheme.textSecondary,
		fontSize: 12,
		marginTop: 4,
		textAlign: 'right',
	},

	content: {
		paddingBottom: 8,
		paddingHorizontal: 24,
	},

	disabledButton: {
		opacity: 0.6,
	},

	header: {
		alignItems: 'center',
		paddingBottom: 16,
		paddingHorizontal: 24,
		paddingTop: 24,
	},

	headerEmoji: {
		fontSize: 24,
	},

	iconContainer: {
		alignItems: 'center',
		borderRadius: 28,
		height: 56,
		justifyContent: 'center',
		marginBottom: 12,
		width: 56,
	},

	modalBackdrop: {
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.6)',
		flex: 1,
		justifyContent: 'center',
		padding: 20,
	},

	modalCard: {
		backgroundColor: darkTheme.cardBackground,
		borderRadius: 16,
		elevation: 8,
		maxWidth: 400,
		shadowColor: '#000',
		shadowOffset: {height: 4,width: 0},
		shadowOpacity: 0.3,
		shadowRadius: 8,
		width: '100%',
	},

	modalMessage: {
		color: darkTheme.textPrimary,
		fontSize: 16,
		lineHeight: 22,
		marginBottom: 20,
		textAlign: 'center',
	},

	modalTitle: {
		color: darkTheme.textPrimary,
		fontSize: 20,
		fontWeight: '700',
		textAlign: 'center',
	},

	notesContainer: {
		marginTop: 16,
	},

	notesInput: {
		backgroundColor: '#2A2A3E',
		borderColor: darkTheme.border,
		borderRadius: 8,
		borderWidth: 1,
		color: darkTheme.textPrimary,
		fontSize: 16,
		minHeight: 80,
		padding: 12,
		textAlignVertical: 'top',
	},

	notesLabel: {
		color: darkTheme.textPrimary,
		fontSize: 14,
		fontWeight: '600',
		marginBottom: 8,
	},

	primaryButton: {
		// backgroundColor se define dinámicamente
	},

	primaryButtonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: '600',
	},

	progressBackground: {
		backgroundColor: darkTheme.border,
		borderRadius: 4,
		height: 8,
		marginBottom: 8,
		overflow: 'hidden',
	},

	progressContainer: {
		marginBottom: 16,
	},

	progressFill: {
		borderRadius: 4,
		height: '100%',
	},

	progressText: {
		color: darkTheme.textSecondary,
		fontSize: 14,
		fontWeight: '600',
		textAlign: 'center',
	},

	secondaryButton: {
		backgroundColor: '#2A2A3E',
	},
	secondaryButtonText: {
		color: darkTheme.textPrimary,
		fontSize: 16,
		fontWeight: '600',
	},

	trackingIcon: {
		fontSize: 16,
		marginRight: 8,
	},

	trackingText: {
		color: darkTheme.textSecondary,
		flex: 1,
		fontSize: 14,
		lineHeight: 18,
	},

	trackingWarning: {
		alignItems: 'center',
		backgroundColor: darkTheme.background,
		borderRadius: 8,
		flexDirection: 'row',
		marginBottom: 16,
		padding: 12,
	},
});
