//Serve static files to the client
// Handle chat related messaging on the server
// Handle chat related messages in the web browser
//Access to Node's HTTP-related functionality
var http = require('http');
// Ability to interact with the filesystem
var fs = require('fs');
//Functionality related to file path
var path = require('path');
// Ability to dertimine a file's MIME type
var mime = require('mime');
//Cache file data, cache object is where the contents of cached files are stored
var cache = {};
//Serve PORT
var PORT = process.env.PORT || 3030

//helper function - handle 404 errors when a file requested does not exist.
function send404(response){
  response.writeHead(404, {'Content-Type': 'text/plain'});
  response.write('Error 404: resource not found.');
  response.end();
}

//helper function - serves file data, writes the appropriate HTTP headers and then sends the contents of the file. 

function sendFile(response, filePath, fileContents) {
  response.writeHead(200, {"content-type": mime.lookup(path.basename(filePath))
  });
  response.end(fileContents);
}

//Determines if file is cached, if so it serves it from RAM if not it is read from the disk. If it does not exist, a HTTP 404 error is returned

function serveStatic(response, cache, absPath) {
  if(cache[absPath]) {
    sendFile(response, absPath, cache[absPath]);
  } else {
    fs.exists(absPath, function(exists) {
      if (exists) {
        fs.readFile(absPath, function(err, data) {
          if(err){
            send404(response);
          } else {
            cache[absPath] = data;
            sendFile(response, absPath, data);
          }
        });
      } else {
        send404(response);
      }
    });
  }
}  


var server = http.createServer(function(request, response){
  var filePath = false;
  
  if (request.url == '/') {
    filePath = 'public/index.html';
  } else {
    filePath = 'public' + request.url;
  }
  var absPath = './' + filePath;
  serveStatic(response, cache, absPath);
});

server.listen(PORT, function(){
  console.log("Server listening on port:" + PORT)
})
