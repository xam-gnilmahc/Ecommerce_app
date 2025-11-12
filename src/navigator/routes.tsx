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
    // { 
    //     name: "Details", 
    //     component: require("../screens/DetailsScreen").default, 
    //     options: { 
    //         animation: "slide_from_bottom"
    //      } 
    // },
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