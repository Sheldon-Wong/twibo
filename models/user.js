var crypto = require('crypto'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;


var UserSchema = new Schema({
  name: { type: String, unique: true /*确保唯一*/ },
  password: String,
  email: String,
  gender: String,
  head: { type:String, default: "images/default.png" },
  follow: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  /*
    原理就是：
    fans: [] ==> fans: Array 定义 fans 的数据类型是 数组
    然后 { type： ..., ref: '..'} 就是定义数组每个元素的数据类型 type，同时也是外键，然后指定关联哪个数据模型 (ref)，这是通过 ref 的 _id 实现关联的，而 _id 的数据类型总是 ObjectId，所以 type 这里一般都是 ObjectId/////// done
  */
  fans: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  // 关联用户尸体，获取到这个属性的值是一个字符串
  // 如果要获取到用户尸体的所有器官
  // 就要使用
  // User
      /*.find( 条件 )
      .populate( 'post' )
      .exec()
      .then(function( err, post ) {
        // 这里的 User 里的 post 就是一个有 name 乱七八糟的完整数据，而不是字符串了
      });*/
  posts: [{
    type: Schema.Types.ObjectId, // =.=
    ref: 'Post'
  }]
});

UserSchema.pre('save', function (next) {

  // 密码加密
  var md5 = crypto.createHash('md5'),
      password = md5.update(this.password).digest('hex');

      this.password = password;

  next();
  
});

 // =.=
module.exports = mongoose.model( 'User', UserSchema );