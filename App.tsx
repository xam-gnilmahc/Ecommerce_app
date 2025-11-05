import React from 'react';
import { enableScreens } from 'react-native-screens'; // ✅ Import enableScreens
import AppNavigator from './src/navigator/AppNavigator';

// Enable react-native-screens before using NavigationContainer
enableScreens();

const App = () => {
  return <AppNavigator />;
};

export default App;
