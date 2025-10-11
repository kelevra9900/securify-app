// BottomActionSheet.tsx
import React from 'react';
import {ActivityIndicator,Platform,Pressable,StyleSheet,Text,View} from 'react-native';
import {AnimatePresence,MotiView} from 'moti';
import {BlurView} from '@react-native-community/blur';
import {colors} from '@/assets/theme';
import ShutterButton from '@/components/atoms/Buttons/Shutter';

export default function BottomActionSheet({
	insetBottom,isBusy,isGettingLocation,onCancel,onShutter,
}: {
	insetBottom: number;
	isBusy: boolean;
	isGettingLocation: boolean;
	onCancel: () => void;
	onShutter: () => void;
}) {
	const Wrapper = ({children}: {children: React.ReactNode}) => {
		// En Android el blur requiere background detrás; si algo falla, usa fallback.
		const blurOK = Platform.OS === 'ios' || 'android';
		return blurOK ? (
			<View style={[s.wrap,{paddingBottom: insetBottom + 12}]}>
				<BlurView blurAmount={20} blurType="dark" reducedTransparencyFallbackColor="rgba(0,0,0,0.35)" style={StyleSheet.absoluteFill} />
				{children}
			</View>
		) : (
			<View style={[s.wrap,{backgroundColor: 'rgba(0,0,0,0.35)',paddingBottom: insetBottom + 12}]}>
				{children}
			</View>
		);
	};

	return (
		<Wrapper>
			<AnimatePresence>
				{isBusy ? (
					<MotiView
						animate={{opacity: 1,translateY: 0}}
						exit={{opacity: 0,translateY: 12}}
						from={{opacity: 0,translateY: 12}}
						key="busy"
						style={s.busy}
						transition={{duration: 220,type: 'timing'}}
					>
						<ActivityIndicator color={colors.white} />
						<Text style={s.busyText}>{isGettingLocation ? 'Obteniendo ubicación…' : 'Procesando…'}</Text>
					</MotiView>
				) : (
					<MotiView
						animate={{opacity: 1,translateY: 0}}
						exit={{opacity: 0,translateY: 12}}
						from={{opacity: 0,translateY: 12}}
						key="ready"
						style={s.row}
						transition={{duration: 220,type: 'timing'}}
					>
						<Text style={s.tip}>Consejo: mira al frente y relaja el gesto</Text>
						<ShutterButton onPress={onShutter} />
						<Pressable accessibilityRole="button" onPress={onCancel} style={({pressed}) => [{opacity: pressed ? 0.6 : 1}]}>
							<Text style={s.cancel}>Cancelar</Text>
						</Pressable>
					</MotiView>
				)}
			</AnimatePresence>
		</Wrapper>
	);
}

const s = StyleSheet.create({
	busy: {alignItems: 'center',gap: 8,justifyContent: 'center',minHeight: 60},
	busyText: {color: colors.white,fontSize: 12,opacity: 0.9},
	cancel: {color: colors.white,opacity: 0.85,textDecorationLine: 'underline'},
	row: {alignItems: 'center',gap: 14},
	tip: {color: colors.white,fontSize: 13,opacity: 0.85},
	wrap: {
		alignItems: 'center',
		borderColor: 'rgba(255,255,255,0.08)',
		borderRadius: 18,
		borderWidth: StyleSheet.hairlineWidth,
		bottom: 10,
		left: 12,
		overflow: 'hidden', // importante para el Blur
		paddingHorizontal: 18,
		paddingTop: 12,
		position: 'absolute',
		right: 12,
	},
});
