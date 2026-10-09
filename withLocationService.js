const { withAndroidManifest } = require('@expo/config-plugins');

const withLocationService = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;
    const mainApplication = androidManifest.application[0];

    // 1. Добавляем разрешения
    if (!androidManifest['uses-permission']) {
      androidManifest['uses-permission'] = [];
    }
    
    const permissions = [
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS'
    ];

    for (const permission of permissions) {
      const exists = androidManifest['uses-permission'].some(
        (p) => p.$['android:name'] === permission
      );
      if (!exists) {
        androidManifest['uses-permission'].push({
          $: { 'android:name': permission },
        });
      }
    }

    // 2. Добавляем <service>
    if (!mainApplication.service) {
      mainApplication.service = [];
    }
    const serviceExists = mainApplication.service.some(
      (s) => s.$['android:name'] === 'expo.modules.locationtracking.LocationTrackingService'
    );
    if (!serviceExists) {
      mainApplication.service.push({
        $: {
          'android:name': 'expo.modules.locationtracking.LocationTrackingService',
          'android:enabled': 'true',
          'android:exported': 'false',
          'android:foregroundServiceType': 'location',
          'android:stopWithTask': 'false',
        },
      });
    }

    // 3. Добавляем <receiver>
    if (!mainApplication.receiver) {
      mainApplication.receiver = [];
    }
    const receiverExists = mainApplication.receiver.some(
      (r) => r.$['android:name'] === 'expo.modules.locationtracking.BootReceiver'
    );
    if (!receiverExists) {
      mainApplication.receiver.push({
        $: {
          'android:name': 'expo.modules.locationtracking.BootReceiver',
          'android:enabled': 'true',
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            action: [
              { $: { 'android:name': 'android.intent.action.BOOT_COMPLETED' } },
              { $: { 'android:name': 'android.intent.action.QUICKBOOT_POWERON' } },
            ],
          },
        ],
      });
    }

    return config;
  });
};

module.exports = withLocationService;