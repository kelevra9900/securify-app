import type {CheckpointLog} from "@/types/checkpoint";
import type {RoundDetail,RoundListItem} from "@/types/rounds";

export const pad = (n: number) => String(n).padStart(2,'0');

export function mmToHHMMSS(min: null | number) {
	if (min == null) {return '--:--';}
	const total = Math.max(0,Math.floor(min) * 60);
	const h = Math.floor(total / 3600);
	const m = Math.floor((total % 3600) / 60);
	const s = total % 60;
	return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
export function fmtShortRange(startISO: string,endISO: null | string) {
	const s = new Date(startISO);
	const e = endISO ? new Date(endISO) : null;
	const sTime = s.toLocaleTimeString('es-MX',{hour: '2-digit',minute: '2-digit'});
	const eTime = e ? e.toLocaleTimeString('es-MX',{hour: '2-digit',minute: '2-digit'}) : '';
	const sDate = s.toLocaleDateString('es-MX',{day: '2-digit',month: 'short'});
	const eDate = e ? e.toLocaleDateString('es-MX',{day: '2-digit',month: 'short'}) : '';
	const crossesDay = !!e && s.toDateString() !== e.toDateString();
	return crossesDay ? `${sDate} ${sTime} — ${eDate} ${eTime}` : `${sTime}${e ? ` — ${eTime}` : ''}`;
}
export function mapCardStatus(s?: RoundListItem['status']): 'active' | 'completed' | 'not_started' {
	if (!s) {return 'not_started';}
	return s === 'COMPLETED' || s === 'VERIFIED' ? 'completed' : 'active';
}
export function toCheckpointLogs(detail?: RoundDetail): CheckpointLog[] {
	if (!detail) {return [];}
	const completedIds = new Set(detail.logs.map((l) => String(l.checkpointId)));

	return detail.checkpoints.map((cp) => {
		const last = detail.logs.find((l) => String(l.checkpointId) === String(cp.id));
		return {
			checkpointId: String(cp.id),
			checkpointName: cp.location,
			id: String(cp.id),
			status: completedIds.has(String(cp.id)) ? 'completed' : 'pending',
			...(last?.timestampISO ? {timestamp: last.timestampISO} : {}), // no pongas undefined
			// guardId/guardName no se incluyen si no los tienes
		};
	});
}