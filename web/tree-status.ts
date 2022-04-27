/**
 * @license
 * Copyright 2021 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

import {ChangeInfo} from '@gerritcodereview/typescript-api/rest-api';

import {RestPluginApi} from '@gerritcodereview/typescript-api/rest';

import {css, html, LitElement} from 'lit';

import {customElement, property} from 'lit/decorators';

import {Config} from './config';

const STATUS_INTERVAL_MS = 60 * 1000;
const UNKNOWN_DATE = new Date(0);

// TODO(crbug.com/664559): Replace with updated documentation.
const TREE_STATUS_DOC =
  'https://chromium.googlesource.com/chromium/src/+/95221dd/docs/sheriff.md#tree';

export declare interface TreeStatusComponents {
  tree: TreeStatus | null;
  status: Status | null;
  config: Config | null;
  change: ChangeInfo;
}

export declare interface Status {
  disabled: boolean;
  isOpen: boolean;
  generalState: string;
  message: string;
  username: string;
  date: Date;
  url: string | null;
}

declare interface StatusResponse {
  can_commit_freely: boolean;
  general_state: string;
  message: string;
  username: string;
  date: string;
}

const DISABLED_BRANCH_TREE_STATUS: Status = {
  disabled: true,
  isOpen: true,
  generalState: 'unknown',
  message: 'No tree status for this branch.',
  username: 'Warning',
  date: UNKNOWN_DATE,
  url: null,
};

export class TreeStatus {
  private readonly restApi: RestPluginApi;

  private readonly updateInterval: number;

  private config: Config | null = null;

  private elements: TreeStatusComponents[] = [];

  private initialized = false;

  private shouldFetchStatus = false;

  private status: Status | null = null;

  constructor(restApi: RestPluginApi) {
    this.clear();
    this.restApi = restApi;
    this.updateInterval = window.setInterval(
      this.updateStatusOnElements.bind(this),
      STATUS_INTERVAL_MS
    );
  }

  clear() {
    this.initialized = false;
    this.config = null;
    this.elements = [];
    this.status = null;
    this.shouldFetchStatus = false;
    if (this.updateInterval) {
      window.clearInterval(this.updateInterval);
    }
  }

  async register(element: TreeStatusComponents) {
    await this.ensureInitialized(element.change);
    element.tree = this;
    this.elements.push(element);
    await this.updateStatusOnElements();
  }

  private async ensureInitialized(change: ChangeInfo) {
    if (!change || this.initialized) {
      return;
    }
    this.initialized = true;
    this.shouldFetchStatus = false;

    const configUrl = `/projects/${encodeURIComponent(
      change.project
    )}/chumpdetector~config`;
    this.config = (await this.restApi.get(configUrl)) || null;

    if (!this.config || !this.config.statusURL) {
      console.info('Chumpdetector is not configured.');
      return;
    }

    if (this.config.disabled) {
      console.info('Chumpdetector is disabled for this project.');
      return;
    }

    if (
      this.config.disabledBranchPattern &&
      new RegExp(this.config.disabledBranchPattern).test(change.branch)
    ) {
      console.info('Disabling Chumpdetector based on branch name.');
      this.status = DISABLED_BRANCH_TREE_STATUS;
      return;
    }

    console.info(`Chumpdetector using status url: ${this.config.statusURL}`);

    // If the configuration specifies loading an image URL first then
    // request the image. Whether it succeeds or fails immediately
    // move into setting up the tree status request. This allows users
    // the opportunity to use the image load to establish cookies the
    // browser may need in order to make the status request which can
    // work even without the image request succeeding.
    const setupTreeStatus = async () => {
      await this.updateStatusOnElements();
    };
    if (this.config.preloadImageURL) {
      const img = new Image();
      img.addEventListener('load', setupTreeStatus);
      img.addEventListener('error', setupTreeStatus);
      img.src = this.config.preloadImageURL;
    }

    this.shouldFetchStatus = true;
    return;
  }

  private async updateStatusOnElements() {
    if (!this.initialized || !this.shouldFetchStatus) {
      return;
    }
    await this.fetchStatus();
    for (const element of this.elements) {
      element.status = this.status;
      element.config = this.config;
    }
  }

  private async fetchStatus() {
    if (this.config === null) {
      return;
    }
    // Launch async GET.
    const options: {[k: string]: string} = {};
    if (this.config.withCredentials) {
      options['credentials'] = 'include';
    }
    const response = await fetch(this.config.statusURL, options);
    const responseText = await response.text();
    console.info('Fetched', this.config.statusURL);

    if (response.status === 200) {
      try {
        const jsonResponse = JSON.parse(responseText) as StatusResponse;
        this.status = {
          disabled: false,
          isOpen: jsonResponse.can_commit_freely,
          generalState: jsonResponse.general_state,
          message: jsonResponse.message,
          username: jsonResponse.username,
          date: new Date(jsonResponse.date.replace(' ', 'T')),
          url: this.config.viewURL,
        };
      } catch (exception) {
        console.error(`Error parsing json: ${exception}`);
        this.status = {
          disabled: false,
          isOpen: false,
          generalState: 'unknown',
          message: String(exception),
          username: 'ParseError',
          date: UNKNOWN_DATE,
          url: this.config.viewURL,
        };
      }
      return;
    }

    this.status = {
      disabled: false,
      isOpen: false,
      generalState: 'unknown',
      username: 'RequestError',
      date: UNKNOWN_DATE,
      message: 'Login required.',
      url: null,
    };

    if (!this.config.withCredentials) {
      this.status.url = this.config.viewURL;
      this.status.message =
        responseText || `Error ${response.status} requesting tree status`;
    } else if (this.config.loginURL) {
      this.status.url = this.config.loginURL;
      this.status.message = 'Login required. Click here to login.';
    } else {
      console.warn(
        `chumpdetector failed to request ${this.config.viewURL} and got ` +
          `status ${response.status}. You may want to add a loginURL to your ` +
          'chumpdetector configuration to give your users a link they can ' +
          'click on to take them to a logging page. See ' +
          'https://chromium.googlesource.com/infra/gerrit-plugins/chumpdetector/#loginurl.'
      );
    }
  }
}

/**
 * Tree status UI for some single change.
 */
@customElement('tree-status-view')
export class TreeStatusView extends LitElement {
  @property()
  change!: ChangeInfo;

  @property()
  status: Status | null = null;

  @property()
  config: Config | null = null;

  @property()
  tree: TreeStatus | null = null;

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
    }
    #outerDiv.unknown {
      color: black;
      background-color: #fffc6c;
    }
    #outerDiv.open {
      color: black;
      background-color: #bce889;
    }
    #outerDiv.closed {
      color: white;
      background-color: #e98080;
    }
    #outerDiv.hidden {
      display: none;
    }
  `;

  override render() {
    if (!this.status) {
      return;
    }
    return html`<div id="outerDiv" class="${this.getStyle()}">
      <div>
        ${this.status.url
          ? html`<a href="${this.status.url}" target="_blank">
              ${this.status.message}
            </a>`
          : html`${this.status.username}: ${this.status.message}`}
      </div>
      <a href="${TREE_STATUS_DOC}" target="_blank">
        <iron-icon icon="gr-icons:help-outline" style="color:var(--gray-800)">
        </iron-icon>
      </a>
    </div>`;
  }

  private getStyle() {
    if (!this.status) {
      return 'hidden';
    }
    return this.status.generalState || 'unknown';
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this.tree) {
      this.tree.clear();
    }
  }
}
