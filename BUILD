load("@npm_bazel_rollup//:index.bzl", "rollup_bundle")
load("//tools/bzl:plugin.bzl", "gerrit_plugin")
load("//tools/bzl:js.bzl", "polygerrit_plugin")

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

rollup_bundle(
    name = "chumpdetector-bundle",
    srcs = glob(["src/main/resources/static/*.js"]),
    entry_point = "src/main/resources/static/chumpdetector.js",
    rollup_bin = "//tools/node_tools:rollup-bin",
    sourcemap = "hidden",
    deps = [
        "@tools_npm//rollup-plugin-node-resolve",
    ],
)

polygerrit_plugin(
    name = "chumpdetector_ui",
    app = "chumpdetector-bundle.js",
    plugin_name = "chumpdetector",
)
