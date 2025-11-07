import React, { createContext, useState, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, FONTSIZE, SPACING } from '../theme/theme';

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
    setTimeout(() => setNotification(null), 2000);
  };

  return (
    <ResponseNotificationContext.Provider value={{ showResponse }}>
      {children}

      {notification && (
        <Animatable.View
          animation="fadeInDown"
          duration={400}
          style={styles.container}
        >
          <LinearGradient
            colors={
              notification.type === 'success'
                ? ['#D1FADF', '#A3E4B8'] 
                : ['#FADBD8', '#F5B7B1']
            }
            style={styles.toast}
          >
            <View style={styles.messageContainer}>
              <Ionicons
                name={
                  notification.type === 'success'
                    ? 'checkmark-circle'
                    : 'close-circle'
                }
                size={FONTSIZE.size_24}
                color={
                  notification.type === 'success' ? '#0F5132' : '#842029'
                }
                style={{ marginRight: SPACING.space_10 }}
              />
              <Text
                style={[
                  styles.toastText,
                  {
                    color:
                      notification.type === 'success'
                        ? '#0F5132'
                        : '#7B241C',
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
                size={FONTSIZE.size_18}
                color={
                  notification.type === 'success' ? '#0F5132' : '#842029'
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
    top: 50,
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: width * 0.9,
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toastText: {
    fontSize: FONTSIZE.size_16,
    fontWeight: '500',
    flexShrink: 1,
  },
  closeButton: {
    padding: 5,
    marginLeft: SPACING.space_10,
  },
});
