var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http,{
    pingInterval : 9000,
    pingTimeout : 10000
});
var bodyParser = require('body-parser');
var session = require('express-session');

var PORT = 3000;
var {CLIENTS} = require('./src/data.js'); // all clients connected room
var {ADMIN} = require('./src/data.js');; // admin connected room

//setting router
var main_router = require("./routes/main.js");
var admin_router = require("./routes/admin.js");
var customer_router = require("./routes/customer.js");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: "chatting", 
    resave: false,
    saveUninitialized: true
})); 
app.use(express.static("./public"));
app.set("view engine", "ejs");
app.set("views", "./views");

app.use("/", main_router);
app.use("/admin", admin_router);
app.use("/customer", customer_router);

http.listen(PORT, function(e){
    console.log("Server is running at port " + PORT);
});



//socket transaction here

io.on("connection", function(socket){
    console.log("[LOG] - new socket is connected : " + socket.id);

    socket.on("disconnect", function(){
        console.log("[LOG] - socket " + socket.id + " is disconnected");
        
        if( !socket.user ){
            return;
        }

        //check if current user is client then remove list clients
        if(socket.user.isAdmin == false){
            let _index = CLIENTS.findIndex(_user => _user.id == socket.user.id);
            if(_index >= 0){
                CLIENTS.splice(_index, 1);
            }
            if(ADMIN != null){
                socket.to(ADMIN.id).emit("server_send_all_clients", CLIENTS);
                socket.to(ADMIN.id).emit("server_send_client_out", socket.user);
            }
        }
        else{
            socket.broadcast.emit("server_send_admin_status", false);
            ADMIN = null;
        }
    });

    socket.on("client_send_info",function(_user){
        console.log("[LOG] - socket " + socket.id + " is send info to server");
        socket.user = _user;
        socket.user.id = socket.id;

        if(socket.user.isAdmin == false){
            CLIENTS.push(socket.user);
            if(ADMIN != null){
                socket.to(ADMIN.id).emit("server_send_all_clients", CLIENTS);
                socket.to(ADMIN.id).emit("server_send_new_client", socket.user);
                socket.emit("server_send_admin_status", true);

            }    
            else{
                socket.emit("server_send_admin_status", false);
            }
        }
        else{
            ADMIN = socket.user;
            socket.emit("server_send_all_clients", CLIENTS);
            socket.broadcast.emit("server_send_admin_status", true);
        }
    });

    //get message from client and transfer message to admin
    socket.on("client_send_chat_message", function(_message){
        console.log("[LOG] - client " + socket.id + " is send message to admin");

        if(socket.user.isAdmin == false && ADMIN != null){
            socket.to(ADMIN.id).emit("server_send_message_to_admin", {
                clientId : socket.user.id, 
                clientName : socket.user.name,
                message : _message
            });
        }
    });

    //get message from admin and transfer to correctponding client
    socket.on("admin_send_message_to_client", function(_data){
        console.log("[LOG] - admin is send message to client " + _data.clientId);
        
        const client = CLIENTS.find(_client => _client.id == _data.clientId);
        if(client){
            socket.to(client.id).emit("server_send_msg_from_admin_to_client", _data.message);
        }
    });

    //disconnect client socket
    socket.on("client_close", function(msg){
        console.log("[LOG] - " + msg);
        socket.disconnect(true);
    });
});