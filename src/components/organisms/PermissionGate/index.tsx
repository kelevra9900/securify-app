import {colors} from "@/assets/theme";
import {PrimaryButton,TextLabel} from "@/components/atoms";
import {Linking,Pressable,StyleSheet,Text,View} from "react-native";

function PermissionGate({
	description,
	onGrant,
	title,
}: {
	description: string;
	onGrant: () => void;
	title: string;
}) {
	return (
		<CenteredContainer>
			<TextLabel align="center" color={colors.white} type="B20">
				{title}
			</TextLabel>
			<TextLabel align="center" color={colors.white} style={{opacity: 0.9}} type="R16">
				{description}
			</TextLabel>
			<View style={{height: 12}} />
			<PrimaryButton label="Dar permiso" onPress={onGrant} />
			<Pressable onPress={() => Linking.openSettings()} style={{marginTop: 10}}>
				<Text style={styles.settingsLink}>Abrir configuración</Text>
			</Pressable>
		</CenteredContainer>
	);
}

function CenteredContainer({children}: {children: React.ReactNode}) {
	return (
		<View style={styles.centered}>
			{children}
		</View>
	);
}


const styles = StyleSheet.create({
	centered: {
		alignItems: 'center',
		backgroundColor: colors.backgroundDark,
		flex: 1,
		gap: 12,
		justifyContent: 'center',
		padding: 24,
	},
	settingsLink: {
		color: colors.white,
		opacity: 0.8,
		textDecorationLine: 'underline',
	},
});

export default PermissionGate;