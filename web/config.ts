/**
 * @license
 * Copyright 2021 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

export interface Config {
  disabled: boolean;
  treeName: string;
  treeId?: string;
  statusURL?: string;
  enforceCommitQueue: boolean;
  disabledBranchPattern: string;
  preloadImageURL: string;
}
