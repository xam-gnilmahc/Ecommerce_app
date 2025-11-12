import React, { createContext, useState, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { BlurView } from '@react-native-community/blur';

const { width } = Dimensions.get('window');

type NotificationType = 'success' | 'error';

type Notification = {
  message: string;
  type: NotificationType;
};

type ResponseNotificationContextType = {
  showResponse: (message: string, type?: NotificationType) => void;
};

export const ResponseNotificationContext =
  createContext<ResponseNotificationContextType>({
    showResponse: () => {},
  });

export const ResponseNotificationProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [notification, setNotification] = useState<Notification | null>(null);

  const showResponse = (message: string, type: NotificationType = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 2500);
  };

  return (
    <ResponseNotificationContext.Provider value={{ showResponse }}>
      {children}

      {notification && (
        <Animatable.View
          animation="fadeInDown"
          duration={400}
          easing="ease-out-cubic"
          style={styles.container}
        >
          <LinearGradient
            colors={
              notification.type === 'success'
                ? ['#D7F8E4', '#B2F0CC', '#7EE0A0']
                : ['#FFE1E1', '#FFC1C1', '#FF9F9F']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.toast}
          >
            {Platform.OS === 'ios' && (
              <BlurView
                style={StyleSheet.absoluteFill}
                blurType="light"
                blurAmount={20}
              />
            )}

            <View style={styles.messageContainer}>
              <Ionicons
                name={
                  notification.type === 'success'
                    ? 'checkmark-circle'
                    : 'close-circle'
                }
                size={24}
                color={notification.type === 'success' ? '#116C3D' : '#A30000'}
                style={styles.icon}
              />
              <Text
                style={[
                  styles.toastText,
                  {
                    color:
                      notification.type === 'success' ? '#0B3D23' : '#6E0000',
                  },
                ]}
              >
                {notification.message}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setNotification(null)}
              style={styles.closeButton}
            >
              <Ionicons
                name="close"
                size={20}
                color={
                  notification.type === 'success' ? '#0B3D23' : '#6E0000'
                }
              />
            </TouchableOpacity>
          </LinearGradient>
        </Animatable.View>
      )}
    </ResponseNotificationContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: width * 0.9,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toastText: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  icon: {
    marginRight: 10,
  },
  closeButton: {
    marginLeft: 10,
    padding: 5,
  },
});
