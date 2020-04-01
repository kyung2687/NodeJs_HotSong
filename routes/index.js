var express = require('express');
var router = express.Router();

var Song = require('./model/song');

/* GET home page. */
router.get('/', function(req, res, next) {
  Song.find({streamingYN: false}, (err, song) => {
    if(err) return res.status(500).json({error: err});
    console.log(song);
    res.render('index', { songlist: song });
  })
});

router.post('/save', function(req, res) {
  var song = new Song();

  song.singer = req.body.singer;
  song.title = req.body.title;

  song.save((err) => {
    if(err) {
      console.log(err);
      res.json({result: 0});
      return;
    }
    res.json({result: 1});
  });
});

router.post('/streaming', (req, res) => {
  console.log('3');
  Song.find(req.param.title, (err,song) => {
    if(err) return res.status(500).json({ error: 'database failure' });
    
    song.streamingYN = true;

    song.save((err) => {
      if(err) res.status(500).json({error: 'failed to update'});
      res.json({message: 'song updated'});
    })
  })
})

module.exports = router;