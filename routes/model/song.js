var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var songSchema = new Schema({
    singer: String,
    title: String,
    name: String,
    belong: String,
    rank: String,
    up_date: { type: Date, default: Date.now()  },
    streamingYN: { type: Boolean, default: false  },
});

module.exports = mongoose.model('song', songSchema);