# ChumpDetector Plugin for Gerrit

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
