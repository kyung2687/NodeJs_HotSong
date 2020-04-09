var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var songSchema = new Schema({
    singer: String,
    title: String,
    name: String,
    task: String,
    url: String,
    image: String,
    duration: String,
    up_date: { type: Date, default: Date.now()  },
    streamingYN: { type: Boolean, default: false  },
});

module.exports = mongoose.model('song', songSchema);