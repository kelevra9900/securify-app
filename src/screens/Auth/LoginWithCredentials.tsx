import React,{useMemo,useState} from 'react';
import {KeyboardAvoidingView,Platform,StyleSheet,TextInput,View} from 'react-native';
import {LoginTemplate} from '@/components/templates';
import {Logo,PrimaryButton,TextLabel} from '@/components/atoms';
import {useLoginWithCredentials} from '@/hooks/mutations/useAuth';
import {useTheme} from '@/context/Theme';
import {flashError,flashSuccess} from '@/utils/flashMessageHelper';
import {useDispatch} from 'react-redux';
import {setCredentials} from '@/store/reducers/auth';
import type {RootScreenProps} from '@/navigation/types';
import {Paths} from '@/navigation/paths';

type Props = RootScreenProps<Paths.LoginWithCredentials>;

const LoginWithCredentialsScreen = ({navigation}: Props) => {
	const {theme} = useTheme();
	const dispatch = useDispatch();
	const {isPending,mutate} = useLoginWithCredentials();

	const [identifier,setIdentifier] = useState('');
	const [password,setPassword] = useState('');

	const isValid = useMemo(
		() => identifier.trim().length > 0 && password.length > 0,
		[identifier,password],
	);

	const handleLogin = async () => {
		if (!isValid || isPending) {return;}

		mutate(
			{identifier: identifier.trim(),password},
			{
				onSuccess: (response: {jwt?: string,refreshToken?: string}) => {
					const token = response?.jwt
					const refreshToken = response?.refreshToken;

					if (typeof token !== 'string' || token.length === 0 || typeof refreshToken !== 'string' || refreshToken?.length === 0) {
						flashError('No se pudo iniciar sesión','Intenta nuevamente más tarde.');
						return;
					}

					dispatch(setCredentials({refreshToken,token}));
					flashSuccess('Haz iniciado sesión correctamente')
					navigation.replace(Paths.SectorSelector);
				},
			},
		);
	};

	return (
		<LoginTemplate>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				style={styles.flex}
			>
				<View style={styles.wrapper}>
					<Logo animated />
					<View style={[styles.card,{backgroundColor: theme.cardBackground,borderColor: `${theme.border}50`}]}>
						<TextLabel align="center" color={theme.textPrimary} style={styles.title} type="B22">
							Inicia sesión con tus credenciales
						</TextLabel>
						<TextLabel align="center" color={theme.textSecondary} style={styles.subtitle} type="R16">
							Ingresa tu identificador y contraseña corporativa.
						</TextLabel>

						<View style={styles.field}>
							<TextLabel color={theme.textPrimary} style={styles.label} type="M14">
								Identificador
							</TextLabel>
							<TextInput
								autoCapitalize="none"
								autoCorrect={false}
								keyboardType="email-address"
								onChangeText={setIdentifier}
								placeholder="Ej. usuario@empresa.com"
								placeholderTextColor={theme.textSecondary}
								returnKeyType="next"
								style={[styles.input,{borderColor: theme.border,color: theme.textPrimary}]}
								textContentType="username"
								value={identifier}
							/>
						</View>

						<View style={styles.field}>
							<TextLabel color={theme.textPrimary} style={styles.label} type="M14">
								Contraseña
							</TextLabel>
							<TextInput
								autoCapitalize="none"
								autoCorrect={false}
								onChangeText={setPassword}
								onSubmitEditing={handleLogin}
								placeholder="Ingresa tu contraseña"
								placeholderTextColor={theme.textSecondary}
								returnKeyType="done"
								secureTextEntry
								style={[styles.input,{borderColor: theme.border,color: theme.textPrimary}]}
								textContentType="password"
								value={password}
							/>
						</View>

						<PrimaryButton
							disabled={!isValid || isPending}
							label="Iniciar sesión"
							loading={isPending}
							onPress={handleLogin}
						/>
					</View>
				</View>
			</KeyboardAvoidingView>
		</LoginTemplate>
	);
};

const styles = StyleSheet.create({
	card: {
		borderRadius: 20,
		borderWidth: 1,
		gap: 16,
		paddingHorizontal: 24,
		paddingVertical: 28,
		width: '100%',
	},
	field: {
		gap: 8,
	},
	flex: {
		flex: 1,
	},
	input: {
		borderRadius: 10,
		borderWidth: 1,
		fontSize: 16,
		paddingHorizontal: 14,
		paddingVertical: 12,
	},
	label: {
		marginBottom: 2,
	},
	subtitle: {
		marginBottom: 12,
	},
	title: {
		marginBottom: 4,
	},
	wrapper: {
		alignItems: 'center',
		flex: 1,
		gap: 24,
		justifyContent: 'center',
		paddingHorizontal: 24,
		paddingVertical: 32,
	},
});

export default LoginWithCredentialsScreen;