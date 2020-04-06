var express = require('express');
var router = express.Router();

var Song = require('./model/song');
var User = require('./model/user');

router.get('/songdelall', (req, res) => {
  Song.remove({}, (err, result) => {
    if(err) return res.status(500).json({ error: "database failure" });
    res.redirect("/");
  })
})

router.get('/songdelone/:title/:name', (req, res) => {
  Song.remove({ title: req.params.title, name: req.params.name}, {single : true},  function(err, output){
    if(err) return res.status(500).json({ error: "database failure" });
  })
  res.redirect('/index');
})


router.get('/songback/:title/:name', (req, res) => {
  Song.findOne({title: req.params.title, name: req.params.name}, function(err, song) {
    if(err) res.redirect("/");
    song.streamingYN = false;
    song.save((err) => {
      if(err) {
        console.log(err);
        res.redirect("/");
        return;
      }
      res.redirect("/");
    })
  })
});
module.exports = router;
