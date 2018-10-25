load("//tools/bzl:plugin.bzl", "gerrit_plugin")
load("//tools/bzl:js.bzl", "bundle_assets", "polygerrit_plugin")

gerrit_plugin(
    name = "chumpdetector",
    srcs = glob(["src/main/java/**/*.java"]),
    manifest_entries = [
        "Gerrit-PluginName: chumpdetector",
        "Gerrit-Module: com.googlesource.chromium.plugins.chumpdetector.ChumpDetectorModule",
        "Implementation-Title: Chumpdetector plugin",
    ],
    resources = glob(["src/main/**/*"]),
)

polygerrit_plugin(
    name = "chumpdetector_ui",
    plugin_name = "chumpdetector",
    app = "src/main/resources/static/chumpdetector.js",
)
