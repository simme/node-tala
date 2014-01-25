# Tala

Self hosted commenting system for blogs or other things.

* Self hosted.
* Backed by LevelDB.
* Support for multiple "namespaces".
* Realtime.
* No client side dependencies (except the one script ofc).

## About

_Tala_ is a self hosted comments platform for your static blog or whatever.

It's written in [Node](http://nodejs.org) and it uses [LevelDB](https://code.google.com/p/leveldb/)
as it's database.

There's also a WebSocket component that'll make comments appear in real time
for everyone currently on the page.

## Installation

There's is currently no executable or anything. So the easiest way for now is
probably to clone the repo using git (or just downloding a tarball):

`$ git clone git@github.com:simme/node-tala.git tala`
`$ cd tala`
`$ npm install`
`$ npm start`

By default the server will listen on port `3000`

## Server Configuration

You configure _Tala_ by adding a `config.json` file to the same directory as
`tala.js`. In the future there'll be a possibility to change the path to the
configuration file.

The config may include the following keys:

* **port**, what port to run the HTTP server on.
* **db**, path to where the database will be stored.
* **cors**, array of domains that may use the server. Used to allow AJAX
requests from the browser.
* **spam**, an object containing `apiKey` and `blog`. `apiKey` is your Akismet
api key. More on [spam](#spam) below.

## Spam

_Tala_ currently uses Akismet to provide spam protection. This requires you
to set up an account at akismet.com. There are free accounts available for
those who have less then 80 000 comments per month.

You may choose to omit the `spam` key from your config in which case no spam
protection will be done at all.

## Client Installation

To add _Tala_ to your blog you need to include the client code. This is best
done by adding this code to the bottom of your `<body>`.

```html
<script type="text/javascript">
  function downloadJSAtOnload() {
    var element = document.createElement("script");
    element.src = "http://localhost:3000/js";
    document.body.appendChild(element);
  }

  if (window.addEventListener)
    window.addEventListener("load", downloadJSAtOnload, false);
  else if (window.attachEvent)
    window.attachEvent("onload", downloadJSAtOnload);
  else
    window.onload = downloadJSAtOnload;
</script>
```

_Remember to change the `element.src` line to point to your Tala server._

What this will do is to wait for the document ready event before loading
the comments. For more about this particular techinque you can read this
[blog post](http://www.feedthebot.com/pagespeed/defer-loading-javascript.html)
by Patrick Sexton.

You can of course just use a regular script tag and a `src`-attribute if you
want to. But that will cause the loading of _Tala_ to delay the loading of your
page. Since your comments probably are below the fold it's probably not super
smart to make your visitors wait!

Then you'll need to tell _Tala_ where to put your comments. This is done by
adding an element, probably a `div` with the class `comments-wrapper`. You'll
also need to give this element the attribute `data-id`. This is used to
separate comments for different articles. The value can be anything but it's
probably smartest to go with the slug of the article or something similar.

```html
<div class="comments-wrapper" data-id="myBlog:/an/article/url"></div>
```

Read on for details on how to configure the client.

## Client Configuration

_Tala_ uses a global (sorry) object to read your preferences. So what you do
is you add another `<script>` tag to your page:

```html
<script>
  window.talaConfig = {
    // settings go here
  };
</script>
```

These options are mostly used for localization. The available optionas are:

* **host**, if your _Tala_ server is on any other domain then your blog you
need to enter the host here. Make sure you include your blog's domain in the
__cors__ option for the server.
* **nameField**, the label for the name field in the form.
* **nameFieldPlaceholder**, the placeholder for the name field in the form.
* **emailField**, the label for the email field.
* **emailFieldPlaceholder**, the placeholder for the email field.
* **submitButton**, the text on the comment submit button.
* **commentPostError**, text output on posting error.
* **loadError**, text output on comment loading error.

_More options and configurability will come with age!_

## FAQ

* **Where does the name come from?**

_Tala_ means "to talk" in Swedish.

* **Can I use one _Tala_ server for many blogs?**

_YES_ you can. All you need to to is to namespace your `data-id` attributes so
that _Tala_ can keep your comments separated.

* **May I contribute?**

Hellz yeah! Just open a pull request for any fix/feature you want and we'll
talk about it! ;)

## License

This project is licensed under the MIT license.

