Pebble.addEventListener('ready', function() {
  var theme = localStorage.getItem('naos_theme');
  if (theme !== null) {
    Pebble.sendAppMessage({ 'Theme': parseInt(theme) });
  }
});

Pebble.addEventListener('showConfiguration', function(e) {
  var theme = localStorage.getItem('naos_theme') || '0';
  var url = 'https://mvogge.github.io/pebble-naos-watchface/src/pkjs/config.html';
  url += '#theme=' + theme;
  Pebble.openURL(url);
});

Pebble.addEventListener('webviewclosed', function(e) {
  if (!e.response) return;
  
  try {
    var configData = JSON.parse(decodeURIComponent(e.response));
    if (configData.Theme !== undefined) {
      localStorage.setItem('naos_theme', configData.Theme);
      Pebble.sendAppMessage({ 'Theme': parseInt(configData.Theme) });
    }
  } catch (err) {
    // Silent fail
  }
});
