import React, { use, useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthContext } from "../context/AuthContext.tsx";

import { publicRoutes, privateRoutes } from "./routes.tsx";

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user } = useContext(AuthContext);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user
          ? privateRoutes.map(({ name, component, options}) => (
              <Stack.Screen key={name} name={name} component={component} options={options} />
            ))
          : publicRoutes.map(({ name, component, options}) => (
              <Stack.Screen key={name} name={name} component={component}  options={options} />
            ))}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
