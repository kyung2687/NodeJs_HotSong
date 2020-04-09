var express = require('express');
var router = express.Router();

var Song = require('./model/song');
var User = require('./model/user');

var Youtube = require('youtube-node');
var youtube = new Youtube();

var cheerio = require('cheerio');
var request = require('request');

youtube.setKey('AIzaSyC78DTwVHsNgyIg2uOyy81EkmUL14KOm7g');

router.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/index');
  res.render('login', { result: 1 });
})

function formatdate(date) {
  var year = date.getFullYear();
  var month = date.getMonth() + 1
  var day = date.getDate();
  if (month < 10) {
    month = "0" + month;
  }
  if (day < 10) {
    day = "0" + day;
  }
  return year + "-" + month + "-" + day
}
function formatdate2(date) {
  var year = date.getFullYear();
  var month = date.getMonth() + 1
  var day = date.getDate();
  if (month < 10) {
    month = "0" + month;
  }
  if (day < 10) {
    day = "0" + day;
  }
  return year + month + day
}
/* GET home page. */
router.get('/index', function (req, res) {
  if (!req.cookies.user) return res.redirect('/');
  if (!req.session.user) return res.redirect('/');
  Song.find({ streamingYN: false }, (err, song) => {
    if (err) return res.status(500).json({ error: err });
    if (!song) return res.render('index', { songlist: null, user: req.cookies.user });
    //console.log(song);
    res.render('index', { songlist: song, user: req.cookies.user });
  });
});

router.get('/songsin', (req, res) => {
  if (!req.cookies.user) return res.redirect('/');
  if (!req.session.user) return res.redirect('/');
  res.render('songsin', { title: req.query.title, singer: req.query.singer, user: req.cookies.user, image: req.query.image });
})

router.post('/save', function (req, res) {
  if (!req.cookies.user) return res.redirect('/');
  if (!req.session.user) return res.redirect('/');
  var song = new Song();

  song.title = req.body.title;
  song.singer = req.body.singer;
  song.image = req.body.image;
  song.name = req.body.name;
  song.task = req.body.task;

  youtube.search(req.body.title + " " + req.body.singer + " 가사", 1, (err, result) => {
    if (err) {
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
    request(query, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var durationh = parseInt(JSON.parse(body)["items"][0]["contentDetails"]["duration"].split('M')[0].split('PT')[1]) * 60;
        var durationm = parseInt(JSON.parse(body)["items"][0]["contentDetails"]["duration"].split('M')[1].split('S')[0]);
        song.duration = "" + (durationh + durationm);
        date = new Date(Date.now())
        song.up_date = formatdate(date)
        song.save((err) => {
          if (err) {
            console.log(err);
            res.json({ result: 0 });
            return;
          }
          res.redirect("/index");
        });
      }
    });
  });
});

router.post('/streaming', (req, res) => {
  if (!req.cookies.user) return res.redirect('/');
  if (!req.session.user) return res.redirect('/');
  Song.findOne({ title: req.body.title, streamingYN: false }, function (err, song) {
    if (err) return res.status(500).json({ error: 'database failure' });
    if (!song) return res.status(404).json({ error: 'song not found' });

    song.streamingYN = true;
    song.up_date = new Date(Date.now() + (540 * 60 * 1000));

    song.save(function (err) {
      if (err) res.status(500).json({ error: 'failed to update' });
      res.redirect("/index");
    });
  });
});

router.get('/streamed', function (req, res, next) {
  if (!req.cookies.user) return res.redirect('/');
  if (!req.session.user) return res.redirect('/');
  Song.find({ streamingYN: true }, (err, song) => {
    if (err) return res.status(500).json({ error: err });
    res.render('streaming', { songlist: song });
  })
});

router.post('/login', (req, res) => {

  User.findOne({ id: req.body.id }, (err, user) => {
    if (err) return res.status(500).json({ error: 'database failure' });
    if (!user) { return res.render('login', { result: 2 }); }
    if (user.password == req.body.password) {
      res.cookie('user', user);
      req.session.user = user;
      res.redirect('/index');
    } else {
      res.render('login', { result: 0 });
    }
  })
})

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
})

router.get('/signup', (req, res) => {
  res.render('signup', { result: 0 });
})

router.post('/signup', (req, res) => {
  var user = new User();

  user.name = req.body.name;
  user.id = req.body.id;
  user.password = req.body.password;
  user.task = req.body.task;

  User.findOne({ id: req.body.id }, function (err, aluser) {
    if (err) return res.status(500).json({ error: 'database failure' });
    if (aluser) { return res.render('signup', { result: 2 }); }
    user.save((err) => {
      if (err) {
        console.log(err);
        res.json({ result: 1 });
        return;
      }
      res.redirect("/");
    });
  });
})

