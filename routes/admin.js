var express = require("express");
var router = express.Router();

router.get(["/", "/login"], function(req, res){
    const failCode = req.query.fail;
    if(failCode == 1){
        return res.render("admin_login", {error : "Username or Password is invalid !"});
    }
    return res.render("admin_login");
});

router.post("/check_login", function(req, res){
    if("admin" == req.body.username && "123456" == req.body.pass){
        req.session.user = {
            username : req.body.username
        };
        return res.redirect("/admin/home");
    }
    return res.redirect("/admin/login?fail=1");
});

router.use(function(req, res, next){
    //check session is exist
    if(req.session.user == null){
        return res.redirect("/admin/login");
    }
    if("admin" != req.session.user.username){
        return res.redirect("/admin/login");
    }
    res.locals.user = req.session.user;
    next();
});

router.get('/home', function(req, res){
    res.render("admin_home");
});

router.get("/logout", function(req, res){
    
    //clear session after logout
    req.session.destroy();
    res.redirect("/admin/login");
});

module.exports = router;