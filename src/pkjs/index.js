Pebble.addEventListener('ready', function() {
  console.log('Naos Watchface ready');
  
  // Gespeichertes Theme beim Start an Uhr senden
  var theme = localStorage.getItem('naos_theme');
  if (theme !== null) {
    var dict = { 'Theme': parseInt(theme) };
    Pebble.sendAppMessage(dict, function() {
      console.log('Initial theme sent: ' + theme);
    }, function(e) {
      console.log('Error sending initial theme: ' + e.error);
    });
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
  if (!e.response) {
    return;
  }
  
  var configData = JSON.parse(decodeURIComponent(e.response));
  
  if (configData.Theme !== undefined) {
    localStorage.setItem('naos_theme', configData.Theme);
    
    var dict = { 'Theme': parseInt(configData.Theme) };
    Pebble.sendAppMessage(dict, function() {
      console.log('Theme updated to: ' + configData.Theme);
    }, function(e) {
      console.log('Error sending theme: ' + e.error);
    });
  }
});
