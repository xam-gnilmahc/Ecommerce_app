
// Notification interface
export interface Notification {
  [key: string]: any;  
}
// Notification state interface
export interface NotificationState {
  loading: boolean;
  list: Notification[];
  response: { success: boolean; message: string } | null;
}

// Standard action response interface
export interface ActionResponse {
  success: boolean;
  message: string;
}
