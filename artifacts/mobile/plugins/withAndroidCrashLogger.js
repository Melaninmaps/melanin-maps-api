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
      android.widget.Toast.makeText(this, "PREV CRASH: " + prev, android.widget.Toast.LENGTH_LONG).show()
      try {
        val shareIntent = android.content.Intent(android.content.Intent.ACTION_SEND)
        shareIntent.type = "text/plain"
        shareIntent.putExtra(android.content.Intent.EXTRA_SUBJECT, "MWM Crash Report")
        shareIntent.putExtra(android.content.Intent.EXTRA_TEXT, "CRASH REPORT:\\n" + prev)
        val chooser = android.content.Intent.createChooser(shareIntent, "Send crash report")
        chooser.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
        startActivity(chooser)
      } catch (e: Exception) {}
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
