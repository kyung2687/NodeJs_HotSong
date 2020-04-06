var express = require('express');
var router = express.Router();

var Song = require('./model/song');
var User = require('./model/user');

router.get('/', (req, res) => {
    if(req.cookies.user.id != "admin") return res.redirect("/index");
    res.render('adminpage');
})

module.exports = router;