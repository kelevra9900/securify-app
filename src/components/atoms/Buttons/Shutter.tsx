import {colors} from "@/assets/theme";
import {MotiView} from "moti";
import {Pressable,StyleSheet} from "react-native";

function ShutterButton({onPress}: {onPress: () => void}) {
	// Botón con animación de “respiración”
	return (
		<MotiView
			animate={{opacity: 1,scale: 1.02}}
			from={{opacity: 1,scale: 1}}
			pointerEvents="box-none"
			style={styles.shutterOuter}
			transition={{
				duration: 1300,
				loop: true,
				type: 'timing',
			}}
		>
			<Pressable
				accessibilityLabel="Tomar foto"
				accessibilityRole="button"
				onPress={onPress}
				style={({pressed}) => [
					styles.shutterInner,
					{transform: [{scale: pressed ? 0.96 : 1}]},
				]}
			/>
		</MotiView>
	);
}

const styles = StyleSheet.create({
	shutterInner: {
		backgroundColor: colors.white,
		borderRadius: 100,
		height: 70,
		width: 70,
	},
	shutterOuter: {
		alignItems: 'center',
		borderColor: 'rgba(255,255,255,0.9)',
		borderRadius: 100,
		borderWidth: 3,
		height: 86,
		justifyContent: 'center',
		width: 86,
	},
})

export default ShutterButton