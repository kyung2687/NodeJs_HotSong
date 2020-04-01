var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var songSchema = new Schema({
    singer: String,
    title: String,
    author: String,
    up_date: { type: Date, default: Date.now()  },
    streamingYN: { type: Boolean, default: false  },
});

module.exports = mongoose.model('song', songSchema);