/**
 * Pruebas unitarias para el módulo NFC
 */

// Mock de React Native debe estar ANTES de los imports
jest.mock('react-native',() => ({
	NativeModules: {
		NfcModule: {
			isSupported: jest.fn(),
			scanTag: jest.fn(),
			writeTag: jest.fn(),
		},
	},
	Platform: {
		OS: 'android',
	},
}));

import {NativeModules} from 'react-native';
import {isNfcSupported,scanCheckpointTag,writeCheckpointTag} from '../nfc';

const mockNfcModule = NativeModules.NfcModule as jest.Mocked<typeof NativeModules.NfcModule>;

describe('Módulo NFC',() => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockNfcModule.isSupported.mockResolvedValue(true);
	});

	describe('isNfcSupported',() => {
		it('debería retornar true cuando el dispositivo soporta NFC',async () => {
			mockNfcModule.isSupported.mockResolvedValue(true);

			const result = await isNfcSupported();

			expect(result).toBe(true);
		});

		it('debería retornar false cuando el dispositivo no soporta NFC',async () => {
			mockNfcModule.isSupported.mockResolvedValue(false);

			const result = await isNfcSupported();

			expect(result).toBe(false);
		});
	});

	describe('scanCheckpointTag',() => {
		it('debería leer un tag NFC correctamente',async () => {
			const mockTag = {
				ndef: {
					payload: '{"id":1,"roundId":10}',
					type: 'application/json',
				},
				tech: 'NfcA,Ndef',
				uid: '04:E1:2A:3B',
			};
			mockNfcModule.scanTag.mockResolvedValue(mockTag);

			const result = await scanCheckpointTag(5000);

			expect(result).toEqual(mockTag);
			expect(mockNfcModule.scanTag).toHaveBeenCalledWith({timeoutMs: 5000});
		});

		it('debería usar el timeout por defecto de 10 segundos',async () => {
			mockNfcModule.scanTag.mockResolvedValue({tech: 'NfcA',uid: '04:E1:2A:3B'});

			await scanCheckpointTag();

			expect(mockNfcModule.scanTag).toHaveBeenCalledWith({timeoutMs: 10_000});
		});

		it('debería lanzar error si el dispositivo no soporta NFC',async () => {
			mockNfcModule.isSupported.mockResolvedValue(false);

			await expect(scanCheckpointTag()).rejects.toThrow(
				'NFC no soportado en este dispositivo',
			);
		});
	});

	describe('writeCheckpointTag',() => {
		it('debería escribir datos en un tag NFC',async () => {
			const payload = JSON.stringify({id: 1,roundId: 10});
			mockNfcModule.writeTag.mockResolvedValue(undefined);

			await writeCheckpointTag(payload,{timeoutMs: 5000});

			expect(mockNfcModule.writeTag).toHaveBeenCalledWith(payload,{
				timeoutMs: 5000,
			});
		});

		it('debería lanzar error si el dispositivo no soporta NFC',async () => {
			mockNfcModule.isSupported.mockResolvedValue(false);

			await expect(writeCheckpointTag('{}')).rejects.toThrow(
				'NFC no soportado en este dispositivo',
			);
		});
	});
});
