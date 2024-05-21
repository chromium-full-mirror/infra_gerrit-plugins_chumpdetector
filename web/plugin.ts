/**
 * @license
 * Copyright 2021 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

import '@gerritcodereview/typescript-api/gerrit';

import './tree-status';
import {TreeStatus, TreeStatusView} from './tree-status';
import './confirm-message';
import {ConfirmMessage} from './confirm-message';
import {initAuth} from './auth';

window.Gerrit.install(plugin => {
  initAuth(plugin);
  const treeStatus = new TreeStatus(plugin.restApi());
  plugin
    .registerCustomComponent('commit-container', 'tree-status-view')
    .onAttached(treeStatusView => {
      treeStatus.register(treeStatusView as TreeStatusView);
    });
  plugin
    .registerCustomComponent('confirm-submit-change', 'confirm-message')
    .onAttached(confirmMessage => {
      treeStatus.register(confirmMessage as ConfirmMessage);
    });
});
