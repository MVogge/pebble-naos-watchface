var initialThemeSent = false;

Pebble.addEventListener('ready', function() {
  console.log('Naos Watchface PKJS ready');
  // Warte auf JSReady Signal von der Uhr vor dem Senden
});

Pebble.addEventListener('appmessage', function(e) {
  console.log('AppMessage received: ' + JSON.stringify(e.payload));
  
  // Wenn Uhr bereit ist und wir noch kein Theme gesendet haben
  if (e.payload && e.payload.JSReady && !initialThemeSent) {
    initialThemeSent = true;
    
    var theme = localStorage.getItem('naos_theme');
    if (theme !== null) {
      var dict = { 'Theme': parseInt(theme) };
      Pebble.sendAppMessage(dict, function() {
        console.log('Initial theme sent: ' + theme);
      }, function(e) {
        console.log('Error sending initial theme: ' + e.error);
      });
    }
  }
});

Pebble.addEventListener('showConfiguration', function(e) {
  var theme = localStorage.getItem('naos_theme') || '0';
  var url = 'https://mvogge.github.io/pebble-naos-watchface/src/pkjs/config.html';
  
  // Für lokale Entwicklung: relative URL verwenden
  // var url = 'file://' + module.uri.replace('index.js', 'config.html');
  
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
      
      var dict = { 'Theme': parseInt(configData.Theme) };
      console.log('Sending theme to watch: ' + JSON.stringify(dict));
      
      Pebble.sendAppMessage(dict, function() {
        console.log('Theme successfully sent to watch: ' + configData.Theme);
      }, function(error) {
        console.log('Error sending theme to watch: ' + JSON.stringify(error));
      });
    } else {
      console.log('No Theme in config data');
    }
  } catch (err) {
    console.log('Error parsing config: ' + err);
  }
});
