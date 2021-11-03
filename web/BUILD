load("@npm//@bazel/rollup:index.bzl", "rollup_bundle")
load("//tools/bzl:js.bzl", "polygerrit_plugin")

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
