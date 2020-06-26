/**
 * Utility class for REST style HTTP servers.
 *
```
const server = require('expressif').createServer(app => {
  app.get("/", (req, res) => {
    res.writeHead(200, { "Content-Type", "text/plain" });
    res.end("Hello World");
  });
});

server.listen(8080);
// server.close();

// Use the router() method in middleware like in ws
const app = new require('expressif').Application();
const server = require('ws').createServer(app.router());

app.get("/", (req, res) => {
  res.writeHead(200, { "Content-Type", "text/plain" });
  res.end("Hello World");
});

server.listen(8080);
```
 */

function defaultNotFound(req, res) {
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found.");
}

function Route(method, path, callback) {
  this.method = method;
  this.path = path;
  this.callback = callback;
}

Route.prototype.filter = function(req) {
  return (
    this.method === req.method &&
    req.url === this.path
  );
};

Route.prototype.process = function(req, res) {
  this.callback(req, res);
};

function route(req, res) {
  let sent = false;
  this.pipeline.forEach(route => {
    if (!sent && route.filter(req)) {
      route.process(req, res);
      sent = true;
    }
  });
  if (!sent) {
    this.notFound(req, res);
  }
}

function Application() {
  this.pipeline = [];
  this.notFound = defaultNotFound;
}

Application.prototype.method = function(method, path, callback) {
  this.pipeline.push(new Route(method, path, callback));
  return this;
};

['get', 'post', 'put', 'delete', 'options', 'head', 'purge'].forEach(function(method) {
  Application.prototype[method] = function(path, callback) {
    return this.method(method.toUpperCase(), path, callback);
  };
});

Application.prototype.router = function(req, res) {
  return route.bind(this);
};

exports.Application = Application;

exports.createServer = configureApp => {
  const app = new Application();
  configureApp(app);
  return require('http').createServer(app.router());
};
