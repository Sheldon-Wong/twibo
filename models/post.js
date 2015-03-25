var crypto = require('crypto'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var PostSchema = new Schema({
	poster: { 
		type: Schema.Types.ObjectId,
		ref: 'User'
	},
	time: { type: Date, default: Date.now },
	post: String,
	image: String,
	comment: [{
		type: Schema.Types.ObjectId,
		ref: 'Comment'
	}]
});

PostSchema.virtual( "formatedDate" ).get( function () {
	return this.time.getFullYear() + "-" + (this.time.getMonth()+1) + "-" + this.time.getDate() + " " + 
	this.time.getHours() + ":" + (this.time.getMinutes() < 10 ? '0' + this.time.getMinutes() : this.time.getMinutes())
});

module.exports = mongoose.model('Post', PostSchema);