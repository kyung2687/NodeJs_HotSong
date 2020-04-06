var express = require('express');
var router = express.Router();

var Song = require('./model/song');
var User = require('./model/user');

router.get('/userdelall', (req, res) => {
    User.remove({}, (err, result) => {
      if(err) return res.status(500).json({ error: "database failure" });
      res.redirect("/");
    })
});

module.exports = router;
