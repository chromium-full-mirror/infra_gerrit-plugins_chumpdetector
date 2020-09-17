// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const STATUS_INTERVAL_MS = 60 * 1000;
const UNKNOWN_DATE = new Date(0);

const DISABLED_BRANCH_TREE_STATUS = {
  disabled: true,
  isOpen: true,
  generalState: 'unknown',
  message: 'No tree status for this branch.',
  username: 'Warning',
  date: UNKNOWN_DATE,
  url: null,
};

export class TreeStatus {
  constructor(restApi) {
    this.clear();
    this.restApi = restApi;
    this.updateInterval = window.setInterval(
      this._updateStatusOnElements.bind(this), STATUS_INTERVAL_MS);
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

  async register(element) {
    await this._ensureInitialized(element.change);
    element.tree = this;
    element.config = this.config;
    this.elements.push(element);
    this._updateStatusOnElements();
  }

  async _ensureInitialized(change) {
    if (!change || this.initialized) {
      return;
    }
    this.initialized = true;
    this.shouldFetchStatus = false;

    const configUrl =
      `/projects/${encodeURIComponent(change.project)}/chumpdetector~config`;
    this.config = await this.restApi().get(configUrl) || null;

    if (!this.config || !this.config.statusURL) {
      console.info('Chumpdetector is not configured.');
      return;
    }

    if (this.config.disabled) {
      console.info('Chumpdetector is disabled for this project.');
      return;
    }

    if (this.config.disabledBranchPattern &&
        new RegExp(this.config.disabledBranchPattern).test(change.branch)) {
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
    const setupTreeStatus = () => {
      this._updateStatusOnElements();
    }
    if (this.config.preloadImageURL) {
      const img = new Image();
      img.addEventListener("load", setupTreeStatus);
      img.addEventListener("error", setupTreeStatus);
      img.src = this.config.preloadImageURL;
    }

    this.shouldFetchStatus = true;
    return;
  }

  async _updateStatusOnElements() {
    if (!this.initialized || !this.shouldFetchStatus) {
      return;
    }
    await this._fetchStatus();
    this.elements.forEach(element => {
      element.status = Object.assign({}, this.status);
    });
  }

  async _fetchStatus() {
    // Launch async GET.
    const options = {};
    if (this.config.withCredentials) {
      options.credentials = 'include';
    }
    const response = await fetch(this.config.statusURL, options);
    const responseText = await response.text();
    console.info('Fetched', this.config.statusURL);

    if (response.status == 200) {
      try {
        const jsonResponse = JSON.parse(responseText);
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
        console.error('Error parsing json: ' + exception);
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
    };

    if (!this.config.withCredentials) {
      this.status.url = this.config.viewURL;
      this.status.message = (
        responseText ||
        'Error ' + response.status + ' requesting tree status');
    } else if (this.config.loginURL) {
      this.status.url = this.config.loginURL;
      this.status.message = 'Login required. Click here to login.';
    } else {
      this.status.url = null;
      this.status.message = 'Login required.';
      console.warn(
        `chumpdetector failed to request ${this.config.viewURL} and got ` +
        `status ${response.status}. You may want to add a loginURL to your ` +
        `chumpdetector configuration to give your users a link they can ` +
        `click on to take them to a logging page. See ` +
        `https://chromium.googlesource.com/infra/gerrit-plugins/chumpdetector/#loginurl.`);
    }
  }
}
