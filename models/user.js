var mongodb = require('./db')
  , crypto = require('crypto')
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema
  ;


var UserSchema = new Schema({
  name: String,
  password: String,
  email: String,
  head: { type:String, default: "images/default.png" },
  follow: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  fans: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  followNum: Number,
  fansNum: Number
});


UserSchema.pre('save', function(next) {

  console.log( 'pre save a user', this );

  next();//忘了加这个。。。。。
  
});


mongoose.model('User', UserSchema);