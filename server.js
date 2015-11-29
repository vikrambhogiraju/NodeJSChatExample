// Modules
var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');


var cache = {};  // Cache
var PORT = 8080;  // Port to run server at

// Send "File Not Found" in HTTP response - 404
function sendFileNotFound(res) {

    res.writeHead(
        404,
        { "content-type" : "text/plain" }
    );
    res.end("File Not Found!!");

}

// Send File contents in HTTP response - 200
function sendFile(res, filePath, fileContents) {

    //Get file's mime-type
    var fileMime = mime.lookup(path.basename(filePath));


    res.writeHead(
        200,
        { "content-type" : fileMime }
    );
    res.end(fileContents);

}

// Send contents in HTTP response object
function sendResponse(res, filePath) {

    // Check cache for file contents
    if(cache[filePath]) {
        // If file in cache,
        // Send contents from cache itself
        sendFile(res, filePath, cache[filePath]);

    } else {
        // File contents not in cache
        fs.exists(filePath, function(exists) {
            if(exists) {
                // If file found in path
                // Read and send its contents
                fs.readFile(filePath, function(err, fileContents) {
                    if(err) {
                        // On file read errors, send 'File not found' - 404
                        sendFileNotFound(res);

                    } else {
                        // Cache file contents for reuse
                        cache[filePath] = fileContents;
                        sendFile(res, filePath, fileContents);

                    }
                });

            } else {
                // If file not found in path
                // Send 'File not found' - 404
                sendFileNotFound(res);

            }
        });
    }
}

// Server to serve static files
http.createServer( function(req, res) {
    var filePath = './public' + req.url; // Translate req url to File Path

    // If not file specified in URL, translate as index.html
    if(req.url === "/") {
        filePath += 'index.html';

    }

    sendResponse( res, filePath);

})

.listen(PORT, function(err) {  //Start server at designated port (PORT)
    if(err) {
        console.log("Error in running server:" + err);

    } else {
        console.log("Server running successfully on port : " + PORT);

    }
});




