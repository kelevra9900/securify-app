import React from 'react';
import {
	Image,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import {Bell,ChevronRight,Clock,LogOut,Shield,User} from 'lucide-react-native';
import {MotiView} from 'moti';

import {CSafeAreaView,TextLabel} from '@/components/atoms';
import {useTheme} from '@/context/Theme';

const options = [
	{icon: User,label: 'Editar perfil',onPress: () => { }},
	{icon: Shield,label: 'Documentos',onPress: () => { }},
	{icon: Clock,label: 'Asistencias',onPress: () => { }},
	{icon: Bell,label: 'Notificaciones',onPress: () => { }},
	{icon: LogOut,label: 'Cerrar sesión',onPress: () => { }},
];

const ProfileScreen = () => {
	const {theme} = useTheme();

	return (
		<CSafeAreaView edges={["top"]} style={{backgroundColor: theme.background}}>
			<ScrollView contentContainerStyle={styles.container}>
				<MotiView
					animate={{opacity: 1,translateY: 0}}
					from={{opacity: 0,translateY: 20}}
					style={[styles.card,{backgroundColor: theme.cardBackground}]}
					transition={{duration: 500,type: 'timing'}}
				>
					<Image
						source={{uri: 'https://trablisa-assets.s3.eu-south-2.amazonaws.com/roger.jpeg'}}
						style={styles.avatar}
					/>
					<TextLabel type="B20">Roger Torres</TextLabel>
					<TextLabel style={{opacity: 0.7}} type="R14">Guardia de seguridad</TextLabel>
					<TextLabel color="gray" type="R12">Terminal A • Turno nocturno</TextLabel>
				</MotiView>

				<View style={styles.optionsContainer}>
					{options.map((item,index) => {
						const Icon = item.icon;
						return (
							<TouchableOpacity
								activeOpacity={0.8}
								key={index}
								onPress={item.onPress}
								style={[styles.optionItem,{backgroundColor: theme.cardBackground}]}
							>
								<Icon color={theme.textPrimary} size={20} />
								<TextLabel style={styles.optionText} type="R16">{item.label}</TextLabel>
								<ChevronRight color={theme.textSecondary} size={20} />
							</TouchableOpacity>
						);
					})}
				</View>
			</ScrollView>
		</CSafeAreaView>
	);
};

const styles = StyleSheet.create({
	avatar: {
		borderRadius: 50,
		height: 100,
		marginBottom: 12,
		width: 100,
	},
	card: {
		alignItems: 'center',
		borderRadius: 16,
		elevation: 2,
		marginBottom: 24,
		padding: 24,
		shadowColor: '#000',
		shadowOffset: {height: 2,width: 0},
		shadowOpacity: 0.08,
		shadowRadius: 4,
	},
	container: {
		padding: 16,
	},
	optionItem: {
		alignItems: 'center',
		borderRadius: 12,
		flexDirection: 'row',
		gap: 12,
		padding: 16,
	},
	optionsContainer: {
		gap: 12,
	},
	optionText: {
		flex: 1,
	},
});

export default ProfileScreen;
