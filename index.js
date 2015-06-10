#!/usr/bin/env node

var os = require('os'),
    proxy = require('http-proxy'),
    interfaces = os.networkInterfaces(),
    pkg = require('./package'),
    ver = pkg.version,
    exit = function() {
      console.log('Usage example:\n %s 51123 to 3000', Object.keys(pkg.bin)[0]);
      process.exit();
    },
    localPort, proxyPort;

console.log('IIS Express Proxy %s', ver);

if (process.argv.length != 5 || process.argv[3].toLowerCase() !== 'to') {
  exit();
}

localPort = parseInt(process.argv[2]);
proxyPort = parseInt(process.argv[4]);

if (isNaN(localPort) || isNaN(proxyPort)) {
  exit();
}

console.log('Proxying localhost:%d to:', localPort);

Object.keys(interfaces).forEach(function(name) {
  interfaces[name].filter(function(item) {
    return item.family == 'IPv4' && !item.internal;
  }).forEach(function(item) {
    console.log("- %s: %s:%s", name, item.address, proxyPort);
  });
});

proxy.createProxyServer({
  target: 'http://localhost:' + localPort,
  xfwd: true,
  changeOrigin: true
}).listen(proxyPort, function() {
  console.log('Listening... [ press Control-C to exit ]');
});
