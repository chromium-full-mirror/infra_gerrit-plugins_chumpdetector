/**
 * @license
 * Copyright 2022 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

import {css, html, LitElement} from 'lit';

import {customElement} from 'lit/decorators';

/**
 * Pointer from old tree status location to the new one.
 */
@customElement('tree-status-view-old')
export class TreeStatusViewOld extends LitElement {
  static override styles = css`
    #outerDiv {
      align-items: center;
      justify-content: space-between;
      display: flex;
      font-size: 1.1em;
      overflow-wrap: anywhere;
      margin: 5px 0 8px;
      padding: 0.4em;
      max-width: 20em;
      color: black;
      background-color: #ffe;
    }
  `;

  override render() {
    return html`<div id="outerDiv">
      See "Tree Status" under "Checks" &#128073;
    </div>`;
  }
}
