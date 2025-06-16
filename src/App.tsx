import 'react-native-gesture-handler';
import {enableScreens} from 'react-native-screens';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {MMKV} from 'react-native-mmkv';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import FlashMessage from 'react-native-flash-message';

import store,{persistor} from './store';
import ApplicationNavigator from './navigation/Application';


export const queryClient = new QueryClient({
	defaultOptions: {
		mutations: {
			retry: false,
		},
		queries: {
			retry: false,
		},
	},
});

enableScreens();

export const storage = new MMKV();


function App() {
	return (
		<GestureHandlerRootView>
			<QueryClientProvider client={queryClient}>
				<Provider store={store}>
					<PersistGate loading={null} persistor={persistor}>
						<ApplicationNavigator />
						<FlashMessage position="top" />
					</PersistGate>
				</Provider>
			</QueryClientProvider>
		</GestureHandlerRootView>
	)
}

export default App;