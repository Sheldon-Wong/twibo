var crypto = require('crypto'),
	//User = require( './user' ),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var CommentSchema = new Schema({
	poster_id: String,
	poster_name: String,
	poster_head: String,
	time: { type: Date, default: Date.now },
	comment: String
});

CommentSchema.virtual( "formatedDate" ).get( function () {
	return this.time.getFullYear() + "-" + (this.time.getMonth()+1) + "-" + this.time.getDate() + " " + 
	this.time.getHours() + ":" + (this.time.getMinutes() < 10 ? '0' + this.time.getMinutes() : this.time.getMinutes())
});

module.exports = mongoose.model('Comment', CommentSchema);