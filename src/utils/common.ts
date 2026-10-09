import { PermissionsAndroid, Platform } from 'react-native';

export async function requestLocationPermissions() {
  if (Platform.OS !== 'android') return true;

  const granted = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
  ]);

  return (
    granted['android.permission.ACCESS_FINE_LOCATION'] === 'granted' &&
    granted['android.permission.ACCESS_COARSE_LOCATION'] === 'granted'
  );
}