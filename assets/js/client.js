//
// # Client Comments
//
// Renders the comment form and handles posting/fetching etc.
//
(function () {
  'use strict';

  var d = document;

  var config = window.commentsConfig || {};
  var store  = window.localStorage   || false;

  //
  // ## Init
  //
  // Find placeholder element and start loading comments.
  //
  // @TODO: Validate data-id exists
  //
  function init() {
    var element = d.querySelector('.comments-wrapper');
    if (!element) {
      if (console && console.log) console.log('No comment wrapper found. Aborting.');
      return;
    }

    var resource = element.getAttribute('data-id');
    if (!resource) {
      if (console && console.log) console.log('Comment wrapper missing data-id attribute. Aborting.');
      return;
    }

    // Create form
    insertForm(element);

    // Start loading comments
    loadComments(element, resource);

    // Setup WebSocket
    setupSocket(element, resource);
  }

  //
  // ## Insert Form
  //
  // Generate the form.
  //
  function insertForm(element) {
    var form = createElement('form', {
      action: conf('host', '') + '/comment',
      class: 'comments-form'
    });

    var credentials = getCredentials();
    var fields = [
      {
        label: conf('nameField', 'Name'),
        attributes: {
          name: 'username',
          type: 'text',
          placeholder: conf('nameFieldPlaceholder', conf('nameField', '')),
          value: credentials.username
        }
      },
      {
        label: conf('emailField', 'Email'),
        attributes: {
          name: 'email',
          type: 'email',
          placeholder: conf('emailFieldPlaceholder', conf('emailField', '')),
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
      value: element.getAttribute('data-id')
    });
    form.appendChild(hidden);

    var submit = createElement('input', {
      type: 'submit',
      value: conf('submitButton', 'Post Comment')
    });
    form.appendChild(submit);

    element.appendChild(form);
    listen(form, 'submit', postComment);
  }

  //
  // ## Post Comment
  //
  // @TODO: Validate email.
  //
  function postComment(event) {
    event.preventDefault();

    /* jshint validthis: true */
    var form = this;

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

    ajax(form.getAttribute('action'), 'POST', data.join('&'), function (err, res) {
      // @TODO: Handle response
      //console.log(err, res);

      if (!err) {
        form.querySelector('textarea').value = '';
      }
    });

    saveCredentials(username, email);

    return false;
  }

  //
  // ## Load Comments
  //
  function loadComments(element, resource) {
    var list = createElement('ol', { class: 'comments' });
    element.appendChild(list);

    ajax(conf('host', '') + '/comments/' + resource, 'GET', function (err, res) {
      // @TODO: Handle error
      if (err) {
        console.log(err);
        return;
      }

      for (var i in res) {
        insertComment(res[i].value, element);
      }
    });
  }

  //
  // ## Insert a comment
  //
  function insertComment(comment, element) {
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
  }

  //
  // ## Get Config
  //
  function conf(key, def) {
    return config[key] || def;
  }

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

  //
  // ## WebSockets!
  //
  function setupSocket(element, resource) {
    if (!window.WebSocket) {
      return;
    }

    var host = conf('host', window.document.location.host).replace(/^https?:\/\//, '');
    var ws = new WebSocket('ws://' + host);
    ws.onmessage = function (msg) {
      var comment = JSON.parse(msg.data);
      insertComment(comment, element);
    };

    ws.onopen = function () {
      ws.send(JSON.stringify({
        'subscribe': resource
      }));
    };
  }

  //
  // ## Save Credentials
  //
  function saveCredentials(name, email) {
    if (!store) return;
    store.setItem('comments:user', JSON.stringify({
      username: name,
      email: email
    }));
  }

  function getCredentials() {
    if (!store) return;
    var credentials = store.getItem('comments:user');
    if (credentials) {
      credentials = JSON.parse(credentials);
    }
    else {
      credentials = { username: '', email: ''};
    }

    return credentials;
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

  init();
}());

