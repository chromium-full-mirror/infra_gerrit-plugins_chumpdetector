# ChumpDetector Plugin for Gerrit

This plugin will allow developers to see the current status on their CLs.
Status will be pulled from a configurable location. The Chromium project
has many status sites such as:

 * http://blink-status.appspot.com
 * http://chromium-status.appspot.com
 * http://chromiumos-status.appspot.com
 * http://nativeclient-status.appspot.com

The plugin will show users the status and will warn them in certain situations
if they attempt to undertake actions that are contrary to the tree status.

The plugin does not provide enforcement - that is provided by other systems.

## Configuration

Before this plugin will work you'll need to configure it. You can do that
by adding a new file to `refs/meta/config` for a Gerrit project. The
configuration file should be called `chumpdetector.config` and should
be of the form:

```
[project "some-interesting-project"]
  loginURL = https://login.appspot.com/?next=chromium-status
  viewURL = https://chromium-status.appspot.com/
  statusURL = https://chromium-status.appspot.com/current?format=json
  withCredentials = false
  enforceCommitQueue = false
  disabledBranchPattern = ^(?:refs/meta/config|refs/heads/.*)$
```

### Project name

The project name doesn't matter, it can be anything you'd like

### loginURL

If `withCredentials` is true and a request for status fails, the system
assumes that a login is required and has not occurred. In that case the status
message will change to "Login required. Click here to login." The text will be
a link that points to the value of `loginURL`.  If `loginURL` is not set then
the message will just be `RequestError: Login required.` with no link.

### viewURL

This should be the URL to your status app. This is used to provide a link
that users can click on to take them to a new page that shows the full
status.

### statusURL

This should be the URL to get a JSON blob of the current status. Usually
this will be related to the `viewURL` value. This is the URL that will be
queried via XHR periodically while the user is on the page to update the
tree status.

### withCredentials

This is simply passed through to the underlying JavaScript XMLHttpRequest
object as the `withCredentials` parameter. You can read about it at
https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/withCredentials

### enforceCommitQueue

When true, this will show a modal warning to users if they try to submit the
CL directly and warn them to use the CQ. This is Chromium concept, unless
you have a Chromium-like CQ system. Just leave as false if you don't
understand what any of those things mean.

### disabledBranchPattern

CLs on branches that match this pattern will have the plugin disabled. This
means they won't see tree status and tree status won't effect the CL in any
way.

### preloadImageURL

This setting causes the plugin to request a URL via an an image that is
dynamically added to the page before making any other fetch requests.
This is useful in situations where the request to the status URL will fail
without certain cookies being set for the status request domain.
By using an image tag the browser will correctly follow any redirects that a
login process may require in order to establish the session cookies.

Most installs will not need this configuration and can ignore it. For certain
sites this may allow them to get security cookies before attempting status
requests which will fail without the cookies.

## To use with the local testsite

```
cd ~/gerrit
ln -s ~/chumpdetector ~/gerrit/plugins
bazel build //plugins/chumpdetector
cp -f ~/gerrit/bazel-bin/plugins/chumpdetector/chumpdetector.jar ~/gerrit_testsite/plugins/
bazel build gerrit
java -jar ~/gerrit/bazel-bin/gerrit.war init --batch --dev -d ~/gerrit_testsite
~/gerrit_testsite/bin/gerrit.sh start
```

When you make changes to chumpdetector

```
bazel build //plugins/chumpdetector
cp -f ~/gerrit/bazel-bin/plugins/chumpdetector/chumpdetector.jar ~/gerrit_testsite/plugins/
~/gerrit_testsite/bin/gerrit.sh restart
```

## To use with the polygerrit-ui server against live data

```
mkdir -p polygerrit-ui/app/plugins/chumpdetector
ln -s /path/to/chumpdetector-plugin/src/main/resources/static polygerrit-ui/app/plugins/chumpdetector/static
./polygerrit-ui/run-server.sh -host chromium-review.googlesource.com
```

You may also need to edit `chumpdetectorURL` to point directly at
`chromium-review.googlesource.com` instead of being relative.
