var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var streamingSchema = new Schema({
    str : Boolean,
    song : Object,
});

module.exports = mongoose.model('streaming', streamingSchema);