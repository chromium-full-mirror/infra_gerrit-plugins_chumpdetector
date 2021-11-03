<!DOCTYPE html>
<!--
Copyright 2021 The Chromium Authors. All rights reserved.
Use of this source code is governed by a BSD-style license that can be
found in the LICENSE file.
-->
<meta name="viewport" content="width=device-width, minimum-scale=1.0, initial-scale=1.0, user-scalable=yes">
<title>confirm-message tests</title>

<script src="../node_modules/@webcomponents/webcomponentsjs/webcomponents-loader.js"></script>
<script src="../node_modules/web-component-tester/browser.js"></script>

<test-fixture id="basic">
  <template>
    <confirm-message></confirm-message>
  </template>
</test-fixture>

<script type="module">
  import './common-test-setup.js';
  import '../src/main/resources/static/confirm-message-view.js';

  suite('confirm-message basic tests', () => {
    let sandbox;
    let element;

    setup(() => {
      element = fixture('basic');
      Object.assign(element, {disabled: false, message: ''});
      sandbox = sinon.sandbox.create();
    });

    teardown(() => {
      sandbox.restore();
    });

    test('_onChange sets disabled if status is disabled', () => {
      const config = {enforceCommitQueue: false};
      const status = {disabled: true};
      element._onChange(config, status);
      assert.isTrue(element.disabled);
    });

    test('_onChange sets message with enforceCommitQueue', () => {
      const config = {treeName: 'foo', enforceCommitQueue: true};
      const status = {disabled: false};
      element._onChange(config, status);
      assert.isFalse(element.disabled);
      assert.isTrue(element.message.startsWith('The foo project uses'));
    });

    test('_onChange sets disabled if status isOpen', () => {
      const config = {enforceCommitQueue: false};
      const status = {disabled: false, isOpen: true};
      element._onChange(config, status);
      assert.isTrue(element.disabled);
    });

    test('_onChange sets message if tree status is unknown', () => {
      const config = {treeName: 'foo', enforceCommitQueue: false};
      const status = {disabled: false, isOpen: false, generalState: 'baz'};
      element._onChange(config, status);
      assert.isFalse(element.disabled);
      assert.isTrue(element.message.startsWith('foo tree status is baz'));
    });
  });
</script>
