/* ChatServer.js */

// Node.js Modules
var io = require('socket.io')(); // Chat Server

// ChatServer vars
var clientNameNum = 1; // A number for assigning new names to new clients
var clientNames = {}; // Client Names by socket id
var clientNamesInUse = []; // Client Names currently in use in an array
var currentRooms = {}; // Client Rooms by client name
var initRoom = 'lobby'; //Initial Room


// Attach Chat Server to HTTP Server and handle events
exports.listen = function (httpServer) {
    // Attach to existing HTTP server
    io.attach(httpServer, {serveClient: false});
    
    // On new connection event
    io.on('connection', function (socket) {        
        // Assign a new guest name
        assignNewName(socket);
        
        // Place new user in Lobby
        joinRoom(socket, initRoom);
        
        // Event handler for new message
        handleNewMessage(socket);
        
        // Event handler for name change
        handleChangeName(socket);
        
        // Event handler for join room
        handleJoinRoom(socket);
        
        // Event for sending list of rooms available
        socket.on('rooms', function() {
            socket.emit('rooms', ioServer.sockets.manager.rooms);
        });
        
        // Event handler for client disconnections
        handleDisconnect(socket);
        
    });
};


// Assign a new guest name to a new client
function assignNewName(socket) {
    // Construct new name and increament clientNameNum
    var newClientName = 'Guest' + clientNameNum++;
    
    // Add to client names list
    clientNames[socket.id] = newClientName;
    
    // Add to clientNamesInUse array
    clientNamesInUse.push(newClientName);
    
    // Send new name to user
    socket.emit('new name', newClientName);
    
}


// Handle client disconnetions
function handleDisconnect(socket) {
    // On disconnect event...
    socket.on('disconnect', function () {
        // Get client name
        var clientName = clientNames[socket.id];
        
        // Delete name from clientNamesInUse array
        delete clientNamesInUse[clientNamesInUse.indexOf(clientName)];

        // Delete name from names list
        delete clientNames[socket.id];
        
        // Delete from current rooms list
        delete currentRooms[socket.id];
        
        // Send client name to all users
        io.emit('disconnect', clientName);
        
    });
}


// Add client to a room
function joinRoom(socket, roomName) {
    // Get client name
    var clientName = clientNames[socket.id];
    
    // Join room
    socket.join(roomName);
    
    // Update currentRooms array
    currentRooms[socket.id] = roomName;
    
    // Send client name to room
    socket.to(roomName).emit('user joined room', clientName);
    
    // Send room name to user
    socket.emit('room joined', roomName);
    
}


//Handle Message sent
function handleNewMessage(socket) {
    // On new message arrival event...
    socket.on('message', function (message) {
        // Get client name and room
        var clientName = clientNames[socket.id];
        var clientRoom = currentRooms[socket.id];

        //Broadcast message to room
        socket.to(clientRoom).emit('user message',  { name: clientName, text: message });
        
    });
}


//Handle name change requests
function handleChangeName(socket) {
    //On arrival of name change requests...
    socket.on('change name', function (newClientName) {
        // Get client name and room
        var clientName = clientNames[socket.id];
        var currentRoom = currentRooms[socket.id];
        var index;


        if(newClientName === clientName) { // Check if new client name is same as existing client name
            socket.emit('same name', clientName);
            
        } else if(clientNamesInUse.indexOf(newClientName) >= 0) { // Check if new client name is already taken...
            socket.emit('name taken', newClientName);

        } else if(newClientName.indexOf('Guest') === 0) { // Starts with guest, send not valid
            socket.emit('name invalid guest', newClientName);

        } else {  // Name is valid, so go ahead...
            // Update clientNamesInUse array
            index = clientNamesInUse.indexOf(clientName);
            clientNamesInUse[index] = newClientName;

            // Update name in clientNames
            clientNames[socket.id] = newClientName;

            // Send update to user
            socket.emit('name changed', newClientName);

            // Send message to room
            socket.to(currentRoom).emit('user name changed', { oldName : clientName, newName: newClientName });
            
        }
    });
}


function handleJoinRoom(socket) {
    //On event of join room...
    socket.on('join room', function (newRoom) {
        // Get client name and room
        var clientName = clientNames[socket.id];
        var currentRoom = currentRooms[socket.id];
        
        if(currentRoom !== newRoom) {

            //Leave current Room
            socket.leave(currentRoom);

            // Send client name to room
            socket.to(currentRoom).emit('user left room', clientName);

            //Join new room
            joinRoom(socket, newRoom);

        } else {

            // Send update to user
            socket.emit('same room', currentRoom);
        }
    });
}

















