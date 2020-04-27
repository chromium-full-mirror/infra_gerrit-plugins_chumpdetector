// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import {TreeStatus} from './tree-status.js';
import './tree-status-view.js';
import './confirm-message-view.js';

Gerrit.install(plugin => {
  const treeStatus = new TreeStatus(plugin.restApi);
  plugin.registerCustomComponent(
    'change-metadata-item', 'tree-status-view').onAttached(treeStatusView => {
      treeStatus.register(treeStatusView);
    });
  plugin.registerCustomComponent(
    'confirm-submit-change', 'confirm-message').onAttached(confirmMessage => {
      treeStatus.register(confirmMessage);
    });
});
