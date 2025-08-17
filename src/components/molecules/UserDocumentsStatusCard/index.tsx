// components/molecules/UserDocumentsStatusCard.tsx
import React,{memo,useMemo} from 'react';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import {useTheme} from '@/context/Theme';
import CircularProgress from '@/components/atoms/CircularProgress';
import type {DocumentsStats} from '@/types/home';

type Props = {
	documents: DocumentsStats;
	/** Color preferido para el progreso (branding del environment) */
	progressColor?: string;
	/** Si lo pasas, el card será presionable */
	onPress?: () => void;
	/** testID para e2e */
	testID?: string;
};

const UserDocumentsStatusCard: React.FC<Props> = ({
	documents,
	onPress = undefined,
	progressColor = undefined,
	testID = 'user-docs-card',
}) => {
	const {theme} = useTheme();

	const {
		expiringSoon,
		missingTypes,
		percentage,
		requiredTotal,
		uploaded,
		valid,
	} = documents ?? {
		expiringSoon: 0,
		missingTypes: [],
		percentage: 0,
		requiredTotal: 0,
		uploaded: 0,
		valid: 0,
	};

	const pct = Math.max(0,Math.min(100,Number(percentage) || 0));
	const missingCount = missingTypes?.length ?? Math.max(requiredTotal - uploaded,0);

	const subtitle = useMemo(() => {
		const parts: string[] = [];
		parts.push(`Subidos ${uploaded}/${requiredTotal}`);
		parts.push(`Válidos ${valid}`);
		parts.push(`Por vencer ${expiringSoon}`);
		return parts.join(' · ');
	},[uploaded,requiredTotal,valid,expiringSoon]);

	const Wrapper = onPress ? Pressable : View;

	return (
		<Wrapper
			accessibilityLabel="Estado de documentación"
			accessibilityRole={onPress ? 'button' : 'summary'}
			onPress={onPress}
			style={[styles.card,{backgroundColor: theme.cardBackground}]}
			testID={testID}
		>
			<View style={styles.circleWrapper}>
				<CircularProgress
					backgroundColor={theme.border}
					color={progressColor ?? theme.textSecondary}
					progress={pct}
					size={80}
					strokeWidth={6}
				/>
				<View style={styles.centeredText}>
					<Text style={[styles.percentText,{color: theme.textPrimary}]}>{pct}%</Text>
				</View>
			</View>

			<View style={styles.info}>
				<Text style={[styles.title,{color: theme.textPrimary}]}>Documentación</Text>
				<Text numberOfLines={2} style={[styles.subtitle,{color: theme.textSecondary}]}>
					{subtitle}
				</Text>

				<View style={styles.row}>
					<Badge
						label={missingCount > 0 ? `Faltantes ${missingCount}` : 'Completo'}
						themeColors={{bg: theme.border,ok: theme.textSecondary,warn: theme.textSecondary}}
						tone={missingCount > 0 ? 'warn' : 'ok'}
					/>
					{expiringSoon > 0 && (
						<Badge
							label={`Por vencer ${expiringSoon}`}
							themeColors={{bg: theme.border,ok: theme.textSecondary,warn: theme.textSecondary}}
							tone="warn"
						/>
					)}
				</View>
			</View>
		</Wrapper>
	);
};

const Badge: React.FC<{
	label: string;
	themeColors: {bg: string; ok: string; warn: string;};
	tone: 'ok' | 'warn';
}> = ({label,themeColors,tone}) => {
	return (
		<View style={[styles.badge,{backgroundColor: themeColors.bg}]}>
			<Text
				style={[
					styles.badgeText,
					{color: tone === 'ok' ? themeColors.ok : themeColors.warn},
				]}
			>
				{label}
			</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	badge: {
		borderRadius: 999,
		paddingHorizontal: 10,
		paddingVertical: 4,
	},
	badgeText: {
		fontSize: 12,
		fontWeight: '600',
	},
	card: {
		alignItems: 'center',
		borderRadius: 16,
		elevation: 2,
		flexDirection: 'row',
		marginVertical: 8,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: {height: 2,width: 0},
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
	centeredText: {
		alignItems: 'center',
		justifyContent: 'center',
		position: 'absolute',
	},
	circleWrapper: {
		alignItems: 'center',
		height: 80,
		justifyContent: 'center',
		position: 'relative',
		width: 80,
	},
	info: {
		flex: 1,
		marginLeft: 16,
	},
	percentText: {
		fontSize: 18,
		fontWeight: 'bold',
	},
	row: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		marginTop: 10,
	},
	subtitle: {
		fontSize: 13,
		marginTop: 4,
	},
	title: {
		fontSize: 16,
		fontWeight: '600',
	},
});

export default memo(UserDocumentsStatusCard);
