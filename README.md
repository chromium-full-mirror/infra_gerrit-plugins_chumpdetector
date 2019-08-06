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
  viewURL = https://chromium-status.appspot.com/
  statusURL = https://chromium-status.appspot.com/current?format=json
  withCredentials = false
  enforceCommitQueue = false
  disabledBranchPattern = ^(?:refs/meta/config|refs/heads/.*)$
```

### Project name

The project name doesn't matter, it can be anything you'd like

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

## To use with the local testsite

```
ln -s /path/to/chumpdetector-plugin plugins/chumpdetector
NO_BUCKD=1 buck build plugins/chumpdetector && \
  cp buck-out/gen/plugins/chumpdetector/chumpdetector.jar ../gerrit_testsite/plugins/ && \
  ../gerrit_testsite/bin/gerrit.sh restart
```

## To use with the polygerrit-ui server against live data

```
mkdir -p polygerrit-ui/app/plugins/chumpdetector
ln -s /path/to/chumpdetector-plugin/src/main/resources/static polygerrit-ui/app/plugins/chumpdetector/static
./polygerrit-ui/run-server.sh -host chromium-review.googlesource.com
```

You may also need to edit `chumpdetectorURL` to point directly at
`chromium-review.googlesource.com` instead of being relative.
