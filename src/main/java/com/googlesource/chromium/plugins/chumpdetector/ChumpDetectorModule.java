// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

package com.googlesource.chromium.plugins.chumpdetector;

import static com.google.gerrit.server.config.ConfigResource.CONFIG_KIND;
import static com.google.gerrit.server.project.ProjectResource.PROJECT_KIND;

import com.google.gerrit.extensions.registration.DynamicSet;
import com.google.gerrit.extensions.restapi.RestApiModule;
import com.google.gerrit.extensions.webui.WebUiPlugin;

/** Loads {@code chumpdetector} plugin for Chrome. */
public class ChumpDetectorModule extends RestApiModule {
  @Override
  protected void configure() {
    DynamicSet.bind(binder(), WebUiPlugin.class).toInstance(WebUiPlugin.js("chumpdetector.js"));

    get(PROJECT_KIND, "config").to(GetProjectChumpConfig.class);

    // TODO(agable): Remove this and GetHostChumpConfig.java. These exist only
    // for backwards compatibility during the transition, and can be deleted
    // after the next deployment.
    get(CONFIG_KIND, "config").to(GetChumpConfig.class);
  }
}
