/* ChatServer.js */

// Node.js Modules
var io = require('socket.io')(); // Chat Server


var clientNameNum = 1; // Number for assigning new names to new connections
var clientNames = {}; // Names
var clientNamesInUse = []; // Names currently in use
var currentRoom = {}; // Room to user mapping
var initRoom = 'lobby'; //Initial Room

//Attach Chat Server to HTTP Server and handle events
exports.listen = function (httpServer) {
    // Attach to existing HTTP server
    io.attach(httpServer, {serveClient: false});
    
    //Handle events for new connections
    io.on('connection', function (socket) {        
        // Assign a new guest name
        assignNewName(socket);
        
        //Place new user in Lobby
        joinRoom(socket, initRoom);
        
        //Event handler for new message
        handleMessageSent(socket);
        
        //Event handler for name change
        handleNameChange(socket);
        
        //Event handler for join room
        handleJoinRoom(socket);
        
        /*Event for sending list of rooms available
        socket.on('rooms', function() {
            socket.emit('rooms', ioServer.sockets.manager.rooms);
        }); */
        
        //Event handler for client disconnections
        handleClientDisconnect(socket);
        
    });
};

//Assign a new guest name to a new connection
function assignNewName(socket) {
    //Get new name and increament nameNum
    var newClientName = 'Guest' + clientNameNum++;
    
    //Add to names list
    clientNames[socket.id] = newClientName;
    
    //Add to namesInUse array
    clientNamesInUse.push(newClientName);
    
    //Send new name in a message to user
    socket.emit('message', 'Hello, your assigned name is ' + newClientName);
    
}

//Handle disconnetions
function handleClientDisconnect(socket) {
    //on Disconnect event...
    socket.on('disconnect', function () {
        //Get new name
        var clientName = clientNames[socket.id];
        var roomName = currentRoom[clientName];
        

        //Delete name from namesInUse array
        delete clientNamesInUse[clientNamesInUse.indexOf(clientName)];

        //Delete name from names list
        delete clientNames[socket.id];
        
        //Delete from current rooms list
        delete currentRoom[clientName];
        
        //Update Message text
        text = 'User ' + clientName + ' has left Chat rooms!';
    
        //Message to room
        socket.to(roomName).emit('message', { name: 'chat app', text: text});
        
    });
}

//Join a room
function joinRoom(socket, roomName) {
    //Message Text
    var text = '';
    var clientName;
    
    //Join socket to room
    socket.join(roomName);
    
    //get Client Name
    clientName = clientNames[socket.id];
    
    //Update currentRoom array
    currentRoom[clientName] = roomName;
    
    //Update Message text
    text = 'User ' + clientName + ' has joined!';
    
    //Message to room
    socket.to(roomName).emit('message', { name: 'chat app', text: text});
    
    //Update Message text
    text = 'You have joined ' + roomName + "!";
    
    //Message to user
    socket.emit('room join', {name : clientName, text: text});
    
}


//Handle Message sent
function handleMessageSent(socket) {
    //on arrival of message...
    socket.on('message', function (message) {
        var clientRoom;
        var clientName;
        
         //Find name of client user
        clientName = clientNames[socket.id];

        //Find room of client user
        clientRoom = currentRoom[clientName];

        //Broadcast message to room
        socket.to(clientRoom).emit('message',  { name: clientName, text: message });
        
    });
}

//Handle name change requests
function handleNameChange(socket) {
    //On arrival of name change requests...
    socket.on('name change', function (newClientName) {
        //Get Client Name 
        var clientName = clientNames[socket.id];
        var clientNameIndex;
        var text = '';
        
        //Check if new client name is already taken...
        if(clientNamesInUse.indexOf(newClientName) >= 0) {
             //Message to user
            text = newClientName + ' is already taken! Try another name';
            socket.emit('name change', {name : clientName, text: text});
        
        } else if(newClientName.indexOf('Guest') === 0) {
            //Message to user
            text = newClientName + ' starts with Guest! Can\'t proceed! Try another name';
            socket.emit('name change', {name : clientName, text: text});
            
        } else {
            //Update clientNamesInUse array
            clientNameIndex = clientNamesInUse.indexOf(clientName);
            clientNamesInUse[clientNameIndex] = newClientName;

            //Update name in clientNames
            clientNames[socket.id] = newClientName;
            
            //Update current Room of client
            currentRoom[newClientName] = currentRoom[clientName];
            delete currentRoom[clientName]

            //Message to user
            text = 'Name changed to ' + newClientName + " successfully!";
            socket.emit('name change', {name : newClientName, text: text}); 

            //Message to room
            text = 'User ' + clientName + "'s name changed to " + newClientName + "!";
            socket.to(currentRoom[newClientName]).emit('message', {name : 'chat app', text: text}); 
            
        }
    });
}

function handleJoinRoom(socket) {
    //On event of join room...
    socket.on('join room', function (newRoomName) {
        //Leave current room
        var clientName = clientNames[socket.id];
        console.log(clientName + " leaving " + currentRoom[clientName]);
        socket.leave(currentRoom[clientName]);
        
        //Join new room
        joinRoom(socket, newRoomName);
        
    });
}















