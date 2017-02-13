// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

Gerrit.install(function(self) {


/**
 * Milliseconds between tree status checks.
 */
var STATUS_INTERVAL_MS = 60 * 1000;


/**
 * Date used in status if real one can't be fetched.
 */
var UNKNOWN_DATE = new Date(0);


/**
 * Gerrit JSON response prefix.
 */
var JSON_PREFIX = ')]}\'';


/**
 * Placeholder status when actual one is unknown yet.
 */
var UNKNOWN_TREE_STATUS = {
  isOpen: false,
  generalState: 'unknown',
  message: 'Tree status unknown.',
  username: 'Pending',
  date: UNKNOWN_DATE,
  url: null
};


/**
 * Placeholder status when we're waiting for an answer.
 */
var PENDING_TREE_STATUS = {
  isOpen: false,
  generalState: 'unknown',
  message: 'Waiting for tree status...',
  username: 'Pending',
  date: UNKNOWN_DATE,
  url: null
};


/**
 * Placeholder status when the current branch is not the trunk.
 */
var DISABLED_BRANCH_TREE_STATUS = {
  isOpen: true,
  generalState: 'unknown',
  message: 'No tree status for this branch.',
  username: 'Warning',
  date: UNKNOWN_DATE,
  url: null
};


// Register CSS classes only once, during plugin loading.
var STYLES = {
  // Base style for div that contains tree status box.
  outerDiv: Gerrit.css(
    'align-items: center;' +
    'display: flex;' +
    'font-size: 1.1em;' +
    'justify-content: center;' +
    'margin: 5px 0 8px;' +
    'padding: .4em;'),

  // Additional styles for PolyGerrit UI.
  outerDivPolyGerrit: Gerrit.css('max-width: 20em;'),

  // Tree status is not yet known.
  unknownStatus: Gerrit.css(
    'color: black;' +
    'background-color: #FFFC6C;'),

  // Tree is open.
  openStatus: Gerrit.css(
    'color: black;' +
    'background-color: #BCE889;'),

  // Tree is closed.
  closedStatus: Gerrit.css(
    'color: white;' +
    'background-color: #E98080;')
};


/**
 * Tree status UI for some single change.
 * @param {Object} change Change object provided by Gerrit
 * @param {Object} config Project config this change belongs to
 */
var TreeStatus = function(change, config) {
  this.change = change;
  this.config = config;
  this.treeStatus = null;

  this.fetcher = null;
  this.fetcherCallback = null;
  this.installed = false;

  // Build DOM for tree status UI.
  this.outerDiv = document.createElement('div');
  this.outerDiv.classList.add(STYLES.outerDiv);
  if (window.Polymer) {
    this.outerDiv.classList.add(STYLES.outerDivPolyGerrit);
  }
  this.innerDiv = document.createElement('div');
  this.outerDiv.appendChild(this.innerDiv);

  // Set default state to 'Unknown'.
  this.setTreeStatus(UNKNOWN_TREE_STATUS);
};


/**
 * Add DOM elements to the document, subscribe to status fetcher notifications.
 * @param {Object} fetcher StatusFetcher object that fetches tree status
 */
TreeStatus.prototype.install = function(fetcher) {
  if (!this.installed) {
    console.log('Installing tree status for change:', this.change.id);
    document.getElementById('change_plugins').appendChild(this.outerDiv);
    this.fetcher = fetcher;
    if (this.fetcher) {
      this.fetcherCallback = this.setTreeStatus.bind(this);
      this.fetcher.subscribe(this.fetcherCallback);
    }
    this.installed = true;
  }
};


/**
 * Remove DOM elements from the document, unsubscribe from status fetcher.
 */
TreeStatus.prototype.uninstall = function() {
  if (this.installed) {
    console.log('Uninstalling tree status for change:', this.change.id);
    if (this.fetcher) {
      this.fetcher.unsubscribe(this.fetcherCallback);
      this.fetcher = null;
      this.fetcherCallback = null;
    }
    if (this.outerDiv.parentNode)
      this.outerDiv.parentNode.removeChild(this.outerDiv);
    this.installed = false;
  }
};


/**
 * Update DOM to display given tree status.
 * @param {Object} treeStatus Tree status object produced by StatusFetcher
 */
TreeStatus.prototype.setTreeStatus = function(treeStatus) {
  this.treeStatus = treeStatus;

  // Update content.
  if (!treeStatus.url) {
    this.innerDiv.textContent = treeStatus.username + ': ' + treeStatus.message;
  } else {
    // Create <a></a>.
    var anchor = document.createElement('a');
    anchor.href = treeStatus.url;
    anchor.target = '_blank';
    anchor.innerText = treeStatus.message;
    // Replace whatever in innerDiv with that link.
    this.innerDiv.textContent = '';
    this.innerDiv.appendChild(anchor);
  }

  // Update CSS style.
  var styleName = (treeStatus.generalState || 'unknown') + 'Status';
  var cssClass = STYLES[styleName] || STYLES.unknownStatus;
  this.outerDiv.className = STYLES.outerDiv + ' ' + cssClass;
  if (window.Polymer) {
    this.outerDiv.classList.add(STYLES.outerDivPolyGerrit);
  }
};


/**
 * Periodically fetches tree status for some project.
 * @param {string} viewURL URL to link to normally for users to navigate to
 * @param {string} statusURL URL to fetch status from
 * @param {boolean} withCredentials True to send cookies with the request
 * @param {string} loginURL URL to use for login (if required)
 */
var StatusFetcher = function(viewURL, statusURL, withCredentials, loginURL) {
  this.viewURL = viewURL;
  this.statusURL = statusURL;
  this.withCredentials = withCredentials;
  this.loginURL = loginURL;
  this.lastKnownStatus = PENDING_TREE_STATUS;

  this.callbacks = [];
  this.request = null;
  this.timer = null;
};


/**
 * Register callback to be called when tree status is fetched.
 * @param {Function} callback Will be called with single treeStatus argument
 */
StatusFetcher.prototype.subscribe = function(callback) {
  this.callbacks.push(callback);
};


/**
 * Removes previously registered callback.
 * @param {Function} callback Exact same function object that was registered
 */
StatusFetcher.prototype.unsubscribe = function(callback) {
  var index = this.callbacks.indexOf(callback);
  if (index != -1) {
    this.callbacks.splice(index, 1);
  }
};


/**
 * Asynchronously fetches (or refetches) tree status and calls callbacks.
 */
StatusFetcher.prototype.fetch = function() {
  // Already fetching?
  if (this.request)
    return;

  // Fetch restarts refetch timer (by launching it again when request finishes).
  if (this.timer) {
    clearTimeout(this.timer);
    this.timer = null;
  }

  // Launch async GET.
  this.lastKnownStatus = PENDING_TREE_STATUS;
  this.request = new XMLHttpRequest();

  var that = this;
  this.request.onreadystatechange = function() {
    if (this.readyState == 4) {
      console.log('Fetched', that.statusURL);
      that.request = null;
      that.onFetchCompleted.call(that, this);
    }
  };

  this.request.open('GET', this.statusURL);
  this.request.withCredentials = this.withCredentials;
  this.request.send();
};


/**
 * Called when HTTP request finishes (successfully or not).
 * @param {Object} request Completed XMLHttpRequest object.
 */
StatusFetcher.prototype.onFetchCompleted = function(request) {
  var treeStatus;
  if (request.status == 200) {
    try {
      var result = JSON.parse(request.responseText);
      treeStatus = {
        isOpen: result.can_commit_freely,
        generalState: result.general_state,
        message: result.message,
        username: result.username,
        date: new Date(result.date.replace(' ', 'T')),
        url: this.viewURL
      };
    } catch (ex) {
      console.log('Error parsing json: ' + ex);
      treeStatus = {
        isOpen: false,
        generalState: 'unknown',
        message: String(ex),
        username: 'ParseError',
        date: UNKNOWN_DATE,
        url: this.viewURL
      };
    }
  } else {
    var message;
    if (this.withCredentials) {
      url = this.loginURL;
      message = 'Login required';
    } else {
      url = this.viewURL;
      message = (request.statusText ||
                 'Error ' + request.status + ' requesting tree status');
    }
    treeStatus = {
      isOpen: false,
      generalState: 'unknown',
      message: message,
      username: 'RequestError',
      date: UNKNOWN_DATE,
      url: url
    };
  }

  // Remember this status until next refetch cycle.
  this.lastKnownStatus = treeStatus;

  // Iterate over a copy. Callbacks may modify the list during iteration.
  var copy = this.callbacks.slice(0);
  for (var i = 0; i < copy.length; i++) {
    copy[i](treeStatus);
  }

  // Auto refetch status later (if still have subscribers).
  var that = this;
  this.timer = setTimeout(function() {
    that.timer = null;
    // Known status is too old. Better to forget it.
    that.lastKnownStatus = PENDING_TREE_STATUS;
    if (that.callbacks.length) {
      that.fetch();
    }
  }, STATUS_INTERVAL_MS);
};



// Cache of StatusFetchers. Config's treeName -> StatusFetcher.
var fetchers = {};
// TreeStatus object that correspond to current change.
var installedTreeStatus = null;

// Fetches JSON from URL, returns Promise.
function fetchJSON(url) {
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onload = function() {
      var result = null;
      if (this.status === 204) {
        resolve(null);
      } else if (this.status >= 200 && this.status < 300) {
        try {
          result = JSON.parse(xhr.response.substring(JSON_PREFIX.length));
          resolve(result);
        } catch (_) {
          reject("Unable to parse JSON");
        }
      } else {
        reject("Got non-200 response");
      }
    };
    xhr.onerror = function() {
      reject("Unhandled error");
    };
    xhr.send();
  });
}

