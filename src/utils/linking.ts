import { Linking, Platform } from 'react-native';

/** Opens the device's preferred map app with a pin on the member. */
export async function openInMaps(
  latitude: number,
  longitude: number,
  label: string,
): Promise<void> {
  const encodedLabel = encodeURIComponent(label);
  const url = Platform.select({
    ios: `https://maps.apple.com/?ll=${latitude},${longitude}&q=${encodedLabel}&z=16`,
    android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodedLabel})`,
    default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
  });

  try {
    await Linking.openURL(url);
  } catch {
    await Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    );
  }
}

/** Android: app settings, where the user can allow "always" location. */
export async function openAppSettings(): Promise<void> {
  try {
    await Linking.openSettings();
  } catch {
    // Nothing else we can do; the UI still explains where to find the setting.
  }
}

/** Android: battery optimisation list, so the vendor ROM stops killing tracking. */
export async function openBatteryOptimizationSettings(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;

  try {
    await Linking.sendIntent('android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS');
    return true;
  } catch {
    try {
      await Linking.openSettings();
      return true;
    } catch {
      return false;
    }
  }
}
