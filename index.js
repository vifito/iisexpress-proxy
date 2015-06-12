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
    encoding = require("encoding"),
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
    name = encoding.convert(name, "Latin_1");
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
  
  // Corrixir problemas coa redirección de IIS que engade automaticamente
  // se non existe unha barra final nos directorios
  if(parsed.pathname === '' || parsed.pathname.match(/^([^\.\?]*)[^\/]$/)) {
    parsed.protocol = 'http';
    parsed.host = req.headers.host;
    parsed.pathname += '/';     
    res.writeHead(301, {Location: url.format(parsed)});
    res.end();      
  } else {
    
    // Corrixir posible petición a un ficheiro con barra final
    if (parsed.pathname.match(/.*?\.[a-z]{3}.*?[\/]$/)) {
      parsed.protocol = 'http';
      parsed.host = req.headers.host;
      parsed.pathname = parsed.pathname.replace(/(.*?)\/$/, '$1');      
      res.writeHead(301, {Location: url.format(parsed)});
      res.end();    
    } else {      
      // Se non hai erros anteriores facer de proxy
      proxy.web(req, res);
    }  
  }
  
});

http.createServer(app).listen(proxyPort, function() {
  console.log('Escoitando... [ preme Control-C para saír ]');
});
