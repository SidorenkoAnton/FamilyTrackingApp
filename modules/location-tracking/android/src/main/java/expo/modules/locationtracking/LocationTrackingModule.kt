package expo.modules.locationtracking

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import android.content.Intent
import android.os.Build

class LocationTrackingModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("LocationTracking")

    Function("setCredentials") { groupId: String, token: String ->
      val context = requireNotNull(appContext.reactContext)
      val prefs = context.getSharedPreferences("LocationTrackingPrefs", android.content.Context.MODE_PRIVATE)
      prefs.edit()
        .putString("groupId", groupId)
        .putString("token", token)
        .apply()
    }

    Function("startTracking") {
      val context = requireNotNull(appContext.reactContext)
      val intent = Intent(context, LocationTrackingService::class.java)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(intent)
      } else {
        context.startService(intent)
      }
    }

    Function("stopTracking") {
      val context = requireNotNull(appContext.reactContext)
      val intent = Intent(context, LocationTrackingService::class.java)
      context.stopService(intent)
    }
  }
}