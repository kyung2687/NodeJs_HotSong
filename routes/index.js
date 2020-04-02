var express = require('express');
var router = express.Router();

var Song = require('./model/song');
var User = require('./model/user');

/* GET home page. */
router.get('/index', function(req, res) {
  if(!req.cookies.user) return res.redirect('/');
  Song.find({streamingYN: false}, (err, song) => {
    if(err) return res.status(500).json({error: err});
    console.log(song);
    res.render('index', { songlist: song, user: req.cookies.user });
  })
});

router.get('/songsin', (req, res) => {
  res.render('songsin', {user : req.cookies.user});
})

router.post('/save', function(req, res) {
  var song = new Song();

  song.title = req.body.title;
  song.singer = req.body.singer;
  song.name = req.body.name;
  song.belong = req.body.belong;
  song.rank = req.body.rank;

  song.save((err) => {
    if(err) {
      console.log(err);
      res.json({result: 0});
      return;
    }
    res.redirect("/index");
  });
});

router.post('/streaming', (req, res) => {
  Song.findOne({title: req.body.title, streamingYN:false}, function(err, song){
    if(err) return res.status(500).json({ error: 'database failure' });
    if(!song) return res.status(404).json({ error: 'song not found' });

    song.streamingYN=true;
    song.up_date=Date.now();

    song.save(function(err){
      if(err) res.status(500).json({error: 'failed to update'});
      res.redirect("/index");
    });
  });
});

router.get('/streamed', function(req, res, next) {
  Song.find({streamingYN: true}, (err, song) => {
    if(err) return res.status(500).json({error: err});
    console.log(song);
    res.render('streaming', { songlist: song });
  })
});

router.get('/', (req, res) => {
  if(req.cookies.user) res.clearCookie('user');
  res.render('login', { result: 1 });
})

router.post('/login', (req, res) => {

  User.findOne({id: req.body.id}, (err, user) => {
    if(err) return res.status(500).json({ error: 'database failure' });
    if(!user) { return res.render('login', { result: 2 });}
    if(user.password == req.body.password) {
      res.cookie('user', user);
      res.redirect('/index');
    } else {
      res.render('login', { result: 0 });
    }
  })
})

router.get('/signup', (req, res) => {
  res.render('signup', { result: 0 });
})

router.post('/signup', (req, res) => {
  var user = new User();

  user.name = req.body.name;
  user.id = req.body.id;
  user.password = req.body.password;
  user.belong = req.body.belong;
  user.rank = req.body.rank;
  user.task = req.body.task;

  User.findOne({id: req.body.id}, function(err, aluser){
    if(err) return res.status(500).json({ error: 'database failure' });
    if(aluser) { return res.render('signup', { result: 2 });}
    user.save((err) => {
      if(err) {
        console.log(err);
        res.json({result: 1});
        return;
      }
      res.redirect("/");
    });
  });
})

router.get('/songdelall', (req, res) => {
  Song.remove({}, (err, result) => {
    if(err) return res.status(500).json({ error: "database failure" });
    res.redirect("/");
  })
})

router.get('/userdelall', (req, res) => {
  User.remove({}, (err, result) => {
    if(err) return res.status(500).json({ error: "database failure" });
    res.redirect("/");
  })
})

router.get('/songdate', (req, res) => {
  Song.findOne({title: "admin"}, function(err, song) {
    song.up_date = new Date("2017-01-26");
    song.save((err) => {
      if(err) {
        console.log(err);
        res.json({result: 1});
        return;
      }
      res.redirect("/");
    })
  })
})

module.exports = router;