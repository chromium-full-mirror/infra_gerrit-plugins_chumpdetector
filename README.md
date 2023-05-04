# ChumpDetector Plugin for Gerrit

This plugin will allow developers to see the current status on their CLs. Status
will be pulled from a configurable location. The Chromium project has many
status sites such as:

*   http://blink-status.appspot.com
*   http://chromium-status.appspot.com
*   http://chromiumos-status.appspot.com
*   http://nativeclient-status.appspot.com

The plugin will show users the status and will warn them in certain situations
if they attempt to undertake actions that are contrary to the tree status.

The plugin does not provide enforcement - that is provided by other systems.

## Configuration

Before this plugin will work you'll need to configure it. You can do that by
adding a new file to `refs/meta/config` for a Gerrit project. The configuration
file should be called `chumpdetector.config` and should be of the form:

```
[project "some-interesting-project"]
    loginURL = https://login.appspot.com/?next=chromium-status
    viewURL = https://chromium-status.appspot.com/
    statusURL = https://chromium-status.appspot.com/current?format=json
    withCredentials = false
    enforceCommitQueue = false
    disabledBranchPattern = ^(refs/meta/config|.*)$
```

### Project name

The project name doesn't matter, it can be anything you'd like

### loginURL

If `withCredentials` is true and a request for status fails, the system assumes
that a login is required and has not occurred. In that case the status message
will change to "Login required. Click here to login." The text will be a link
that points to the value of `loginURL`. If `loginURL` is not set then the
message will just be `RequestError: Login required.` with no link.

### viewURL

This should be the URL to your status app. This is used to provide a link that
users can click on to take them to a new page that shows the full status.

### statusURL

This should be the URL to get a JSON blob of the current status. Usually this
will be related to the `viewURL` value. This is the URL that will be queried via
XHR periodically while the user is on the page to update the tree status.

### withCredentials

This is simply passed through to the underlying JavaScript XMLHttpRequest object
as the `withCredentials` parameter. You can read about it at
https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/withCredentials

### enforceCommitQueue

When true, this will show a modal warning to users if they try to submit the CL
directly and warn them to use the CQ. This is Chromium concept, unless you have
a Chromium-like CQ system. Just leave as false if you don't understand what any
of those things mean.

### disabledBranchPattern

> Anyone defining this property is strongly recommended to include
> `refs/meta/config` since we never enable the CQ on this branch.

CLs on branches that match this pattern will have the plugin disabled. This
means they won't see tree status and tree status won't effect the CL in any way.

The branch name comes from the
[Gerrit CL ChangeInfo](https://gerrit-review.googlesource.com/Documentation/rest-api-changes.html#change-info).
The `refs/heads/` prefix is omitted, but otherwise is the full name. Common
examples are `main` (in the case of `refs/heads/main`) and `refs/meta/config`.

The pattern syntax uses
[JavaScript Regular expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions)
with no flags. This means the match is case-sensitive, and you should use `^`
and `$` anchors to avoid accidental partial matches. For example, the pattern
`main` will match any branch name that has the substring `main` in it, not only
the `main` branch itself.

There is no need to quote the string. If quotes are used, they are automatically
stripped (outermost only). For example, `"^main$"` is turned into `^main$`.

### preloadImageURL

This setting causes the plugin to request a URL via an an image that is
dynamically added to the page before making any other fetch requests. This is
useful in situations where the request to the status URL will fail without
certain cookies being set for the status request domain. By using an image tag
the browser will correctly follow any redirects that a login process may require
in order to establish the session cookies.

Most installs will not need this configuration and can ignore it. For certain
sites this may allow them to get security cookies before attempting status
requests which will fail without the cookies.

### Inheritance

Repos with no `chumpdetector.config` will inherit it from the `inheritFrom` repo
in `project.config`. To disable the plugin for a repo, without breaking the inheritance,
create a `chumpdetector.config` for the repo with:

```
[project "some-interesting-project"]
    disabled = true
```

Make sure the project name matches the one in the parent repo's `chumpdetector.config`,
otherwise the plugin will not be disabled.


## Web Plugin Development

Run the commands below in web/.

For running TypeScript unit tests execute:

```
make test
```

For checking or fixing eslint formatter problems run:

```
make lint_test
make lint_fix
```

For testing the plugin with
[Gerrit FE Dev Helper](https://gerrit.googlesource.com/gerrit-fe-dev-helper/)
the command below builds the JavaScript bundle and copies it to the
`plugins/chumpdetector` folder:

```
make build
```

Start polygerit-ui server:

```
./polygerrit-ui/run-server.sh --plugins="plugins"
```

and let the Dev Helper redirect from
`.+/plugins/chumpdetector/static/chumpdetector.js` to
`http://localhost:8081/plugins/chumpdetector.js`.
