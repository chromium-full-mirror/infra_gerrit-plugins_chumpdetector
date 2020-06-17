// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

class ConfirmMessage extends Polymer.Element {
  static get is() {
    return 'confirm-message';
  }

  static get template() {
    return Polymer.html`
      <div hidden="[[disabled]]">
        [[message]]
      </div>
    `;
  }

  static get properties() {
    return {
      config: {
        type: Object,
        value: null,
      },
      disabled: {
        type: Boolean,
        value: true,
      },
      message: {
        type: String,
      },
      status: {
        type: Object,
        value: null,
      },
      tree: {
        type: Object,
      },
    };
  }

  static get observers() {
    return [
      '_onChange(config, status)',
    ];
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.tree) {
      this.tree.clear();
    }
  }

  _onChange(config, status) {
    if (!config || !status) {
      return;
    }

    // Change is in unsupported branch, do not block it.
    if (status.disabled) {
      this.disabled = true;
      return;
    }

    // Change should be submitted via CQ (not directly via Gerrit).
    if (config.enforceCommitQueue) {
      this.disabled = false;
      this.message =
        `The ${config.treeName} project uses the commit queue (CQ). ` +
        `You should submit your change by clicking "Reply" and setting the ` +
        `"Commit-Queue" label to the appropriate value.\n` +
        `If there is a valid reason to bypass the CQ, please state it in ` +
        `a comment and coordinate with the corresponding oncall staff.\n` +
        `Once you've completed those steps, do you still want to commit the ` +
        `change directly, bypassing the CQ (dangerous)?`;
      return;
    }

    // Tree is open, do not block the change.
    if (status.isOpen) {
      this.disabled = true;
      return;
    }

    // Tree status is unknown, closed (or in some entirely unexpected state).
    // Warn the user.
    this.disabled = false;
    this.message =
      `${config.treeName} tree status is ${status.generalState}, submitting `
      `this change is dangerous.  Submit anyway?`;
  }
}

customElements.define(ConfirmMessage.is, ConfirmMessage);
