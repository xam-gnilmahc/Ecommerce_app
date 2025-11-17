export const publicRoutes = [
    { 
      name: "Login", 
      component: require("../screens/Login").default,
      options: { animation: "fade_from_bottom" as const } 
     },
    { 
        name: "SignUp", 
        component: require("../screens/SignUp").default,
        options: { animation: "fade_from_bottom" as const } 
    },
    { 
      name: "ForgotPassword", 
      component: require("../screens/ForgotPassword").default,
      options: { animation: "fade_from_bottom" as const } 
    },
  ];
  
  export const privateRoutes = [
     { 
        name: "Tab", 
        component: require("../navigator/TabNavigator").default, 
        options: { animation: "fade_from_bottom" as const } 
    },
    { 
        name: "Search", 
        component: require("../screens/Search").default,
        options: { animation: "fade_from_bottom" as const } 
    },
    { 
        name: "ProductDetail", 
        component: require("../screens/ProductDetail").default, 
         options: {
          presentation: "card", 
          animation: "fade_from_bottom", 
          gestureEnabled: true,
          headerShown: false,
        },
    },
     { 
        name: "Checkout", 
        component: require("../screens/Checkout").default,
        options: { animation: "fade_from_bottom" as const } 
    },
    // { 
    //     name: "Payment", 
    //     component: require("../screens/PaymentScreen").default, 
    //     options: { 
    //         animation: "slide_from_bottom"
    //      } 
    // },
    // { 
    //     name: "Search", 
    //     component: require("../screens/SearchScreen").default, 
    //     options: { 
    //         animation: "slide_from_right"
    //      } 
    // },
    // { 
    //     name: "SearchDetails", 
    //     component: require("../screens/SearchDetailsScreeen").default, 
    //     options: { 
    //         animation: "slide_from_right"
    //      } 
    // },
  ];