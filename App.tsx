import React, { useEffect } from 'react';
import { enableScreens } from 'react-native-screens';
import AppNavigator from './src/navigator/AppNavigator';
import { ResponseNotificationProvider } from './src/context/ResponseNotificationContext';
import { AuthProvider } from './src/context/AuthContext';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { StripeProvider } from "@stripe/stripe-react-native";
import setting from './src/config/setting';
// Enable react-native-screens before using NavigationContainer
enableScreens();

const App = () => {
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: setting.WEB_CLIENT_ID,
      offlineAccess: false,
    });
  }, []);

  return (
    <StripeProvider publishableKey="pk_test_51PGec42K0njal9PzJzzxwBOVszXOkqMCBcovRYFChW727EsjLGJ9sWMvztGAGnnmVAtquHDgSllxMryuvfgnv87D00nc9a1Yp7">
    <AuthProvider>
      <ResponseNotificationProvider>
        <AppNavigator />
      </ResponseNotificationProvider>
    </AuthProvider>
    </StripeProvider>
  );
};

export default App;
