var initialThemeSent = false;

function sendThemeToWatch(theme, retryCount) {
  retryCount = retryCount || 0;
  
  if (retryCount > 5) {
    console.log('Max retries reached, giving up');
    return;
  }
  
  var dict = { 'Theme': parseInt(theme) };
  console.log('Attempting to send theme (retry ' + retryCount + '): ' + JSON.stringify(dict));
  
  Pebble.sendAppMessage(dict, function() {
    console.log('Theme successfully sent to watch: ' + theme);
    initialThemeSent = true;
  }, function(error) {
    console.log('Error sending theme (retry ' + retryCount + '): ' + JSON.stringify(error));
    // Retry after 500ms
    setTimeout(function() {
      sendThemeToWatch(theme, retryCount + 1);
    }, 500);
  });
}

Pebble.addEventListener('ready', function() {
  console.log('Naos Watchface PKJS ready');
  
  // Warte kurz bis die Verbindung stabil ist
  setTimeout(function() {
    var theme = localStorage.getItem('naos_theme');
    if (theme !== null && !initialThemeSent) {
      sendThemeToWatch(theme, 0);
    }
  }, 1000);
});

Pebble.addEventListener('showConfiguration', function(e) {
  var theme = localStorage.getItem('naos_theme') || '0';
  var url = 'https://mvogge.github.io/pebble-naos-watchface/src/pkjs/config.html';
  
  url += '#theme=' + theme;
  Pebble.openURL(url);
});

Pebble.addEventListener('webviewclosed', function(e) {
  console.log('Webview closed, response: ' + e.response);
  
  if (!e.response) {
    console.log('No response from webview');
    return;
  }
  
  try {
    var configData = JSON.parse(decodeURIComponent(e.response));
    console.log('Config data parsed: ' + JSON.stringify(configData));
    
    if (configData.Theme !== undefined) {
      localStorage.setItem('naos_theme', configData.Theme);
      console.log('Theme saved to localStorage: ' + configData.Theme);
      
      sendThemeToWatch(configData.Theme, 0);
    } else {
      console.log('No Theme in config data');
    }
  } catch (err) {
    console.log('Error parsing config: ' + err);
  }
});
