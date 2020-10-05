var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var streamingSchema = new Schema({
    str : Boolean,
    song : Object,
    content : String,
    corona : String,
});

module.exports = mongoose.model('streaming', streamingSchema);