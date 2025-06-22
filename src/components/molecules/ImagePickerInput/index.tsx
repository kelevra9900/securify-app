import React,{useState} from 'react';
import {
	Modal,
	Pressable,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import {MotiImage,MotiView} from 'moti';
import type {Asset} from 'react-native-image-picker';
import {
	CameraIcon,
	CheckCircle2,
	ImageIcon,
	Trash2Icon,
} from 'lucide-react-native';

import {openCamera,openGallery,requestCameraPermission} from '@/utils/imagePicker';

type Props = {
	image?: Asset | null;
	onImageSelected: (asset: Asset) => void;
	onRemoveImage?: () => void;
};

const ImagePickerInput = ({
	image = null,
	onImageSelected,
	onRemoveImage = () => { },
}: Props) => {
	const [modalVisible,setModalVisible] = useState(false);

	const handleSelectOption = async (type: 'camera' | 'gallery') => {
		setModalVisible(false);

		try {
			if (type === 'camera') {
				const hasPermission = await requestCameraPermission();
				if (hasPermission) {
					await openCamera(onImageSelected);
				}
			} else {
				console.log('Abriendo galería');
				await openGallery(onImageSelected);
			}
		} catch (error) {
			console.warn('Error al seleccionar imagen:',error);
		}
	};

	return (
		<View style={styles.container}>
			{image && (
				<MotiView
					animate={{opacity: 1,scale: 1}}
					from={{opacity: 0,scale: 0.95}}
					style={styles.previewContainer}
					transition={{duration: 300,type: 'timing'}}
				>
					<MotiImage
						animate={{opacity: 1,scale: 1}}
						from={{opacity: 0,scale: 0.9}}
						source={{uri: image.uri}}
						style={styles.imagePreview}
						transition={{
							damping: 12,
							stiffness: 150,
							type: 'spring',
						}}
					/>

					<View style={styles.statusRow}>
						<View style={styles.statusItem}>
							<CheckCircle2 color="#4BB543" size={18} />
							<Text style={styles.successText}>Imagen lista</Text>
						</View>

						<TouchableOpacity onPress={onRemoveImage} style={styles.statusItem}>
							<Trash2Icon color="red" size={18} />
							<Text style={styles.removeText}>Eliminar</Text>
						</TouchableOpacity>
					</View>
				</MotiView>
			)}

			<TouchableOpacity
				activeOpacity={0.8}
				onPress={() => setModalVisible(true)}
				style={styles.selectButton}
			>
				<Text style={styles.selectText}>
					{image ? 'Cambiar imagen' : 'Seleccionar imagen'}
				</Text>
			</TouchableOpacity>

			<Modal animationType="fade" transparent visible={modalVisible}>
				<Pressable onPress={() => setModalVisible(false)} style={styles.modalBackdrop}>
					<View style={styles.modalContent}>
						<TouchableOpacity
							onPress={() => handleSelectOption('camera')}
							style={styles.optionButton}
						>
							<CameraIcon size={20} style={styles.icon} />
							<Text style={styles.modalOption}>Tomar foto</Text>
						</TouchableOpacity>

						<TouchableOpacity
							onPress={() => handleSelectOption('gallery')}
							style={styles.optionButton}
						>
							<ImageIcon size={20} style={styles.icon} />
							<Text style={styles.modalOption}>Elegir de galería</Text>
						</TouchableOpacity>
					</View>
				</Pressable>
			</Modal>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {marginBottom: 16},
	icon: {
		marginRight: 4,
	},
	imagePreview: {
		borderRadius: 12,
		height: 200,
		resizeMode: 'cover',
		width: '100%',
	},
	modalBackdrop: {
		backgroundColor: 'rgba(0,0,0,0.3)',
		flex: 1,
		justifyContent: 'flex-end',
	},
	modalContent: {
		backgroundColor: '#fff',
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
		paddingHorizontal: 24,
		paddingVertical: 16,
	},
	modalOption: {
		fontSize: 16,
		fontWeight: '500',
	},
	optionButton: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: 12,
		paddingVertical: 12,
	},
	previewContainer: {
		alignItems: 'center',
		marginBottom: 12,
	},
	removeText: {
		color: 'red',
		fontWeight: '500',
		textDecorationLine: 'underline',
	},
	selectButton: {
		alignItems: 'center',
		backgroundColor: '#5C6EF8',
		borderRadius: 8,
		padding: 12,
	},
	selectText: {
		color: '#fff',
		fontWeight: '600',
	},
	statusItem: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: 6,
	},
	statusRow: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 8,
		paddingHorizontal: 8,
		width: '100%',
	},
	successText: {
		color: '#4BB543',
		fontWeight: '600',
	},
});

export default ImagePickerInput;
