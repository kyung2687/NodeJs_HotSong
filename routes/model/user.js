var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    name: String,
    id: String,
    password: String,
    belong: String,
    rank: String,
    task: String,

});

userSchema.method('transform', function() {
    var obj = this.toObject();

    delete obj._id;
 
    return obj;
});

module.exports = mongoose.model('user', userSchema);