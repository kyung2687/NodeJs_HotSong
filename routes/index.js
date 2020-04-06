var express = require('express');
var router = express.Router();

var Song = require('./model/song');
var User = require('./model/user');

var Youtube = require('youtube-node');
var youtube = new Youtube();

var {google} = require('googleapis');

var cheerio = require('cheerio');
var request = require('request');

youtube.setKey('AIzaSyC78DTwVHsNgyIg2uOyy81EkmUL14KOm7g');


router.get('/', (req, res) => {
  if(req.cookies.user) res.clearCookie('user');
  res.render('login', { result: 1 });
})

/* GET home page. */
router.get('/index', function(req, res) {
  if(!req.cookies.user) return res.redirect('/');
  Song.find({streamingYN: false}, (err, song) => {
    if(err) return res.status(500).json({error: err});
    if(!song) return res.render('index', { songlist: null, user: req.cookies.user });
    //console.log(song);
    res.render('index', { songlist: song, user: req.cookies.user });
  });
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

  youtube.search(req.body.title + " " + req.body.singer + " 가사", 1, (err, result) => {
    if(err) { 
      console.log(err)
      return res.redirect("/index");
    }
    var url = "https://www.youtube.com/watch?v=" + result["items"][0]["id"]["videoId"];
    song.url = url;
    var query1 = "https://www.googleapis.com/youtube/v3/videos?id="
    var query2 = result["items"][0]["id"]["videoId"]
    var query3 = "&part=contentDetails&key="
    var query4 = "AIzaSyC78DTwVHsNgyIg2uOyy81EkmUL14KOm7g";
    var query = query1 + query2 + query3 + query4;
    request(query,function(error, response, body){
      if(!error&&response.statusCode==200) { 
        var durationh = parseInt(JSON.parse(body)["items"][0]["contentDetails"]["duration"].split('M')[0].split('PT')[1]) * 60;
        var durationm = parseInt(JSON.parse(body)["items"][0]["contentDetails"]["duration"].split('M')[1].split('S')[0]);
        song.duration = "" + (durationh + durationm);
        song.save((err) => {
          if(err) {
            console.log(err);
            res.json({result: 0});
            return;
          }
          res.redirect("/index");
        });
      }
    });
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

//router.get('/youtube', (req, res) => {  
//  if(!req.cookies.user) return res.redirect('/');
//  Song.find({streamingYN: false}, (err, song) => {
//  if(err) return res.status(500).json({error: err});
//  if(song[0]) return res.render('youtube', { songlist: song });
//  res.render('index', { songlist: null, user: req.cookies.user });
//});
//})

module.exports = router;