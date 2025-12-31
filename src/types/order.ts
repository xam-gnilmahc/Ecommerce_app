export type Address = {
  addressLine1: string;
  addressLine2?: string;
  country: string;
  state: string;
  zipCode: string;
};

export type OrderData = {
  email: string;
  address: Address;
  amount: number;
  payment_status: string;
  shipping_method?: string;
};

export type StripeData = {
  transactionId: string;
  chargeId: string;
  message: string;
  [key: string]: any;
};
