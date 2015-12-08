/* ChatServer.js */

// Node.js Modules
var io = require('socket.io')(); // Chat Server

var initRoom = 'lobby'; //Initial Room

// ChatClient - constructor
function ChatClient(socket) {
    this.socket = socket; // Socket on server side
    this.name = 'Guest' + ChatClient.uniqNum++;  // Generate unique name
    ChatClient.clients[this.socket.id] = this; // Add this to clients list
    this.socket.emit('new name', this.name); // Send name to user
    this.joinRoom(initRoom); // Join initial room
    this.handleEvents(this); // Attach all event handlers
    console.log("Client Created!");
    
}

ChatClient.uniqNum = 1; // Initializing to increment static var (each time when new client joins) to generate unique names

ChatClient.clients = {}; // To have a list of active clients

// Get all active client names in an array
ChatClient.prototype.getNames = function() {
    var allNames = [];
    
    for(var clientId in ChatClient.clients) {
        allNames.push(ChatClient.clients[clientId].name);
    }
    
    return allNames;
};

// Get all room names of active clients in an array
ChatClient.prototype.getRooms = function() {
    var allRooms = [];
    var room;
    
    for(var clientId in ChatClient.clients) {
        room = ChatClient.clients[clientId].room;
        if(allRooms.indexOf(room) < 0)
            allRooms.push(ChatClient.clients[clientId].room);
    }
    
    return allRooms;
};

// Join a new room
ChatClient.prototype.joinRoom = function(room) {
    // Update and join room
    this.room = room;
    this.socket.join(room);

    // Send message to room
    this.socket.to(this.room).emit('user joined room', this.name);

    //Send message to user
    this.socket.emit('room joined', this.room);
        
};

// Handle new message requests
ChatClient.prototype.handleNewMessage = function(msg) {
    // Send message to room
    this.socket.to(this.room).emit('user new msg',  { name: this.name, text: msg });

};

// Handle Name change requests
ChatClient.prototype.handleNameChange = function(newName){
    if(newName === this.name) { // Check if new client name is same as existing client name
        this.socket.emit('same name', newName);

    } else if(newName.indexOf('Guest') === 0) { // Starts with guest, send not valid
        this.socket.emit('name invalid guest', newName);

    } else if(this.getNames().indexOf(newName) >= 0) { // Check if new client name is already taken...
        this.socket.emit('name taken', newName);

    } else {  // Name is valid, so go ahead...
        // Update name
        var oldName = this.name;
        this.name = newName;

         // Send update to user
        this.socket.emit('name changed', newName);

        // Send message to room
        this.socket.to(this.room).emit('user name changed', { oldName : oldName, newName: newName });

    };
};

// Handle room list requests
ChatClient.prototype.handleRoomsList = function() {
    // Send list of rooms to client
    this.socket.emit('rooms list', this.getRooms());

}

// Handle join room requests
ChatClient.prototype.handleJoinRoom = function(newRoom) {
    if(this.room !== newRoom) {  // if new room name
        //Leave current room
        this.socket.leave(this.room);

        // Send message to current room
        this.socket.to(this.room).emit('user left room', this.name);

        // Join new room
        this.joinRoom(newRoom);

    } else { // if same room name
        // Send message to client
        this.socket.emit('same room', this.room);

    }
};

//Handle disconnections
ChatClient.prototype.handleDisconnect = function() {
    // Delete from clients list
    delete ChatClient.clients[this.socket.id];

    // Send client name to all clients
    io.emit('disconnect', this.name);

};



// Attach event handlers
ChatClient.prototype.handleEvents = function() {
    this.socket.on('new msg', this.handleNewMessage.bind(this));
    this.socket.on('change name', this.handleNameChange.bind(this));
    this.socket.on('join room', this.handleJoinRoom.bind(this));
    this.socket.on('disconnect', this.handleDisconnect.bind(this));
    this.socket.on('rooms', this.handleRoomsList.bind(this));
}


// Attach Chat Server to HTTP Server and handle events
exports.listen = function (httpServer) {
    // Attach to existing HTTP server
    io.attach(httpServer, {serveClient: false});

    // On new connection event
    io.on('connection', function (socket) {
        // create a new client object
        var chatClient = new ChatClient(socket);
    });
};
