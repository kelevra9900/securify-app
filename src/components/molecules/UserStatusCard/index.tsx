import React from 'react';
import {Image,StyleSheet,Text,View} from 'react-native';
import * as RNLocalize from 'react-native-localize';
import {useTheme} from '@/context/Theme';
import type {Sector,Shift,UserSummary} from '@/types/home';
import {formatShiftLabel} from '@/utils/shiftTime';

type SocketStatus = 'connected' | 'connecting' | 'disconnected';
const socketColors: Record<SocketStatus,string> = {
	connected: '#4CAF50',
	connecting: '#FFC107',
	disconnected: '#F44336',
};

type Props = {
	fallbackAvatar?: string;
	sector: null | Sector;
	shift: null | Shift; // Shift.start / end pueden ser "HH:mm" o ISO
	socketStatus?: SocketStatus;
	user: UserSummary;
};

const UserStatusCard: React.FC<Props> = ({
	fallbackAvatar = undefined,
	sector,
	shift,
	socketStatus = 'disconnected',
	user,
}) => {
	const {theme} = useTheme();

	const tz =
		RNLocalize.getTimeZone?.() ||
		Intl.DateTimeFormat().resolvedOptions().timeZone ||
		'America/Mexico_City';

	const name = `${user.firstName} ${user.lastName}`.trim();
	const position = user.jobPosition?.name ?? '—';

	const {label: shiftLabel} = formatShiftLabel(
		shift ? {end: shift.end,start: shift.start} : null,
		tz
	);

	const sectorLabel = sector?.name ?? '—';
	const avatarUri = user.image ?? fallbackAvatar ?? undefined;

	return (
		<View style={[styles.card,{backgroundColor: theme.cardBackground}]}>
			<View style={styles.avatarWrapper}>
				{avatarUri ? (
					<Image source={{uri: avatarUri}} style={styles.avatar} />
				) : (
					<View
						style={[
							styles.avatar,
							{alignItems: 'center',backgroundColor: theme.border,justifyContent: 'center'},
						]}
					>
						<Text style={{color: theme.textSecondary,fontWeight: '600'}}>
							{name ? name.charAt(0).toUpperCase() : 'S'}
						</Text>
					</View>
				)}
				<View
					style={[
						styles.socketBadge,
						{backgroundColor: socketColors[socketStatus] || theme.border},
					]}
				/>
			</View>

			<View style={styles.info}>
				<Text numberOfLines={1} style={[styles.name,{color: theme.textPrimary}]}>
					{name || '—'}
				</Text>
				<Text numberOfLines={1} style={[styles.position,{color: theme.textSecondary}]}>
					{position}
				</Text>

				<View style={styles.extraInfo}>
					<Text style={[styles.label,{color: theme.textSecondary}]}>Turno:</Text>
					<Text numberOfLines={1} style={[styles.value,{color: theme.textPrimary}]}>
						{shiftLabel}
					</Text>

					<Text style={[styles.label,{color: theme.textSecondary}]}>Sector:</Text>
					<Text numberOfLines={2} style={[styles.value,{color: theme.textPrimary}]}>
						{sectorLabel}
					</Text>
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	avatar: {borderRadius: 28,height: 56,width: 56},
	avatarWrapper: {position: 'relative'},
	card: {
		alignItems: 'flex-start',
		borderRadius: 16,
		elevation: 2,
		flexDirection: 'row',
		marginVertical: 8,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: {height: 2,width: 0},
		shadowOpacity: 0.1,
		shadowRadius: 4,
		width: '100%',
	},
	extraInfo: {marginTop: 12},
	info: {flex: 1,marginLeft: 16},
	label: {fontSize: 12,opacity: 0.8},
	name: {fontSize: 16,fontWeight: '600'},
	position: {fontSize: 13,marginTop: 2},
	socketBadge: {
		borderColor: '#fff',
		borderRadius: 7,
		borderWidth: 2,
		bottom: 0,
		height: 14,
		position: 'absolute',
		right: 0,
		width: 14,
	},
	value: {fontSize: 14,fontWeight: '500',marginBottom: 4},
});

export default UserStatusCard;
