function sendConfigToWatch(config) {
  Pebble.sendAppMessage(config, function() {}, function(error) {});
}

function loadAndSendConfig() {
  var config = {};
  
  var theme = localStorage.getItem('naos_theme');
  if (theme !== null) config.Theme = parseInt(theme);
  
  var branding = localStorage.getItem('naos_branding');
  if (branding !== null) config.ShowBranding = branding === '1' ? 1 : 0;
  
  var date = localStorage.getItem('naos_date');
  if (date !== null) config.ShowDate = date === '1' ? 1 : 0;
  
  var seconds = localStorage.getItem('naos_seconds');
  if (seconds !== null) config.ShowSeconds = seconds === '1' ? 1 : 0;
  
  if (Object.keys(config).length > 0) {
    sendConfigToWatch(config);
  }
}

Pebble.addEventListener('ready', function() {
  setTimeout(loadAndSendConfig, 500);
});

Pebble.addEventListener('showConfiguration', function(e) {
  var theme = localStorage.getItem('naos_theme') || '0';
  var branding = localStorage.getItem('naos_branding') || '1';
  var date = localStorage.getItem('naos_date') || '1';
  var seconds = localStorage.getItem('naos_seconds') || '0';
  
  var url = 'https://mvogge.github.io/pebble-naos-watchface/src/pkjs/config.html';
  url += '#theme=' + theme + '&branding=' + branding + '&date=' + date + '&seconds=' + seconds;
  Pebble.openURL(url);
});

Pebble.addEventListener('webviewclosed', function(e) {
  if (!e.response) return;
  
  try {
    var configData = JSON.parse(decodeURIComponent(e.response));
    
    if (configData.Theme !== undefined) {
      localStorage.setItem('naos_theme', configData.Theme);
    }
    if (configData.ShowBranding !== undefined) {
      localStorage.setItem('naos_branding', configData.ShowBranding);
    }
    if (configData.ShowDate !== undefined) {
      localStorage.setItem('naos_date', configData.ShowDate);
    }
    if (configData.ShowSeconds !== undefined) {
      localStorage.setItem('naos_seconds', configData.ShowSeconds);
    }
    
    sendConfigToWatch(configData);
  } catch (err) {}
});
