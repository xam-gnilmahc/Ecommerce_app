import React, { useEffect } from 'react';
import { enableScreens } from 'react-native-screens';
import AppNavigator from './src/navigator/AppNavigator';
import { ResponseNotificationProvider } from './src/context/ResponseNotificationContext';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Enable react-native-screens before using NavigationContainer
enableScreens();

const App = () => {
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '35204294253-5fl8ju7771alpqa3kkd1nf9u9h7tv8p0.apps.googleusercontent.com',
      offlineAccess: false,
    });
  }, []);

  return (
    <ResponseNotificationProvider>
      <AppNavigator />
    </ResponseNotificationProvider>
  );
};

export default App;
