/**
 * @license
 * Copyright 2021 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */
package com.googlesource.chromium.plugins.chumpdetector;

import com.google.common.flogger.FluentLogger;
import com.google.gerrit.extensions.annotations.PluginName;
import com.google.gerrit.extensions.restapi.Response;
import com.google.gerrit.extensions.restapi.RestReadView;
import com.google.gerrit.server.config.PluginConfigFactory;
import com.google.gerrit.server.project.NoSuchProjectException;
import com.google.gerrit.server.project.ProjectResource;
import com.google.gson.annotations.SerializedName;
import java.util.Iterator;
import javax.inject.Inject;
import org.eclipse.jgit.lib.Config;

class GetProjectChumpConfig implements RestReadView<ProjectResource> {
  private static final FluentLogger logger = FluentLogger.forEnclosingClass();
  private static final String PROJECT = "project";
  private final PluginConfigFactory configFactory;
  private final String pluginName;

  @Inject
  GetProjectChumpConfig(PluginConfigFactory configFactory, @PluginName String pluginName) {
    this.configFactory = configFactory;
    this.pluginName = pluginName;
  }

  @Override
  public Response<ChumpConfig> apply(ProjectResource project) throws NoSuchProjectException {
    ChumpConfig r = new ChumpConfig();

    if (!project.getUser().isIdentifiedUser()) {
      return Response.none();
    }

    Config cfg =
        configFactory.getProjectPluginConfigWithInheritance(project.getNameKey(), pluginName);

    Iterator<String> names = cfg.getSubsections(PROJECT).iterator();
    if (!names.hasNext()) {
      logger.atInfo().log("Project %s has an empty config.", project.getName());
      return Response.none();
    }
    String name = names.next();
    if (names.hasNext()) {
      logger.atInfo().log(
          "Project %s has more than one config; using the first.", project.getName());
    }

    r.treeName = name;
    r.disabled = cfg.getBoolean(PROJECT, name, "disabled", false);
    r.treeId = cfg.getString(PROJECT, name, "treeId");
    r.statusURL = cfg.getString(PROJECT, name, "statusURL");
    r.enforceCommitQueue = cfg.getBoolean(PROJECT, name, "enforceCommitQueue", false);
    r.disabledBranchPattern = cfg.getString(PROJECT, name, "disabledBranchPattern")
    if (r.disabledBranchPattern == null) {
      r.disabledBranchPattern = "^refs/meta/config$";
    }
    r.preloadImageURL = cfg.getString(PROJECT, name, "preloadImageURL");
    return Response.ok(r);
  }

  static class ChumpConfig {
    @SerializedName("disabled")
    boolean disabled;

    @SerializedName("treeName")
    String treeName;

    @SerializedName("treeId")
    String treeId;

    @SerializedName("statusURL")
    String statusURL;

    @SerializedName("enforceCommitQueue")
    boolean enforceCommitQueue;

    @SerializedName("disabledBranchPattern")
    String disabledBranchPattern;

    @SerializedName("preloadImageURL")
    String preloadImageURL;
  }
}
