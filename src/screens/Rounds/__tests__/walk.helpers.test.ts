/**
 * Pruebas para las funciones helper del RoundWalkScreen
 *
 * Nota: Estas funciones están dentro del componente, pero las extraemos
 * para poder probarlas de manera independiente.
 */

type CheckpointTagPayload = {
	alias?: string;
	id: number;
	latitude?: number;
	longitude?: number;
	name?: string;
	roundId?: number;
};

// Función copiada del componente para pruebas
function parseCheckpointPayload(
	rawPayload?: string,
): CheckpointTagPayload | null {
	if (!rawPayload) {
		return null;
	}
	try {
		const trimmed = rawPayload.trim();
		const jsonStart = trimmed.indexOf('{');
		const candidate = jsonStart >= 0 ? trimmed.slice(jsonStart) : trimmed;
		const parsed = JSON.parse(candidate) as Record<string, unknown>;

		const parseNumber = (value: unknown): number | undefined => {
			if (typeof value === 'number') {
				return Number.isFinite(value) ? value : undefined;
			}
			if (typeof value === 'string') {
				const asNumber = Number(value);
				return Number.isFinite(asNumber) ? asNumber : undefined;
			}
			return undefined;
		};

		const id = parseNumber(parsed.id) ?? parseNumber(parsed.checkpointId);
		if (typeof id !== 'number') {
			return null;
		}

		const roundId = parseNumber(parsed.roundId);
		const latitude = parseNumber(parsed.latitude);
		const longitude = parseNumber(parsed.longitude);
		const alias =
			typeof parsed.alias === 'string' ? parsed.alias : undefined;
		const name =
			typeof parsed.name === 'string'
				? parsed.name
				: alias;

		return {
			alias,
			id,
			latitude,
			longitude,
			name,
			roundId,
		};
	} catch {
		return null;
	}
}

// Función copiada del componente para pruebas
function haversineMeters(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number,
) {
	const R = 6371e3;
	const toRad = (d: number) => (d * Math.PI) / 180;
	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
	const c = 2 * Math.atan2(Math.sqrt(a),Math.sqrt(1 - a));
	return R * c;
}

describe('RoundWalkScreen Helpers',() => {
	describe('parseCheckpointPayload',() => {
		it('debería parsear un payload JSON completo',() => {
			const payload = JSON.stringify({
				id: 1,
				latitude: -33.4489,
				longitude: -70.6693,
				name: 'Checkpoint Principal',
				roundId: 10,
			});

			const result = parseCheckpointPayload(payload);

			expect(result).toEqual({
				id: 1,
				latitude: -33.4489,
				longitude: -70.6693,
				name: 'Checkpoint Principal',
				roundId: 10,
			});
		});

		it('debería parsear payloads con strings numéricos y alias',() => {
			const payload = JSON.stringify({
				alias: 'Checkpoint A',
				checkpointId: '2',
				latitude: '40.5',
				longitude: '2.3',
				roundId: '8',
			});

			const result = parseCheckpointPayload(payload);

			expect(result).toEqual({
				alias: 'Checkpoint A',
				id: 2,
				latitude: 40.5,
				longitude: 2.3,
				name: 'Checkpoint A',
				roundId: 8,
			});
		});

		it('debería manejar prefijos application/json antes del objeto',() => {
			const payload = 'application/json{"id":3,"roundId":9}';

			const result = parseCheckpointPayload(payload);

			expect(result).toEqual({
				id: 3,
				roundId: 9,
			});
		});

		it('debería retornar null si el payload no tiene id válido',() => {
			const payload = JSON.stringify({
				checkpointId: 'id-invalido',
				roundId: 10,
			});

			const result = parseCheckpointPayload(payload);
			expect(result).toBeNull();
		});

		it('debería retornar null si el payload es inválido',() => {
			expect(parseCheckpointPayload(undefined)).toBeNull();
			expect(parseCheckpointPayload('')).toBeNull();
			expect(parseCheckpointPayload('{ invalid json }')).toBeNull();
		});

		it('debería ignorar campos adicionales no esperados',() => {
			const payload = JSON.stringify({
				anotherField: 999,
				extraField: 'ignored',
				id: 1,
				latitude: -33.4489,
				longitude: -70.6693,
				name: 'Test',
				roundId: 10,
			});

			const result = parseCheckpointPayload(payload);
			expect(result).toEqual({
				alias: undefined,
				id: 1,
				latitude: -33.4489,
				longitude: -70.6693,
				name: 'Test',
				roundId: 10,
			});
		});
	});

	describe('haversineMeters',() => {
		it('debería calcular distancia 0 para el mismo punto',() => {
			const distance = haversineMeters(-33.4489,-70.6693,-33.4489,-70.6693);
			expect(distance).toBe(0);
		});

		it('debería calcular distancia correcta entre dos puntos conocidos',() => {
			// Santiago a Valparaíso (aproximadamente 112 km)
			const santiagoLat = -33.4489;
			const santiagoLon = -70.6693;
			const valparaisoLat = -33.0472;
			const valparaisoLon = -71.6127;

			const distance = haversineMeters(
				santiagoLat,
				santiagoLon,
				valparaisoLat,
				valparaisoLon,
			);

			// Distancia real es aproximadamente 98km, permitimos margen de error
			expect(distance).toBeGreaterThan(90_000); // > 90km
			expect(distance).toBeLessThan(120_000); // < 120km
		});

		it('debería calcular distancia corta correctamente (30 metros)',() => {
			// Dos puntos separados aproximadamente 30 metros
			const lat1 = -33.4489;
			const lon1 = -70.6693;
			const lat2 = -33.4486; // ~33 metros al norte
			const lon2 = -70.6693;

			const distance = haversineMeters(lat1,lon1,lat2,lon2);

			// Permitir margen de error de ±5 metros
			expect(distance).toBeGreaterThan(25);
			expect(distance).toBeLessThan(40);
		});

		it('debería ser simétrica (distancia A->B = distancia B->A)',() => {
			const lat1 = -33.4489;
			const lon1 = -70.6693;
			const lat2 = -33.4500;
			const lon2 = -70.6700;

			const distanceAB = haversineMeters(lat1,lon1,lat2,lon2);
			const distanceBA = haversineMeters(lat2,lon2,lat1,lon1);

			expect(distanceAB).toBeCloseTo(distanceBA,5);
		});

		it('debería manejar coordenadas ecuatoriales',() => {
			const distance = haversineMeters(0,0,0,1);

			// 1 grado de longitud en el ecuador ≈ 111 km
			expect(distance).toBeGreaterThan(100_000);
			expect(distance).toBeLessThan(115_000);
		});

		it('debería manejar coordenadas polares',() => {
			const distance = haversineMeters(89,0,89,180);

			// En latitudes altas, aún hay distancia significativa
			expect(distance).toBeGreaterThan(0);
			expect(distance).toBeLessThan(250_000); // ~250km
		});

		it('debería validar el radio de geofencing de 30 metros',() => {
			const checkpointLat = -33.4489;
			const checkpointLon = -70.6693;

			// Posición dentro del radio (10 metros)
			const distance1 = haversineMeters(
				checkpointLat,
				checkpointLon,
				-33.4488,
				-70.6693,
			);
			expect(distance1).toBeLessThan(30);

			// Posición fuera del radio (100 metros)
			const distance2 = haversineMeters(
				checkpointLat,
				checkpointLon,
				-33.4480,
				-70.6693,
			);
			expect(distance2).toBeGreaterThan(30);
		});
	});
});
