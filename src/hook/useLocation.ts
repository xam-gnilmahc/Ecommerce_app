// hook/useLocation.ts - REAL LOCATION VERSION
import { useState } from "react";
import { Platform, PermissionsAndroid } from "react-native";
import Geolocation from "@react-native-community/geolocation";

export interface LocationData {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
}

export const useLocation = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -------------------------------------------
  // ASK PERMISSION
  // -------------------------------------------
  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  // -------------------------------------------
  // REAL REVERSE GEOCODE (GOOGLE API)
  // -------------------------------------------
  const reverseGeocode = async (lat: number, lng: number): Promise<LocationData> => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`;

      const response = await fetch(url, {
        headers: { "User-Agent": "React Native" },
      });

      const json = await response.json();

      const address = json.address || {};

      return {
        address: json.display_name || "",
        city: address.city || address.town || address.village || "",
        state: address.state || "",
        zipCode: address.postcode || "",
        country: address.country || "",
        fullAddress: json.display_name || "",
        latitude: lat,
        longitude: lng,
      };
    } catch (e) {
      return {
        address: "Unknown",
        city: "",
        state: "",
        zipCode: "",
        country: "",
        fullAddress: "",
        latitude: lat,
        longitude: lng,
      };
    }
  };

  // -------------------------------------------
  // GET CURRENT LOCATION
  // -------------------------------------------
  const getCurrentLocation = async () => {
    setLoading(true);
    setError(null);

    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setError("Permission denied");
      setLoading(false);
      return null;
    }

    return new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;

          const realLocation = await reverseGeocode(latitude, longitude);

          setLocation(realLocation);
          setLoading(false);
          resolve(realLocation);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });
  };

  return { location, loading, error, getCurrentLocation };
};
