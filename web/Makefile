# Copyright 2022 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

.PHONY: test

test:
	bazel test --test_output=all //plugins/chumpdetector/web:karma_test

lint_test:
	bazel test //plugins/chumpdetector/web:lint_test

lint_fix:
	bazel run //plugins/chumpdetector/web:lint_bin -- --fix "./"

build:
	bazel build //plugins/chumpdetector/web:chumpdetector && \
	cp -f ../../../bazel-bin/plugins/chumpdetector/web/chumpdetector.js ../
