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
      android.widget.Toast.makeText(this, "PREV CRASH:\\n\$prev", android.widget.Toast.LENGTH_LONG).show()
    }
    val h = Thread.getDefaultUncaughtExceptionHandler()
    Thread.setDefaultUncaughtExceptionHandler { _, t ->
      try {
        val msg = t.javaClass.name + ": " + (t.message ?: "null") +
          "\\n" + t.stackTrace.take(4).joinToString("\\n") { it.toString() }
        prefs.edit().putString("msg", msg).commit()
      } catch (_: Exception) {}
      h?.uncaughtException(Thread.currentThread(), t)
    }
  }
`;

  return src
    .replace(MARKER, helperFn + "\n  " + MARKER)
    .replace(MARKER + " {\n", MARKER + " {\n    installCrashLogger()\n");
}
