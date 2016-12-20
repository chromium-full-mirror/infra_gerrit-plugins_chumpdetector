include_defs('//bucklets/gerrit_plugin.bucklet')

gerrit_plugin(
  name = 'chumpdetector',
  srcs = glob(['src/main/java/**/*.java']),
  resources = glob(['src/main/**/*']),
  manifest_entries = [
    'Gerrit-PluginName: chumpdetector',
    'Gerrit-Module: com.googlesource.chromium.plugins.chumpdetector.ChumpDetectorModule',
    'Implementation-Title: Chumpdetector plugin',
  ],
)