/**
 * Returns configuration for a tree status (status URL to use, login URL, etc.)
 * @param {string} project Gerrit project name to search config for
 * @return {Promise} Promise, resolving to project config.
 */
function getProjectConfig(project) {
  /*
  Expected format of a project config:
  {
    treeName: English label to describe the project, eg: 'Chrome'.
    viewURL: URL to the user facing status, eg: 'http://foo/'
    statusURL: URL to the tree status, eg: 'http://foo/current?format=json'
    withCredentials: True if status requests require HTTP cookies.
    disabledBranchPattern: Regex object or string pattern to exclude a branch,
    enforceCommitQueue: True if project is using Commit Queue
  }
  */
  // If we've fetched it already, use the config set on the window.
  var config = window.chumpDetectorConfig;
  if (config !== undefined) {
    return Promise.resolve(config);
  }

  // Otherwise, fetch it and store it for reuse.
  var chumpdetectorURL = '/projects/' + encodeURIComponent(project) +
      '/chumpdetector~config';
  return fetchJSON(chumpdetectorURL).then(function(cfg) {
    window.chumpDetectorConfig = cfg || null;
    if (!window.chumpDetectorConfig) {
      console.log('Chump detector is not configured.');
      return null;
    }
    return getProjectConfig(project);
  });
}