router.get('/top200', (req, res) => {
  if (!req.cookies.user) return res.redirect('/');
  if (!req.session.user) return res.redirect('/');
  url = "https://www.genie.co.kr/chart/top200?ditc=D&ymd="+formatdate2(new Date(Date.now()))+"&hh="+new Date(Date.now()).getHours()+"&rtm=Y&pg="
  var resultArr = [];
  request(url + "1", function (error, response, body) {
    const $ = cheerio.load(body);
    let titleArr = $("#body-content > div.newest-list > div > table > tbody > tr > td.info > a.title.ellipsis")
    let singerArr = $("#body-content > div.newest-list > div > table > tbody > tr > td.info > a.artist.ellipsis")
    let imageArr = $("#body-content > div.newest-list > div > table > tbody > tr > td > a > img")
    for (let i = 0; i < titleArr.length; i++) {
      var data = new Object();
      data.image = imageArr[i].attribs.src
      data.title = titleArr[i].children[0].data.trim()
      data.singer = singerArr[i].children[0].data.trim()

      resultArr.push(data)
    }
    request(url + "2", function (error, response, body) {

      const $ = cheerio.load(body);
      let titleArr = $("#body-content > div.newest-list > div > table > tbody > tr > td.info > a.title.ellipsis")
      let singerArr = $("#body-content > div.newest-list > div > table > tbody > tr > td.info > a.artist.ellipsis")
      let imageArr = $("#body-content > div.newest-list > div > table > tbody > tr > td > a > img")

      for (let i = 0; i < titleArr.length; i++) {
        var data = new Object();

        data.image = imageArr[i].attribs.src
        data.title = titleArr[i].children[0].data.trim()
        data.singer = singerArr[i].children[0].data.trim()

        resultArr.push(data)
      } 
      request(url + "3", function (error, response, body) {

        const $ = cheerio.load(body);
        let titleArr = $("#body-content > div.newest-list > div > table > tbody > tr > td.info > a.title.ellipsis")
        let singerArr = $("#body-content > div.newest-list > div > table > tbody > tr > td.info > a.artist.ellipsis")
        let imageArr = $("#body-content > div.newest-list > div > table > tbody > tr > td > a > img")

        for (let i = 0; i < titleArr.length; i++) {
          var data = new Object();

          data.image = imageArr[i].attribs.src
          data.title = titleArr[i].children[0].data.trim()
          data.singer = singerArr[i].children[0].data.trim()

          resultArr.push(data)
        } 
        request(url + "4", function (error, response, body) {

          const $ = cheerio.load(body);
          let titleArr = $("#body-content > div.newest-list > div > table > tbody > tr > td.info > a.title.ellipsis")
          let singerArr = $("#body-content > div.newest-list > div > table > tbody > tr > td.info > a.artist.ellipsis")
          let imageArr = $("#body-content > div.newest-list > div > table > tbody > tr > td > a > img")

          for (let i = 0; i < titleArr.length; i++) {
            var data = new Object();

            data.image = imageArr[i].attribs.src
            data.title = titleArr[i].children[0].data.trim()
            data.singer = singerArr[i].children[0].data.trim()

            resultArr.push(data)
          }
          res.render('top200', {songlist: resultArr})
        });
      });
    });
  });
})

router.post('/search', (req, res) => {    
  if (!req.cookies.user) return res.redirect('/');
  if (!req.session.user) return res.redirect('/');
  var url = "https://www.genie.co.kr/search/searchSong?Coll=sAll&query=" + encodeURI(encodeURIComponent(req.body.content)) + "&page=1&pagesize=30";
  var resultArr = [];
  console.log(url)
  request(url, function (error, response, body) {
    const $ = cheerio.load(body);
    
    let titleArr = $("#body-content > div.search_song > div.music-list-wrap > div.music-list-wrap > table > tbody > tr > td.info > a.title.ellipsis")
    let singerArr = $("#body-content > div.search_song > div.music-list-wrap > div.music-list-wrap > table > tbody > tr > td.info > a.artist.ellipsis")
    let imageArr = $("#body-content > div.search_song > div.music-list-wrap > div.music-list-wrap > table > tbody > tr > td > a > img")
    var name=""

    for (let i = 0; i < titleArr.length - 1; i++) {
      var data = new Object();
      var name = ""
      for(var j = 0; j < singerArr[i].children.length; j++) {
        if(singerArr[i].children[j].type == "text") {
          name = name + singerArr[i].children[j].data.trim()
        } else if(singerArr[i].children[j].type == "tag") {
          name = name + singerArr[i].children[j].children[0].data.trim()
        }
      }
      data.image = "//image.genie.co.kr" + imageArr[i].attribs.src
      if(typeof(titleArr[i].attribs.title) == "undefined")
        data.title = ""
      else data.title = titleArr[i].attribs.title.trim()
      data.singer = name
    
      resultArr.push(data)
    }
    res.render('search', {songlist: resultArr})
  });
})

router.post('/delsong', (req, res) => {
  Song.deleteOne({name: req.body.name, title: req.body.title, singer: req.body.singer}, (err) => {
    return res.redirect('/index');
  })
})

router.post('/showuserlist', (req, res) => {
  Song.find({ name: req.body.name, task: req.body.task }, (err, song) => {
    if (err) return res.status(500).json({ error: err });
    if (!song) return res.redirect('/index');
    res.render('userlist', { songlist: song, name: req.body.name });
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