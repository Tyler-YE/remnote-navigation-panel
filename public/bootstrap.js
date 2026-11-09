(function () {
  var widget = new URLSearchParams(window.location.search).get('widgetName');
  if (!['index', 'navigator'].includes(widget)) {
    location.replace('./setup.html');
    return;
  }
  if (widget === 'navigator') document.documentElement.classList.add('hn-viewport');
  var script = document.createElement('script');
  script.src = './' + widget + '-sandbox.js';
  script.onerror = function () {
    var message = document.createElement('p');
    message.textContent = 'Document Navigator could not load. Reload RemNote. If the issue persists, reinstall the approved plugin version.';
    document.body.appendChild(message);
  };
  document.body.appendChild(script);
})();
