// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Tree status UI for some single change.
 */
export class TreeStatusView extends Polymer.Element {
  static get is() {
    return 'tree-status-view';
  }

  static get template() {
    return Polymer.html`
      <style>
        #outerDiv {
          align-items: center;
          display: flex;
          font-size: 1.1em;
          overflow-wrap: anywhere;
          margin: 5px 0 8px;
          padding: .4em;
          max-width: 20em;
        }
        #outerDiv.unknown {
          color: black;
          background-color: #FFFC6C;
        }
        #outerDiv.open {
          color: black;
          background-color: #BCE889;
        }
        #outerDiv.closed {
          color: white;
          background-color: #E98080;
        }
        #outerDiv.hidden {
          display: none;
        }
      </style>
      <div id="outerDiv" class$="[[_getStyle(status)]]">
        <div>
          <template is="dom-if" if="[[status.url]]">
            <a href="[[status.url]]" target="_blank">
              [[status.message]]
            </a>
          </template>
          <template is="dom-if" if="[[!status.url]]">
            [[status.username]]: [[status.message]]
          </template>
        </div>
      </div>
    `;
  }

  static get properties() {
    return {
      change: {
        type: Object,
      },
      config: {
        type: Object,
        value: null,
      },
      status: {
        type: Object,
        value: null,
      },
      tree: {
        type: Object,
        value: null,
      },
    };
  }

  _getStyle(status) {
    if (!status) {
      return 'hidden';
    }
    return status.generalState || 'unknown';
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.tree) {
      this.tree.clear();
    }
  }
}

customElements.define(TreeStatusView.is, TreeStatusView);
