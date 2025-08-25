// utils/chat.ts
export type WsMessage = {
	content: string;
	conversationId: number;
	createdAt: Date | string | undefined;
	fromUserId: null | number;
	id: number;
	toUserId: null | number;
};

export type Row =
	| {createdAt: string; key: string; kind: 'msg'; msg: WsMessage}
	| {createdAt: string; key: string; kind: 'separator'; label: string;};

export function normalizeWsMessage(m: WsMessage): WsMessage {
	const iso =
		typeof m.createdAt === 'string'
			? m.createdAt
			: m.createdAt instanceof Date
				? m.createdAt.toISOString()
				: new Date().toISOString();

	return {...m,createdAt: iso};
}

function pad(n: number) {
	return n < 10 ? `0${n}` : String(n);
}

function dayKeyLocal(iso: string) {
	const d = new Date(iso);
	// clave de agrupación local: YYYY-MM-DD
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfDay(d: Date) {
	return new Date(d.getFullYear(),d.getMonth(),d.getDate());
}

function dayLabelLocal(iso: string) {
	const d = new Date(iso);
	const today = startOfDay(new Date());
	const that = startOfDay(d);
	const diff = Math.round((+today - +that) / (1000 * 60 * 60 * 24)); // hoy=0, ayer=1,...

	if (diff === 0) {return 'Hoy';}
	if (diff === 1) {return 'Ayer';}

	return d.toLocaleDateString('es-MX',{
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	});
}

/**
 * `messages` en orden ASC (viejo -> nuevo).
 * Con `inverted: true`, el separador se agrega DESPUÉS del bloque (queda arriba visualmente).
 */
export function buildRows(messages: WsMessage[],opts?: {inverted?: boolean}): Row[] {
	const inverted = !!opts?.inverted;
	const rows: Row[] = [];
	let currentKey: null | string = null;
	let groupBuffer: Row[] = [];
	let firstISO: null | string = null;

	const flush = () => {
		if (!currentKey || !firstISO || groupBuffer.length === 0) {return;}
		if (inverted) {
			rows.push(...groupBuffer);
			rows.push({createdAt: firstISO,key: `sep:${currentKey}`,kind: 'separator',label: dayLabelLocal(firstISO)});
		} else {
			rows.push({createdAt: firstISO,key: `sep:${currentKey}`,kind: 'separator',label: dayLabelLocal(firstISO)});
			rows.push(...groupBuffer);
		}
		groupBuffer = [];
	};

	for (const m of messages) {
		// Asegura que createdAt sea string (por si acaso)
		const iso = m.createdAt || new Date().toISOString();
		const key = dayKeyLocal(iso.toString());

		if (currentKey !== null && key !== currentKey) {
			flush();
			firstISO = null;
		}
		currentKey = key;
		if (!firstISO) {firstISO = iso;}

		groupBuffer.push({createdAt: iso.toString(),key: `msg:${m.id}`,kind: 'msg',msg: {...m,createdAt: iso}});
	}
	flush();
	return rows;
}
