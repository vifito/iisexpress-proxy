#!/usr/bin/env node

var os = require('os'),
    http = require('http'),
    httpProxy = require('http-proxy'),
    connect = require('connect'),
    StringDecoder = require('string_decoder').StringDecoder,
    transformerProxy = require('transformer-proxy'),
    interfaces = os.networkInterfaces(),
    pkg = require('./package'),
    ver = pkg.version,
    url = require('url'),
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

var app = connect();
var proxy = httpProxy.createProxyServer({
  target: 'http://localhost:' + localPort,
  xfwd: true,
  changeOrigin: true
});

//proxy.on('proxyReq', function(proxyReq, req, res, options) {
//  proxyReq.setHeader('Accept-Encoding', 'identity');  
//});

//var transformerFunction = function(data, req) {  
//  data = data.toString().replace(':'+localPort, ':'+proxyPort);  
//  return data; // new Buffer(data);
//};

//app.use(transformerProxy(transformerFunction), {match : /\.(asp)/});

app.use(function(req, res) {
  var parsed = url.parse(req.url);
  console.log('PRE: ' + parsed.pathname);
  
  if(parsed.pathname === '' || parsed.pathname.match(/^([^\.\?]*)[^\/]$/)) {
      parsed.protocol = 'http';
      parsed.host = req.headers.host;
      parsed.pathname += '/';
      
      console.log('POST: ' + parsed.pathname);
      
      res.writeHead(301, {Location: url.format(parsed)});
      res.end();
  } else {
      proxy.web(req, res);
  }    
});

http.createServer(app).listen(proxyPort, function() {
  console.log('Listening... [ press Control-C to exit ]');
});
