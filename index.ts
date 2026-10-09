import { registerRootComponent } from 'expo';

// 👇 Регистрируем фоновую задачу геолокации при загрузке бандла:
// TaskManager должен знать о задаче до её запуска (в том числе в headless-режиме).
import './src/services/BackgroundLocationService';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
