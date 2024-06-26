/**
 * @license
 * Copyright 2021 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

import {ChangeId, ChangeInfo} from '@gerritcodereview/typescript-api/rest-api';

import {RestPluginApi} from '@gerritcodereview/typescript-api/rest';

import {css, html, LitElement} from 'lit';

import {customElement, property} from 'lit/decorators';

import {Config} from './config';
import {AuthorizationHeader, getAuthorizationHeader} from './auth';

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
  generalState: string;
  message: string;
  createUser: string;
  createTime: string;
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

    if (!this.config) {
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

    if (!this.config.statusURL && !this.config.treeId) {
      console.info('Using chumpdetector without status url or tree id.');
      return;
    }

    if (this.config.treeId) {
      console.info(`Chumpdetector using tree id: ${this.config.treeId}`);
    } else {
      console.info(`Chumpdetector using status url: ${this.config.statusURL}`);
    }

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
    if (
      !this.initialized ||
      !this.shouldFetchStatus ||
      this.elements.length === 0
    ) {
      return;
    }

    await this.fetchStatus(this.elements[0].change.change_id);
    for (const element of this.elements) {
      element.status = this.status;
      element.config = this.config;
    }
  }

  private async fetchStatus(changeId: ChangeId) {
    if (this.config === null) {
      return;
    }
    // Launch async GET.
    const authorizationHeaders = await this.getAuthorizationHeader(changeId);
    const treeId =
      this.config.treeId ||
      this.config.statusURL
        ?.replace(/^https?:\/\//, '')
        ?.replace(/\.appspot\.com.*$/, '')
        ?.replace(/-status$/, '')
        ?.toLocaleLowerCase();
    const options: RequestInit = {
      method: 'POST',
      body: JSON.stringify({name: `trees/${treeId}/status/latest`}),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...authorizationHeaders,
      },
    };
    const response = await fetch(
      'https://luci-tree-status.appspot.com/prpc/luci.tree_status.v1.TreeStatus/GetStatus',
      options
    );
    const responseText = (await response.text()).replace(/^\)\]\}'/, '');
    console.info('Fetched', this.config.statusURL);

    if (response.status === 200) {
      try {
        const jsonResponse = JSON.parse(responseText) as StatusResponse;
        this.status = {
          disabled: false,
          isOpen: jsonResponse.generalState === 'OPEN',
          generalState: jsonResponse.generalState.toLowerCase(),
          message: jsonResponse.message,
          username: jsonResponse.createUser,
          date: new Date(jsonResponse.createTime),
          url: `https://ci.chromium.org/ui/labs/tree-status/${treeId}`,
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
          url: `https://ci.chromium.org/ui/labs/tree-status/${treeId}`,
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
      message:
        responseText || `Error ${response.status} requesting tree status`,
      url: null,
    };
  }

  /**
   * Mockable equivalent of getAuthorizationHeader.
   *
   * @returns authorization header to use in requests.
   */
  getAuthorizationHeader(changeId: ChangeId): Promise<AuthorizationHeader> {
    return getAuthorizationHeader(changeId);
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
    #main {
      margin-left: var(--spacing-s);
      max-width: 40em;
      display: flex;
    }

    #key {
      line-height: var(--line-height-small);
      color: var(--deemphasized-text-color);
      padding: var(--spacing-xs) var(--spacing-s) var(--spacing-xs)
        var(--spacing-s);
      white-space: nowrap;
    }

    #value {
      line-height: var(--line-height-small);
      font-size: var(--font-size-small);
      border-radius: 12px;
      padding: var(--spacing-xs) var(--spacing-s) var(--spacing-xs)
        var(--spacing-s);
      width: fit-content;
      word-break: break-word;
    }

    #value a {
      display: block;
      color: var(--chip-color);
      text-decoration: none;
    }

    #value.unknown {
      background-color: var(--gray-background);
      border: 1px solid var(--gray-foreground);
    }
    #value.open {
      background-color: var(--success-background);
      border: 1px solid var(--success-foreground);
    }
    #value.closed {
      background-color: var(--error-background);
      border: 1px solid var(--error-foreground);
    }
    #value.throttled {
      background-color: var(--warning-background);
      border: 1px solid var(--warning-foreground);
    }

    gr-icon {
      font-size: var(--line-height-small);
    }
    #value.open gr-icon {
      color: var(--success-foreground);
    }
    #value.closed gr-icon {
      color: var(--error-foreground);
    }
    #value.throttled gr-icon {
      color: var(--warning-foreground);
    }
    #value.unknown gr-icon {
      color: var(--gray-foreground);
    }
  `;

  override render() {
    if (!this.status) {
      return;
    }
    const cls = this.getClass();
    return html`<div id="main">
      <div id="key">Tree Status
        <a href="${TREE_STATUS_DOC}" target="_blank">
          <gr-icon icon="help_outline"></gr-icon>
        </a>
      </div>
      <div id="value" class="${cls}">
        <a>${
          this.status.url
            ? html`<a href="${this.status.url}" target="_blank">
                <gr-icon
                  icon="${cls === 'open' ? 'check_circle' : 'error'}"
                ></gr-icon>
                ${this.status.message}
              </a>`
            : html`${this.status.username}: ${this.status.message}`
        }
      </div>
    </div>`;
  }

  private getClass() {
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
