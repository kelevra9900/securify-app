/**
 * Mock simple de React Native para pruebas
 */

const NativeModules = {
	NfcModule: {
		isSupported: jest.fn(() => Promise.resolve(true)),
		scanTag: jest.fn(() =>
			Promise.resolve({
				ndef: {
					payload: '{"id":1,"roundId":10}',
					type: 'application/json',
				},
				tech: 'NfcA',
				uid: '04:E1:2A:3B',
			}),
		),
		writeTag: jest.fn(() => Promise.resolve()),
	},
};

const Platform = {
	OS: 'android',
	select: (obj) => obj.android || obj.default,
	Version: 30,
};

// Mock de AppState para tests de sockets
const AppState = {
	currentState: 'active',
	addEventListener: jest.fn((eventType, listener) => {
		const subscription = {
			remove: jest.fn(),
		};
		return subscription;
	}),
	removeEventListener: jest.fn(),
};

module.exports = {
	AppState,
	NativeModules,
	Platform,
};

