# Comments

Self hosted commenting system for blogs or other things.

* Self hosted.
* Backed by LevelDB.
* Support for multiple "namespaces".
* Realtime.
* No client side dependencies (except the one script ofc).

## Commenting System

What lead us here? My girlfriend wanted comments on her
[Ghost](https://github.com/TryGhost/Ghost) blog. Disqus and all the other
systems that I could find sucked. They require user login and other kinds of
crazy stuff.

So here it is. A self hosted, commenting system based on node.js and LevelDB.
You can use the same commenting server for several blogs/sites by namespacing
comments.

It works by adding a bit of JavaScript to your page, defining a div where you
want the comments to appear. That's it. For now see the html file in examples.

## Alpha stuff

This is a veeeeery early release of this thing. Use at own risk. Contribute for
honor and glory!

There's is currently **no security checks what so ever**. FYI.

## Config

* **cors**, array of domains that may use the server.

