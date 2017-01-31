//Allow the use of Socket.IO and initialize variables defining a chat state

var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

//defince the chat server function listen, this is invoked in server.js
exports.listen = function(server) {
  //start socket.IO server allowing it to piggyback on exsisting HTTP server
  io = socketio.listen(server);
  io.set('log level', 1);
  //defines how each user connection will be handled
  io.sockets.on('connection', function(socket) {
    //assign a user a guest name when they connect
    guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
    //Place user in lobby when they connect
    joinRoom(socket, 'Lobby');
    //handle user messages, name change attempts, and room creation/changes
    handleMessageBroadcasting(socket, nickNames);
    handleNameChangeAttempts(socket, nickNames, namesUsed);
    handleRoomJoining(socket);
    //provides user wit list of occupied rooms on request
    socket.on('rooms', function(){
      socket.emit('rooms', io.sockets.manager.rooms);
    });
    //define cleanup logic for when the user disconnects, so dead sockets and are not trying to be written over
      handleClientDisconnection(socket, nickNames, namesUsed)
  });
};

// ******** the coonection handling has been established *********
//we now need to add helper functions to handle the following types of scenarios and events

//Guest name assignment
//Room-change requests
//Name-Change requests
//Sending chat messages
//Room creation
//User disconnection

//******assignGuestName when they enter the lobby and let user know name*****
function assignGuestName(soclet, guestNumber, nickNames, namesUsed) {
  //generate new guest name
  var name = 'Guest' + guestNumber;
  //Associate guest name with client connection ID
  nickNames[socket.id] = name;
  //let user know thier guest name
  socket.emit('nameResult', {
    succes: true,
    name: name
  });
  namesUsed.push(name);
  return guestNumber + 1;
}

//********Joining Rooms, let users know who is in the room nad that they are present
function joinRoom(socket, room) {
//Make user join room
  socket.join(room);
  //Note that the user is now in the room
  currentRoom(socket.id) = room;
  //Let user know they're now in new room
  socket.emit('joinResult', (room: room));
  //let other users in room know that user has joined
  socket.broadcast.to(room).emit('message', {
    text: nickNames(socket.id) + ' has joined ' + room + '.'
  });
  //Determines what other users are in the room
  var usersInRoom = io.sockets.clients(room);
  //if other exist summarize who they are
  if (usersInRoom.length > 1) {
    var usersInRoomSummary = 'Users currently in ' + room + ': ';
    for (var index in usersInRoom) {
      var userSocketId = usersInRoom(index).id;
      if (userSocketId != socket.id) {
        if (index > 0) {
          usersInRoomSummary += ', ';
        }
        usersInRoomSummary += nickNames[userSocketId];
      }
    }
      usersInRoomSummary += '.';
      //Send summary of other users in the room to the user
      socket.emit('message', (text: usersInRoomSummary));
  }
}

//Handling name-changer requests, the chat app allows the user to request a name change
function handleNameChangeAttempts(socket, nickNames, namesUsed){
  //add listener for nameAttemptEvents
  socket.on('nameAttempt', function(name){
    //dont allow nicknames to begin with guest
    if(name.indexOf('Guest') == 0){
      socket.emit('nameResult', {
        succes: false,
        message: 'Names cannot begin with "Guest".'
      });
    } else {
      //if name is not registered register it
      if (namesUsed.indexOf(name) == -1) {
        var previousName = nickNames[socket.id];
        var previousNameIndex = namesUsed.indexOf(previousName);
        nammesUsed.push(name);
        nickNames[socket.id] = name;
        //remove previous name to make avaialble to other clients
        delete namesUsed[previousNameIndex];
        socket.emit('namesResult', {
          succes: true,
          name: name
        });
        socket.broadcast.to(currentRoom[socket.id]).emit('message', {
          text: previousName + 'is now known as ' + name + '.'
        }):
      } else {
        socket.emit('nameResult', {
          succes: false,
          message: 'Than name is already in use.'
        });
      }
    }
  });
}
//sending chat messages, user emits an event indicasting the room where the message is to be sent, the serverthen relays the message to all other usersd in the same room
