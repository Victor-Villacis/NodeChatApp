net = require('net');
//keep the people that connect to the server
var sockets = []
var server = net.createServer(function(socket){
  //put people when connect to server
  sockets.push(socket);
  //everytime somebody says something, we iterate over sockets and write to them
  //socket.on('data')
  //socket.on('close')
  socket.on('data', function(d){
    for (var i = 0; i < sockets.length; i++){
      if (sockets[i] == socket) continue;
      sockets[i].write(d)
    }
  });
  //so dead sockets are not trying to be written over, removes them from the array
  socket.on('end', function(){
    var i = sockets.indexOf(socket);
    sockets.splice(i, 1);
  });
});

//loads functionality from a custom node module, supplies logic to handle Socket.IO server functionality
var chatServer = require('./lib/chat_server');
//Start the Socket.IO with an already defined HTTP, so it can share the same TCP/IP port
chatServer.listen(server);

server.listen(8080, function(){
  console.log("listening on port 8080")
});
