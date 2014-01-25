//
// # Client Comments
//
// Renders the comment form and handles posting/fetching etc.
//
(function () {
  'use strict';
  var d = document;

  var Tala = function () {
    this.element = null;
    this.config  = window.talaConfig     || {};
    this.store   = window.localStorage   || false;

    // Socket related state
    this.retries = 0;
    this.nextTry = 1000;

    // DOM elements
    this.dom = {};

    this.init();
  };

  //
  // ## Init
  //
  // Find placeholder element and start loading comments.
  //
  // @TODO: Validate data-id exists
  //
  Tala.prototype.init = function init() {
    this.element = d.querySelector('.comments-wrapper');
    if (!this.element) {
      if (console && console.log) console.log('No comment wrapper found. Aborting.');
      return;
    }

    var resource = this.element.getAttribute('data-id');
    if (!resource) {
      if (console && console.log) console.log('Comment wrapper missing data-id attribute. Aborting.');
      return;
    }

    this.insertForm();
    this.loadComments(resource);
    this.setupSocket(resource);
  };

  //
  // ## Insert Form
  //
  // Generate the form.
  //
  Tala.prototype.insertForm = function insertForm() {
    var form = createElement('form', {
      action: this.conf('host', '') + '/comment',
      class: 'comments-form'
    });

    var credentials = this.getCredentials();
    var fields = [
      {
        label:this.conf('nameField', 'Name'),
        attributes: {
          name: 'username',
          type: 'text',
          placeholder:this.conf('nameFieldPlaceholder', this.conf('nameField', '')),
          value: credentials.username
        }
      },
      {
        label:this.conf('emailField', 'Email'),
        attributes: {
          name: 'email',
          type: 'email',
          placeholder:this.conf('emailFieldPlaceholder', this.conf('emailField', '')),
          value: credentials.email
        }
      },
    ];

    for (var i in fields) {
      var fieldset = createElement('fieldset');
      var label = createElement('label', {}, fields[i].label);
      var field = createElement('input', fields[i].attributes);
      fieldset.appendChild(label);
      fieldset.appendChild(field);
      form.appendChild(fieldset);
    }

    var comment = createElement('textarea', { 'name': 'comment' });
    form.appendChild(comment);

    var hidden = createElement('input', {
      name: 'resource',
      type: 'hidden',
      value: this.element.getAttribute('data-id')
    });
    form.appendChild(hidden);

    var submit = createElement('input', {
      type: 'submit',
      value:this.conf('submitButton', 'Post Comment')
    });
    form.appendChild(submit);

    this.element.appendChild(form);
    var self = this;
    listen(form, 'submit', function (event) {
      self.postComment(event, this);
    });
  };

  //
  // ## Post Comment
  //
  // @TODO: Validate email.
  //
  Tala.prototype.postComment = function postComment(event, form) {
    event.preventDefault();

    // @TODO: make this prettier
    var fields = ['username', 'email', 'comment', 'resource'];
    var username = '';
    var email = '';
    var data = [];
    for (var i in fields) {
      var key = fields[i];
      var val = form.querySelector('[name="' + key + '"]').value;
      data.push([key, val].map(encodeURIComponent).join('='));

      if (key === 'username') username = val;
      if (key === 'email') email = val;
    }

    var self = this;
    ajax(form.getAttribute('action'), 'POST', data.join('&'), function (err, res) {
      var ta = form.querySelector('textarea');
      if (!err) {
        ta.value = '';
      }
      else {
        var error = createElement('p', {
          class: 'comment-error'
        }, self.conf('commentPostError', 'Failed to post comment'));
        form.insertBefore(error, ta);
      }
    });

    this.saveCredentials(username, email);

    return false;
  };

  //
  // ## Load Comments
  //
  Tala.prototype.loadComments = function loadComments(resource) {
    var list = createElement('ol', { class: 'comments' });
    this.element.appendChild(list);

    if (this.dom.loadError) {
      this.element.removeChild(this.dom.loadError);
    }

    var self = this;
    ajax(this.conf('host', '') + '/comments/' + resource, 'GET', function (err, res) {
      if (err) {
        var error = createElement('p', {
          class: 'comment-error'
        }, self.conf('loadError', 'Failed to load comments. Click to try again'));
        self.element.insertBefore(error, list);
        self.dom.loadError = error;

        listen(error, 'click', function (event) {
          self.loadComments();
        });
        return;
      }

      for (var i in res) {
        self.insertComment(res[i].value, self.element);
      }
    });
  };

  //
  // ## Insert a comment
  //
  Tala.prototype.insertComment = function insertComment(comment, element) {
    var li = createElement('li');

    var name = createElement('span', {}, comment.username);
    li.appendChild(name);

    var date = new Date(comment.timestamp);
    var time = createElement('time', {
      datetime: date.toString(),
    }, date.toString());
    li.appendChild(time);

    var text = createElement('div', {}, comment.comment);
    li.appendChild(text);

    element.querySelector('ol').appendChild(li);
  };

  //
  // ## Getthis.config
  //
  Tala.prototype.conf = function conf(key, def) {
    return this.config[key] || def;
  };

  //
  // ## WebSockets!
  //
  Tala.prototype.setupSocket = function setupSocket(resource) {
    if (!window.WebSocket) {
      return;
    }

    var host = this.conf('host', window.document.location.host).replace(/^https?:\/\//, '');
    var ws = new WebSocket('ws://' + host);
    var self = this;
    ws.onmessage = function (msg) {
      var comment = JSON.parse(msg.data);
      self.insertComment(comment, self.element);
    };

    ws.onopen = function () {
      self.retries = 0;
      self.nextTry = 1000;
      ws.send(JSON.stringify({
        'subscribe': resource
      }));
    };

    // Try to reconnect if socket is closed.
    ws.onclose = function () {
      self.retries++;
      if (self.retries > 8) return;
      setTimeout(function () {
        self.nextTry *= 2;
        self.setupSocket();
      }, self.nextTry);
    };
  };

  //
  // ## Save Credentials
  //
  Tala.prototype.saveCredentials = function saveCredentials(name, email) {
    if (!this.store) return;
    this.store.setItem('comments:user', JSON.stringify({
      username: name,
      email: email
    }));
  };

  //
  // ## Get Credentials
  //
  Tala.prototype.getCredentials = function getCredentials() {
    if (!this.store) return;
    var credentials = this.store.getItem('comments:user');
    if (credentials) {
      credentials = JSON.parse(credentials);
    }
    else {
      credentials = { username: '', email: ''};
    }

    return credentials;
  };

  //-------------------------------------------------------------------------

  //
  // ## Attach Event Handler
  //
  function listen(element, event, fn) {
    if (window.addEventListener) {
      element.addEventListener(event, fn, false);
    }
    else if (window.attachEvent) {
      element.attachEvent('on' + event, fn);
    }
  }

  //
  // ## Do AJAX
  //
  function ajax(host, method, data, fn) {
    if (typeof data === 'function') {
      fn = data;
      data = '';
    }

    var req = new XMLHttpRequest();
    req.onreadystatechange = function () {
      if (this.readyState === 4 && this.status === 200) {
        fn(null, JSON.parse(this.responseText), this);
      }
      else if (this.readyState === 4 && this.status !== 200) {
        fn(JSON.parse(this.responseText), null, this);
      }
    };
    req.open(method, host);
    if (method === 'POST') {
      req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    }
    req.send(data);
  }

  function createElement(tag, attributes, text) {
    attributes = attributes || {};
    text       = text || '';

    var el = document.createElement(tag);
    for (var i in attributes) {
      el.setAttribute(i, attributes[i]);
    }

    el.textContent = text;
    return el;
  }

  new Tala();
}());

