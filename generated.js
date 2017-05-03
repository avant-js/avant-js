function MyFunction(msg) {
    msg.payload = "Hello";
    return msg;
}

function function2(msg) {
    msg.payload += " Matheus";
    return {};
}
const http = require('http');
const server = http.createServer((req, res) => {
    let msg = {
        request: req,
        response: res
    };
    Promise.resolve(msg)
        .then(MyFunction(msg))
        .then(function2(msg))
        .then(function(msg) {
            res.writeHead(msg.statusCode || 200, {
                'Content-Type': 'application/json'
            });
            res.end(msg.payload);
        })

});
server.listen('/hey');
server.listen(8000);