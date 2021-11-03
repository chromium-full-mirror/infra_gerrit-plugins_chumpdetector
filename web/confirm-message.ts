/**
 * @license
 * Copyright 2021 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

import {ChangeInfo} from '@gerritcodereview/typescript-api/rest-api';

import {LitElement, PropertyValues, html} from 'lit';

import {customElement, property, state} from 'lit/decorators';

import {TreeStatus, Status} from './tree-status';
import {Config} from './config';

/**
 * UI that shows on submit to warn user about CQ and current status.
 */
@customElement('confirm-message')
export class ConfirmMessage extends LitElement {
  @property()
  change!: ChangeInfo;

  @property()
  config: Config | null = null;

  @property()
  status: Status | null = null;

  @property()
  tree: TreeStatus | null = null;

  @state()
  protected disabled = true;

  @state()
  protected message = '';

  override render() {
    return html`<div ?hidden="${this.disabled}" style="max-width:500px;">
      ${this.message}
    </div>`;
  }

  override update(changedProperties: PropertyValues) {
    this.onChange();
    super.update(changedProperties);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this.tree) {
      this.tree.clear();
    }
  }

  private onChange() {
    if (this.config === null || this.status === null) {
      return;
    }

    // Change is in unsupported branch, do not block it.
    if (this.status.disabled) {
      this.disabled = true;
      return;
    }

    // Change should be submitted via CQ (not directly via Gerrit).
    if (this.config.enforceCommitQueue) {
      this.disabled = false;
      this.message =
        `The ${this.config.treeName} project uses the commit queue (CQ). ` +
        'You should submit your change by clicking "Reply" and setting the ' +
        '"Commit-Queue" label to the appropriate value.\n' +
        'If there is a valid reason to bypass the CQ, please state it in ' +
        'a comment and coordinate with the corresponding oncall staff.\n' +
        "Once you've completed those steps, do you still want to commit the " +
        'change directly, bypassing the CQ (dangerous)?';
      return;
    }

    // Tree is open, do not block the change.
    if (this.status.isOpen) {
      this.disabled = true;
      return;
    }

    // Tree status is unknown, closed (or in some entirely unexpected state).
    // Warn the user.
    this.disabled = false;
    this.message =
      `${this.config.treeName} tree status is ${this.status.generalState}, ` +
      'submitting this change is dangerous. Submit anyway?';
  }
}
