//chat.js

function ChatClient(name) {
    this.name = name;
    this.names.push(name);
    this.getAllNames();
}

ChatClient.prototype.getAllNames = function() {
    console.log(this.names.join(', '));
}

ChatClient.prototype.names = [];

var c = new ChatClient("Vikram");
