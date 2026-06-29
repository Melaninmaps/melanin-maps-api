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
  private fun installCrashLogger() {
    val prefs = getSharedPreferences("__crash_log__", 0)
    val prev = prefs.getString("msg", null)
    if (prev != null) {
      prefs.edit().remove("msg").apply()
      android.widget.Toast.makeText(this, "PREV CRASH:\\n" + prev, android.widget.Toast.LENGTH_LONG).show()
      val crashData = prev
      Thread {
        try {
          val encoded = java.net.URLEncoder.encode(crashData, "UTF-8")
          val conn = java.net.URL("https://mappingwithmelanin.com/api/debug/crash-report?d=" + encoded).openConnection() as java.net.HttpURLConnection
          conn.connectTimeout = 8000
          conn.readTimeout = 8000
          conn.responseCode
          conn.disconnect()
        } catch (e: Exception) {}
      }.start()
    }
    val h = Thread.getDefaultUncaughtExceptionHandler()
    Thread.setDefaultUncaughtExceptionHandler { _, t ->
      try {
        val msg = t.javaClass.name + ": " + (t.message ?: "null") +
          "\\n" + t.stackTrace.take(6).joinToString("\\n") { it.toString() }
        prefs.edit().putString("msg", msg).commit()
      } catch (e: Exception) {}
      h?.uncaughtException(Thread.currentThread(), t)
    }
  }
`;

  return src
    .replace(MARKER, helperFn + "\n  " + MARKER)
    .replace(MARKER + " {\n", MARKER + " {\n    installCrashLogger()\n");
}
