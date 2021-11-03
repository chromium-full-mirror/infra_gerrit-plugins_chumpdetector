/**
 * @license
 * Copyright 2021 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */
import './test/test-setup';

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
      loginURL: '',
      preloadImageURL: '',
      statusURL: '',
      treeName: '',
      viewURL: '',
      withCredentials: false,
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
      enforceCommitQueue: true,
      disabled: false,
      disabledBranchPattern: '',
      loginURL: '',
      preloadImageURL: '',
      statusURL: '',
      viewURL: '',
      withCredentials: false,
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
      enforceCommitQueue: false,
      disabled: false,
      disabledBranchPattern: '',
      loginURL: '',
      preloadImageURL: '',
      statusURL: '',
      viewURL: '',
      withCredentials: false,
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
      enforceCommitQueue: false,
      disabled: false,
      disabledBranchPattern: '',
      loginURL: '',
      preloadImageURL: '',
      statusURL: '',
      viewURL: '',
      withCredentials: false,
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
});
