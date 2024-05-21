/**
 * @license
 * Copyright 2021 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

import {assert} from '@open-wc/testing';

import './confirm-message';

import {ConfirmMessage} from './confirm-message';

suite('confirm-message basic tests', () => {
  let element: ConfirmMessage;

  setup(() => {
    element = document.createElement('confirm-message') as ConfirmMessage;
    document.body.appendChild(element);
  });

  teardown(() => {
    document.body.removeChild(element);
  });

  test('sets disabled if status is disabled', async () => {
    element.config = {
      enforceCommitQueue: false,
      disabled: false,
      disabledBranchPattern: '',
      preloadImageURL: '',
      statusURL: '',
      treeName: '',
      treeId: '',
    };

    element.status = {
      disabled: true,
      date: new Date(),
      generalState: '',
      isOpen: false,
      message: '',
      url: null,
      username: '',
    };
    await element.updateComplete;
    const root = element.shadowRoot ?? element;
    assert.isTrue(root.querySelector('div')?.hidden);
  });

  test('sets message with enforceCommitQueue', async () => {
    element.config = {
      treeName: 'foo',
      treeId: '',
      enforceCommitQueue: true,
      disabled: false,
      disabledBranchPattern: '',
      preloadImageURL: '',
      statusURL: '',
    };
    element.status = {
      disabled: false,
      date: new Date(),
      generalState: '',
      isOpen: false,
      message: '',
      url: null,
      username: '',
    };
    await element.updateComplete;
    const root = element.shadowRoot ?? element;
    assert.isFalse(root.querySelector('div')?.hidden);
    assert.include(
      root.querySelector('div')?.innerHTML,
      'The foo project uses the commit queue'
    );
  });

  test('sets disabled if status isOpen', async () => {
    element.config = {
      treeName: '',
      treeId: '',
      enforceCommitQueue: false,
      disabled: false,
      disabledBranchPattern: '',
      preloadImageURL: '',
      statusURL: '',
    };
    element.status = {
      disabled: false,
      date: new Date(),
      generalState: '',
      isOpen: true,
      message: '',
      url: null,
      username: '',
    };
    await element.updateComplete;
    const root = element.shadowRoot ?? element;
    assert.isTrue(root.querySelector('div')?.hidden);
  });

  test('sets message if tree status is unknown', async () => {
    element.config = {
      treeName: 'foo',
      treeId: 'foo',
      enforceCommitQueue: false,
      disabled: false,
      disabledBranchPattern: '',
      preloadImageURL: '',
      statusURL: '',
    };
    element.status = {
      disabled: false,
      date: new Date(),
      generalState: 'baz',
      isOpen: false,
      message: '',
      url: null,
      username: '',
    };
    await element.updateComplete;
    const root = element.shadowRoot ?? element;
    assert.isFalse(root.querySelector('div')?.hidden);
    assert.include(
      root.querySelector('div')?.innerHTML,
      'foo tree status is baz'
    );
  });

  test('supports enforcing CQ without a tree status', async () => {
    element.config = {
      treeName: 'foo',
      treeId: 'foo',
      enforceCommitQueue: true,
      disabled: false,
      disabledBranchPattern: '',
      preloadImageURL: '',
      statusURL: '',
    };
    element.status = null;
    await element.updateComplete;
    const root = element.shadowRoot ?? element;
    assert.isFalse(root.querySelector('div')?.hidden);
    assert.include(
      root.querySelector('div')?.innerHTML,
      'The foo project uses the commit queue (CQ)'
    );
  });
});
