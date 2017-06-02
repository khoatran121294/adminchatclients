var express = require("express");
var router = express.Router();

var {CLIENTS} = require('../src/data.js'); // all clients connected room
var {ADMIN} = require('../src/data.js');; // admin connected room

router.get(["/","/login"], function(req, res){
    const failCode = req.query.fail;
    if(failCode == 1){
        return res.render("customer_login", {error : "Username is existing in room, please choose others."});
    }
    return res.render("customer_login");
});

router.get('/home/:username', function(req, res){
    const username = req.params.username;
    let _index = CLIENTS.findIndex(_user => _user.name == username);
    if(_index >= 0){
        return res.redirect("/customer/login?fail=" + 1);
    }
    else{
        return res.render("customer_home", {
            user : {
                name : username
            }
        });
    }
});

module.exports = router;