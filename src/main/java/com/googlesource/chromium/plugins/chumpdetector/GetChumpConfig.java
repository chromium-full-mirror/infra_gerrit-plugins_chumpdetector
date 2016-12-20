// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

package com.googlesource.chromium.plugins.chumpdetector;

import com.google.gerrit.extensions.annotations.PluginName;
import com.google.gerrit.extensions.restapi.RestReadView;
import com.google.gerrit.server.config.AllProjectsName;
import com.google.gerrit.server.config.ConfigResource;
import com.google.gerrit.server.config.PluginConfigFactory;
import com.google.gson.annotations.SerializedName;
import java.util.ArrayList;
import java.util.List;
import javax.inject.Inject;
import org.eclipse.jgit.lib.Config;

class GetChumpConfig implements RestReadView<ConfigResource> {
  private static final String PROJECT = "project";

  private final PluginConfigFactory configFactory;
  private final AllProjectsName allProjects;
  private final String pluginName;

  @Inject
  GetChumpConfig(
      PluginConfigFactory configFactory,
      AllProjectsName allProjects,
      @PluginName String pluginName) {
    this.configFactory = configFactory;
    this.allProjects = allProjects;
    this.pluginName = pluginName;
  }

  @Override
  public ChumpConfig apply(ConfigResource resource) throws Exception {
    Config cfg = configFactory.getProjectPluginConfig(allProjects, pluginName);

    ChumpConfig r = new ChumpConfig();
    for (String name : cfg.getSubsections(PROJECT)) {
      Project p = new Project();
      p.topLevelName = name;
      p.pattern = cfg.getString(PROJECT, name, "pattern");
      p.viewURL = cfg.getString(PROJECT, name, "viewURL");
      p.statusURL = cfg.getString(PROJECT, name, "statusURL");
      p.withCredentials = cfg.getBoolean(PROJECT, name, "withCredentials", false);
      p.enforceCommitQueue = cfg.getBoolean(PROJECT, name, "enforceCommitQueue", false);
      p.disabledBranchPattern = cfg.getString(PROJECT, name, "disabledBranchPattern");
      p.enforceCommitQueue = cfg.getBoolean(PROJECT, name, "enforceCommitQueue", false);
      r.projects.add(p);
    }
    return r;
  }

  static class ChumpConfig {
    List<Project> projects = new ArrayList<>();
  }

  static class Project {
    @SerializedName("topLevelName")
    String topLevelName;

    String pattern;

    @SerializedName("viewURL")
    String viewURL;

    @SerializedName("statusURL")
    String statusURL;

    @SerializedName("withCredentials")
    boolean withCredentials;

    @SerializedName("enforceCommitQueue")
    boolean enforceCommitQueue;

    @SerializedName("disabledBranchPattern")
    String disabledBranchPattern;
  }
}
