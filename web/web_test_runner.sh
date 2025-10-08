#!/bin/bash

set -euo pipefail

./$1 --config $2 \
  --dir 'plugins/chumpdetector/web/_bazel_ts_out_tests' \
  --test-files 'plugins/chumpdetector/web/_bazel_ts_out_tests/*_test.js' \
  --ts-config="plugins/chumpdetector/web/tsconfig.json"
