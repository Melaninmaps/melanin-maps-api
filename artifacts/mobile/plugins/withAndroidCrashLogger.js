const { withMainApplication } = require("@expo/config-plugins");

module.exports = function withAndroidCrashLogger(config) {
  return withMainApplication(config, (config) => {
    config.modResults.contents = addCrashLogger(config.modResults.contents);
    return config;
  });
};

function addCrashLogger(src) {
  const MARKER = "override fun onCreate()";
  if (!src.includes(MARKER)) return src;

  const helperFn = `
  private fun showCrashNotification(title: String, body: String) {
    try {
      val nm = getSystemService(android.content.Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
      val chId = "crash_debug_ch"
      val ch = android.app.NotificationChannel(chId, "Crash Debug", android.app.NotificationManager.IMPORTANCE_HIGH)
      nm.createNotificationChannel(ch)
      val n = android.app.Notification.Builder(this, chId)
        .setContentTitle(title)
        .setContentText(body)
        .setStyle(android.app.Notification.BigTextStyle().bigText(body))
        .setSmallIcon(android.R.drawable.ic_dialog_alert)
        .setAutoCancel(false)
        .build()
      nm.notify(8877, n)
    } catch (_: Exception) {}
  }

  private fun installCrashLogger() {
    val prefs = getSharedPreferences("__crash_log__", 0)
    val prevClass = prefs.getString("cls", null)
    val prevMsg  = prefs.getString("msg", null)
    val prevStack = prefs.getString("stk", null)
    if (prevClass != null) {
      prefs.edit().clear().apply()
      val body = "$prevClass\n$prevMsg\n---\n$prevStack"
      showCrashNotification("PREV CRASH", body)
      android.widget.Toast.makeText(this, "$prevClass: $prevMsg", android.widget.Toast.LENGTH_LONG).show()
    }
    val h = Thread.getDefaultUncaughtExceptionHandler()
    Thread.setDefaultUncaughtExceptionHandler { _, t ->
      try {
        prefs.edit()
          .putString("cls", t.javaClass.name)
          .putString("msg", t.message ?: "null")
          .putString("stk", t.stackTrace.take(6).joinToString("\\n") { it.toString() })
          .commit()
      } catch (_: Exception) {}
      h?.uncaughtException(Thread.currentThread(), t)
    }
  }
`;

  return src
    .replace(MARKER, helperFn + "\n  " + MARKER)
    .replace(MARKER + " {\n", MARKER + " {\n    installCrashLogger()\n");
}
