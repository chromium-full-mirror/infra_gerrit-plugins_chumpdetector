/**
 * @license
 * Copyright 2021 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

import './test-setup';
import {assert, fixture, html} from '@open-wc/testing';

import './tree-status';

import {Status, TreeStatusView} from './tree-status';

suite('tree-status-view basic tests', () => {
  let element: TreeStatusView;

  setup(async () => {
    element = await fixture<TreeStatusView>(
      html`<tree-status-view></tree-status-view>`
    );
    await element.updateComplete;
  });

  test('getClass tests', async () => {
    element.status = null;
    await element.updateComplete;
    const root = element.shadowRoot ?? element;
    assert.isEmpty(root.querySelectorAll('#main'));

    element.status = {} as Status;
    await element.updateComplete;
    assert.strictEqual(root.querySelector('#value')?.className, 'unknown');

    element.status = {generalState: 'foo'} as Status;
    await element.updateComplete;
    assert.strictEqual(root.querySelector('#value')?.className, 'foo');
  });
});
