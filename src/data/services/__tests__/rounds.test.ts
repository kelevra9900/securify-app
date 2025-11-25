/**
 * Pruebas para el servicio de rounds (específicamente registerCheckpoint)
 */

import {instance} from '../../instance';
import {registerCheckpoint} from '../rounds';

// Mock de axios instance
jest.mock('../../instance',() => ({
	instance: {
		get: jest.fn(),
		post: jest.fn(),
	},
}));

describe('Servicio de Rounds',() => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('registerCheckpoint',() => {
		it('debería enviar todos los datos al endpoint correcto',async () => {
			const mockResponse = {
				data: {
					data: {
						checkpointId: 123,
						id: 789,
						roundId: 456,
						timestamp: '2025-10-23T14:30:00Z',
					},
					success: true,
				},
			};

			(instance.post as jest.Mock).mockResolvedValueOnce(mockResponse);

			const params = {
				checkpointId: 123,
				latitude: -33.4489,
				longitude: -70.6693,
				nfcUid: '04:E1:2A:3B:56:78:90',
				roundId: 456,
			};

			const result = await registerCheckpoint(params);

			// Verificar que se llamó al endpoint correcto
			expect(instance.post).toHaveBeenCalledWith('/users/me/checkpoint',{
				checkpointId: 123,
				latitude: -33.4489,
				longitude: -70.6693,
				roundId: 456,
			});

			// Verificar que retorna los datos correctos
			expect(result).toEqual(mockResponse.data);
		});

		it('debería enviar datos sin nfcUid cuando no está presente',async () => {
			const mockResponse = {data: {success: true}};
			(instance.post as jest.Mock).mockResolvedValueOnce(mockResponse);

			await registerCheckpoint({
				checkpointId: 123,
				latitude: -33.4489,
				longitude: -70.6693,
				roundId: 456,
			});

			expect(instance.post).toHaveBeenCalledWith('/users/me/checkpoint',{
				checkpointId: 123,
				latitude: -33.4489,
				longitude: -70.6693,
				roundId: 456,
			});

			// Verificar que no se envió nfcUid
			const callArgs = (instance.post as jest.Mock).mock.calls[0][1];
			expect(callArgs).not.toHaveProperty('nfcUid');
		});

		it('debería enviar datos sin coordenadas GPS cuando no están presentes',async () => {
			const mockResponse = {data: {success: true}};
			(instance.post as jest.Mock).mockResolvedValueOnce(mockResponse);

			await registerCheckpoint({
				checkpointId: 123,
				nfcUid: '04:E1:2A:3B',
				roundId: 456,
			});

			expect(instance.post).toHaveBeenCalledWith('/users/me/checkpoint',{
				checkpointId: 123,
				roundId: 456,
			});

			// Verificar que no se enviaron coordenadas
			const callArgs = (instance.post as jest.Mock).mock.calls[0][1];
			expect(callArgs).not.toHaveProperty('latitude');
			expect(callArgs).not.toHaveProperty('longitude');
		});

		it('debería manejar solo latitude (sin enviar coordenadas incompletas)',async () => {
			const mockResponse = {data: {success: true}};
			(instance.post as jest.Mock).mockResolvedValueOnce(mockResponse);

			await registerCheckpoint({
				checkpointId: 123,
				latitude: -33.4489,
				roundId: 456,
				// longitude no está presente
			});

			const callArgs = (instance.post as jest.Mock).mock.calls[0][1];
			// No debería enviar coordenadas si están incompletas
			expect(callArgs).not.toHaveProperty('latitude');
			expect(callArgs).not.toHaveProperty('longitude');
		});

		it('debería manejar solo longitude (sin enviar coordenadas incompletas)',async () => {
			const mockResponse = {data: {success: true}};
			(instance.post as jest.Mock).mockResolvedValueOnce(mockResponse);

			await registerCheckpoint({
				checkpointId: 123,
				roundId: 456,
				// latitude no está presente
				longitude: -70.6693,
			});

			const callArgs = (instance.post as jest.Mock).mock.calls[0][1];
			// No debería enviar coordenadas si están incompletas
			expect(callArgs).not.toHaveProperty('latitude');
			expect(callArgs).not.toHaveProperty('longitude');
		});

		it('debería enviar ambas coordenadas solo cuando ambas están presentes',async () => {
			const mockResponse = {data: {success: true}};
			(instance.post as jest.Mock).mockResolvedValueOnce(mockResponse);

			await registerCheckpoint({
				checkpointId: 123,
				latitude: -33.4489,
				longitude: -70.6693,
				roundId: 456,
			});

			expect(instance.post).toHaveBeenCalledWith('/users/me/checkpoint',{
				checkpointId: 123,
				latitude: -33.4489,
				longitude: -70.6693,
				roundId: 456,
			});
		});

		it('debería propagar errores de red',async () => {
			const networkError = new Error('Network Error');
			(instance.post as jest.Mock).mockRejectedValueOnce(networkError);

			await expect(
				registerCheckpoint({
					checkpointId: 123,
					roundId: 456,
				}),
			).rejects.toThrow('Network Error');
		});

		it('debería propagar errores 401 (no autenticado)',async () => {
			const authError = {
				response: {
					data: {message: 'Unauthorized'},
					status: 401,
				},
			};
			(instance.post as jest.Mock).mockRejectedValueOnce(authError);

			await expect(
				registerCheckpoint({
					checkpointId: 123,
					roundId: 456,
				}),
			).rejects.toEqual(authError);
		});

		it('debería propagar errores 404 (checkpoint no encontrado)',async () => {
			const notFoundError = {
				response: {
					data: {message: 'Checkpoint not found'},
					status: 404,
				},
			};
			(instance.post as jest.Mock).mockRejectedValueOnce(notFoundError);

			await expect(
				registerCheckpoint({
					checkpointId: 999,
					roundId: 456,
				}),
			).rejects.toEqual(notFoundError);
		});

		it('debería propagar errores 400 (validación del servidor)',async () => {
			const validationError = {
				response: {
					data: {message: 'Invalid checkpoint for this round'},
					status: 400,
				},
			};
			(instance.post as jest.Mock).mockRejectedValueOnce(validationError);

			await expect(
				registerCheckpoint({
					checkpointId: 123,
					roundId: 999,
				}),
			).rejects.toEqual(validationError);
		});

		it('debería manejar coordenadas con valor 0 (ecuador/meridiano)',async () => {
			const mockResponse = {data: {success: true}};
			(instance.post as jest.Mock).mockResolvedValueOnce(mockResponse);

			await registerCheckpoint({
				checkpointId: 123,
				latitude: 0,
				longitude: 0,
				roundId: 456,
			});

			expect(instance.post).toHaveBeenCalledWith('/users/me/checkpoint',{
				checkpointId: 123,
				latitude: 0,
				longitude: 0,
				roundId: 456,
			});
		});
	});
});

