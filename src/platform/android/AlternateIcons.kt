// /src/platform/android/AlternateIcons.kt
package expo.modules.alternateappicons

import android.app.ActivityManager
import android.content.Context
import android.content.ComponentName
import android.content.pm.PackageManager
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Milvayo's implementation: selection comes from package state, never the launching Activity.
class ExpoAlternateAppIconsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoAlternateAppIcons")
    Constants("supportsAlternateIcons" to true)
    Function("getAppIconName") { selectedIcon() }
    AsyncFunction("getPreviousProcessExit") { previousExit() }
    AsyncFunction("setAlternateAppIcon") { icon: String? ->
      val context = appContext.reactContext ?: error("Application context unavailable")
      val manager = context.packageManager
      val names = launcherNames()
      val target = "${context.packageName}.MainActivity${icon ?: ""}"
      require(names.contains(target)) { "Unknown launcher icon" }
      // Enable first on older Android so a failure never leaves the app without an entry.
      val ordered = listOf(target) + names.filter { it != target }
      if (Build.VERSION.SDK_INT >= 33) {
        manager.setComponentEnabledSettings(ordered.map { name ->
          PackageManager.ComponentEnabledSetting(ComponentName(context, name),
            if (name == target) PackageManager.COMPONENT_ENABLED_STATE_ENABLED else PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
            PackageManager.DONT_KILL_APP)
        })
      } else {
        ordered.forEach { name -> manager.setComponentEnabledSetting(ComponentName(context, name),
          if (name == target) PackageManager.COMPONENT_ENABLED_STATE_ENABLED else PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
          PackageManager.DONT_KILL_APP) }
      }
      icon
    }
  }
  private fun previousExit(): Map<String, Any>? {
    if (Build.VERSION.SDK_INT < 30) return null
    val context = appContext.reactContext ?: return null
    val manager = context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager ?: return null
    // Own-package main process only; do not copy traces, paths or process descriptions.
    val exit = manager.getHistoricalProcessExitReasons(context.packageName, 0, 10)
      .firstOrNull { it.processName == context.packageName } ?: return null
    return mapOf("timestamp" to exit.timestamp, "reason" to exit.reason)
  }
  private fun launcherNames(): List<String> {
    val context = appContext.reactContext ?: error("Application context unavailable")
    val main = "${context.packageName}.MainActivity"
    @Suppress("DEPRECATION")
    val activities = context.packageManager.getPackageInfo(context.packageName,
      PackageManager.GET_ACTIVITIES or PackageManager.MATCH_DISABLED_COMPONENTS).activities.orEmpty()
    return activities.filter { it.name == main || it.targetActivity == main }.map { it.name }
  }
  private fun selectedIcon(): String? {
    val context = appContext.reactContext ?: return null
    val manager = context.packageManager
    val main = "${context.packageName}.MainActivity"
    return launcherNames().firstOrNull { name ->
      val setting = manager.getComponentEnabledSetting(ComponentName(context, name))
      setting == PackageManager.COMPONENT_ENABLED_STATE_ENABLED ||
        (setting == PackageManager.COMPONENT_ENABLED_STATE_DEFAULT && name == main)
    }?.removePrefix(main)?.ifEmpty { null }
  }
}