/**
 * Creates a new one or returns existing StatusFetcher object.
 * @param {Object} config Project configuration as returned by getProjectConfig
 * @return {Object} StatusFetcher object
 */
function getStatusFetcher(config) {
  if (!fetchers.hasOwnProperty(config.treeName)) {
    fetchers[config.treeName] = new StatusFetcher(config.viewURL,
                                                  config.statusURL,
                                                  config.withCredentials,
                                                  config.loginURL);
  }
  return fetchers[config.treeName];
}


/**
 * Called by Gerrit when change screen is shown.
 * @param {Object} change Object with change details
 * @param {Object} revision Object with revision details
 */
self.on('showchange', function(change, revision) {
  // Uninstall previous one (if any).
  if (installedTreeStatus) {
    installedTreeStatus.uninstall();
    installedTreeStatus = null;
  }

  getProjectConfig(change.project).then(function(config) {
    if (!config || !config.statusURL) {
      console.log('No status url for this project.');
      return;
    } else if (config.disabled) {
      console.log('Chumpdetector is disabled for this project.');
      return;
    }
    // Install new one if the project is supported.
    var fetcher;
    if (config.disabledBranchPattern &&
        new RegExp(config.disabledBranchPattern).test(change.branch)) {
      console.log('Disabling chump detector based on branch name.');
      fetcher = null;
    } else {
      console.log('Using status url: ' + config.statusURL);
      fetcher = getStatusFetcher(config);
    }

    // Bind tree status to status fetcher, perform initial fetch.
    installedTreeStatus = new TreeStatus(change, config);
    installedTreeStatus.install(fetcher);
    if (fetcher) {
      installedTreeStatus.setTreeStatus(fetcher.lastKnownStatus);
      fetcher.fetch();
    } else {
      installedTreeStatus.setTreeStatus(DISABLED_BRANCH_TREE_STATUS);
    }
  }, function() {
    console.log('Error fetching config.');
  });
});


/**
 * Called by Gerrit whenever document.location changes.
 * @param {string} token Fragment part of a page URL
 */
self.on('history', function(token) {
  // Navigated away from a change page? Uninstall tree status UI.
  if (token.substring(0, 2) != '/c' && installedTreeStatus) {
    installedTreeStatus.uninstall();
    installedTreeStatus = null;
  }
});


/**
 * Called by Gerrit whenever 'Submit' is clicked.
 * @return {boolean} False to block submit
 */
self.on('submitchange', function() {
  // Change is in unsupported project, do not block it.
  if (!installedTreeStatus)
    return true;

  var treeStatus = installedTreeStatus.treeStatus;
  var config = installedTreeStatus.config;

  // Change is in unsupported branch, do not block it.
  if (treeStatus == DISABLED_BRANCH_TREE_STATUS)
    return true;

  // Change should be submitted via CQ (not directly via Gerrit).
  if (config.enforceCommitQueue) {
    return window.confirm(
        'The ' + config.treeName + ' project uses the commit queue (CQ). ' +
        'You should submit your change by clicking "Reply" and setting the ' +
        '"Commit-Queue" label to the appropriate value.\n' +
        'Do you want to commit the change directly, bypassing CQ (dangerous)?');
  }

  // Tree is open, do not block the change.
  if (treeStatus.isOpen)
    return true;

  // Unknown tree state. Double check with the user before submitting.
  if (treeStatus.generalState == 'unknown') {
    return window.confirm(
        config.treeName + ' tree status is unknown, submitting this ' +
        'change now might be dangerous.  Submit anyway?');
  }

  // Tree is closed (or in some entirely unexpected state). Warn the user.
  return window.confirm(
      'The ' + config.treeName + ' tree is closed, submitting this ' +
      'change is dangerous.  Submit anyway?');
});


});
