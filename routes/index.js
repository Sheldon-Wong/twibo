var crypto = require('crypto'),
    fs = require('fs'),
    path = require('path'),
    User = require('../models/user.js'),
    Post = require('../models/post.js'),
    Comment = require('../models/comment.js'),
    mongoose = require('mongoose'),
    ObjectId = mongoose.Types.ObjectId;

module.exports = function(app) {
  app.get('/', function (req, res) {
    if (!(req && req.session && req.session.user)) {
      Post
        // 请求查询全部，因为没有条件
        .find()
        .populate('poster')
        // 对查询结果进行排序
        .sort({time: -1})
        // 输出条数
        .limit( 10 )
        // 但是并没有查询，要调用以下的语句才会执行查询
        // execute the query defined above
        .exec(function ( err, posts ) {
          if (err) {
            posts = [];
          }
      console.log(posts);

          res.render('index', {
            title: '主页',
            user: req.session.user,
            posts: posts,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
          });
        });
    } else {
      var andObjects = [];
      var follow = req.session.user.follow;
      follow.forEach(function( fId ) {
        andObjects.push(fId._id ? fId._id.toString() : fId.toString())
      });
      Post
        .find({poster: { $in: andObjects }})
        .populate('poster')
        .sort({time: -1})
        // 以后用 exec(function( err, result ) {} )  这里结果为空时是一个空对象
        // 不用 exec().then(function( err, result ) {} ) 而这里结果为空时确实一个 undefined 所以模板解析 出错
        .exec(function( err, posts ) {
          if (err) {
            posts = [];
          }
          res.render('index', {
            title: '主页',
            user: req.session.user,
            posts: posts,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
          });
        });
    }
  });

  app.get('/reg', checkNotLogin);
  app.get('/reg', function (req, res) {
    res.render('reg', {
      title: '注册',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });

  app.post('/reg', checkNotLogin);
  app.post('/reg', function (req, res) {
    if (req.body.name == "" || req.body.password == "" || req.body['password-repeat'] == "" || req.body.email == "" || req.body.gender == null ) {
      req.flash('error', '填满每一行信息才能成功注册噢(´・ω・｀)'); 
      return res.redirect('/reg');//返回主册页
    } else {
      var password = req.body.password,
          password_re = req.body['password-repeat'];
      //检验用户两次输入的密码是否一致
      if (password_re != password) {
        req.flash('error', '两次输入的密码不一致!'); 
        return res.redirect('/reg');//返回主册页
      }

      //检查用户名是否已经存在
      var user = new User( req.body ); // 用请求参数直接构建实例，mongoose 会自动把请求里的剑与模型里的剑对应起来


      // 然后保存
      user.save(function( error, registeredUser ) {
        console.log( 'registeredUser', registeredUser );
        if( error ) {
          req.flash('error', error);
          console.log('error', error);
          return res.redirect('/reg');//返回注册页
        }

        if(!registeredUser) {
          req.flash('error', 'no saved');
          return res.redirect('/reg');//返回注册页
        }

        User.update(
          { _id: registeredUser._id },
          { $push: { follow: registeredUser._id }},
          function( err, affectedNumber ) {
            // affectedNumber 返回被更新的记录数量
            if( err  ) {
              console.log( 'error update', 
                error);
              req.flash('error', error);
              return res.redirect('/reg');//返回注册页
            }
            User.findOne({ _id: registeredUser._id },function(err,user){//获得当前用户的信息
              if(err){
                  req.flash('error', err); 
                  return res.redirect('/');
              }
              req.session.user=user;//用户信息存入 session
              req.session.save();//关键是这个，要调用前台才会实时更新
            });
            console.log('req.session.user', req.session.user);
            req.flash('success', '注册成功!');
            res.redirect('/');//注册成功后返回主页
          }
        );
      });
    };
  });

  app.get('/login', checkNotLogin);
  app.get('/login', function (req, res) {
    res.render('login', {
      title: '登录',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    }); 
  });

  app.post('/login', checkNotLogin);
  app.post('/login', function (req, res) {
    console.log('login')
    //生成密码的 md5 值
    var md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');
        console.log('pass', password,req.body.name, req.body.password);

    User.find({}, function(){console.log('...')});
    User
      .findOne({name: req.body.name, password: password})
      .populate('follow')
      .exec(function (err, user) {
        console.log('!!!', user)
        if( !user ) {
          req.flash('error', '用户名 or 密码错了(´・ω・｀)'); 
            return res.redirect('/login');//密码错误则跳转到登录页
        }
        req.session.user = user;
        console.log(user.follow);
          req.flash('success', '登陆成功!');
          res.redirect('/');//登陆成功后跳转到主页
      })
  });

  app.post('/post', checkLogin);
  app.post('/post', function (req, res) {
    if (req.body.post == "") {
      req.flash('error', '你说啥？大声点我听不见╮(╯_╰)╭');
      res.redirect('/');
    } else {
      var currentUser = req.session.user,
          post = new Post(req.body);

      post.poster = currentUser._id; 

      if (req.files.twiPic.size !== 0) {
        var filePath = req.files.twiPic.path;
        var imageUrl = "/images/twibopic/" + path.basename(filePath);
        var newPath = __dirname + "/../public" + imageUrl;

        fs.readFile(filePath, function (err, data) {
          if (err) {
            console.log('err');
            res.send(err);
          }
          fs.writeFile(newPath, data, function (err) {
            if (err) {
              console.log('err');
              res.send(err);
            } else {
              fs.unlink(filePath);
              res.send({uploaded: true});
            }
          });
        });
        post.image = imageUrl;
      } else {
        fs.unlinkSync(req.files.twiPic.path);
        post.image = "";
      }

      post.save(function (err) {
        if (err) {
          req.flash('error', err); 
          return res.redirect('/');
        }
        User.update(
          { _id: currentUser._id },
          { $push: { posts: post._id }},
          function( err, affectedNumber ) {
            // affectedNumber 返回被更新的记录数量
            if( err  ) {
              console.log( 'error update', error);
              req.flash('error', error);
            }
            User.findOne( { _id: currentUser._id }, function (err,user){//获得当前用户的信息
              if(err){
                  req.flash('error', err); 
                  return res.redirect('/');
              }
              req.session.user=user;//用户信息存入 session
              req.session.save();//关键是这个，要调用前台才会实时更新
            });
          }
        );
        req.flash('success', '发布成功!');
        res.redirect('/');//发表成功跳转到主页
      });
    }
  });

  app.get('/logout', checkLogin);
  app.get('/logout', function (req, res) {
    req.session.user = null;
    req.flash('success', '登出成功!');
    res.redirect('/');//登出成功后跳转到主页
  });

  app.get('/avatar', checkLogin);
  app.get('/avatar', function (req, res) {
    res.render('avatar', {
      title: '文件上传',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });

  app.post('/avatar', checkLogin);
  app.post('/avatar', function (req, res) {
    if (req.files.avatar.size !== 0) {
      var filePath = req.files.avatar.path;
      var imageUrl = "/images/avatar/" + path.basename(filePath);
      var newPath = __dirname + "/../public" + imageUrl;

      //filePath为文件路径及名称
      fs.readFile(filePath, function (err, data) {
        if (err) {
          console.log('err');
          res.send(err);
        }
        //newPath为新的文件路径及名称
        fs.writeFile(newPath, data, function (err) {
          if (err) {
            console.log('err');
            res.send(err);
          } else {
            //把文件写入新目录后，使用fs.unlink删除缓存中的文件
            fs.unlink(filePath);
            res.send({uploaded: true});
          }
        });
      });
      User.findOneAndUpdate({ _id: req.session.user._id}, {head: imageUrl}, function (err,user){//获得当前用户的信息
        if(err){
            req.flash('error', err); 
            return res.redirect('/');
        }
        if (req.session.user.head !== "images/default.png") {
          fs.unlinkSync("public/" + req.session.user.head);
        };
        req.session.user=user;//用户信息存入 session
        req.session.save();//关键是这个，要调用前台才会实时更新
      });
      res.redirect('/avatar');
    } else {
      fs.unlinkSync(req.files.avatar.path);
      req.flash('error', '请选择要上传的图片');
      res.redirect('/avatar');
    }
  });

  app.get('/search', checkLogin);
  app.get('/search', function (req, res) {
    if ( req.query.keyword == "" ) {
      res.render('search', {
        title: "SEARCH:" + req.query.keyword,
        user: req.session.user,
        users: [],
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    } else {
      User.find({name: new RegExp( req.query.keyword, "i")}, function (err, users) {
        if (err) {
          req.flash('error', err); 
          return res.redirect('/');
        }
        console.log(users);
        console.log("keyword", req.query.keyword);
        res.render('search', {
          title: "SEARCH:" + req.query.keyword,
          user: req.session.user,
          users: users,
          success: req.flash('success').toString(),
          error: req.flash('error').toString()
        });
      });
    }
  });
  
  app.get('/u/:name', checkLogin);
  app.get('/u/:name', function (req, res) {
    //检查用户是否存在
    User.findOne({name: req.params.name}, function (err, user) {
      if (!user) {
        req.flash('error', '用户不存在!'); 
        return res.redirect('/');
      }
      if (req.session.user) {
        var isFollowed = req.session.user.follow.some(function(fId) {
          return (fId._id ? fId._id.toString() : fId.toString()) === user._id.toString();
        });
      }

      //查询并返回该用户第 page 页的 10 篇文章
      Post
        .find({poster: user._id})
        .populate('poster')
        .sort({time: -1})
        .exec(function (err, posts) {
          if (err) {
            posts = [];
          }
          res.render('user', {
            title: user.name + '的主页',
            puser: user,
            isFollowed: isFollowed,
            user: req.session.user,
            posts: posts,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
          });
        });
    });
  });

  app.get('/u/:name/fans', checkLogin);
  app.get('/u/:name/fans', function (req, res) {
    User.findOne({name: req.params.name}).populate('fans').exec( function (err, user) {
      if (!user) {
        req.flash('error', '用户不存在!'); 
        return res.redirect('/');
      }
      
      console.log('message err',err);
      console.log('message',user.posts.length);
      res.render('fans', {
        title: user.name + '的主页',
        user: req.session.user,
        puser: user,
        posts: user.posts,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.get('/u/:name/follow', checkLogin);
  app.get('/u/:name/follow', function (req, res) {
    User.findOne({name: req.params.name}).populate('follow').exec( function (err, user) {
      if (!user) {
        req.flash('error', '用户不存在!'); 
        return res.redirect('/');
      }
      res.render('follow', {
        title: user.name + '的主页',
        user: req.session.user,
        puser: user,
        posts: user.posts,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.post('/follow', checkLogin);
  app.post('/follow', function (req, res) {
    User.findOne( {name: req.body.follow}).exec(function (err, puser ) {
      var user = req.session.user;
      if (err) {
        req.flash('error', err)
        return res.redirect('/');
      }
      User.update({ _id: user._id }, {$addToSet: {follow: puser._id}},function( err, updated ) {
        if( err || !updated ) {
            console.log( 'error', err, updated );
            return res.redirect('/');
          }
          user.follow.push(puser._id);
          User.update(
            {_id: puser._id},
            {$addToSet: {fans: user._id}},
            function(err, updated) {
              if( err || !updated ) {
                console.log( 'error second' );
              }
            console.log('after follow', req.session.user.follow.length);
            req.session.save();
              console.log('after follow saved', req.session.user.follow.length);
              res.send({status: 0});
            }
          )
      });
    });
  });

  app.post('/unfollow', checkLogin);
  app.post('/unfollow', function (req, res) {
    User.findOne( {name: req.body.unFollow}).exec(function (err, puser ) {
      var user = req.session.user;
      if (err) {
        req.flash('error', err)
        return res.redirect('/');
      }
      User.update({ _id: user._id }, {$pull: {follow: puser._id}},function( err, updated ) {
        if( err || !updated ) {
            console.log( 'error', err, updated );
            return res.redirect('/');
          }
          user.follow.splice( user.follow.indexOf( puser._id.toString() ), 1 );
          User.update(
            {_id: puser._id},
            {$pull: {fans: user._id}},
            function(err, updated) {
              if( err || !updated ) {
                console.log( 'error second' );
              }
            req.session.save();
            res.send({status: 0});
            }
          )
      });
    });
  });

  app.post('/delete', function (req, res) {
    Post.findOneAndRemove({ _id: req.body.twibo }, function (err, twibo) {
      var posts = req.session.user.posts;
      User.update({ _id: req.session.user._id }, {$pull: {posts: twibo._id}},function( err, updated ) {
        if( err || !updated ) {
            console.log( 'error', err, updated );
            return res.redirect('/');
          }
          posts.splice( posts.indexOf( twibo._id.toString() ), 1 );
          if (twibo.image !== "") {
            fs.unlinkSync("public/" + twibo.image);
          };
          req.session.save();
          res.send({status: 0});
      });
    });
  });

  app.post('/retwi', checkLogin);
  app.post('/retwi', function (req, res) {
    Post.findOne({_id: req.body.twibo}).populate('poster').exec(function (err, twibo) {
      var currentUser = req.session.user,
          post = new Post(),
          imgPath = "public/" + twibo.image,
          imageUrl = "/images/twibopic/1" + path.basename(imgPath),
          newPath = __dirname + "/../public" + imageUrl;

      post.poster = currentUser._id; 
      post.post = "from <a href='/u/" + twibo.poster.name + "'>@" + twibo.poster.name + "</a>" 
                  + "</br>" + twibo.post;

      fs.readFile(imgPath, function (err, data) {
        if (err) {
          console.log('err');
          res.send(err);
        }
        fs.writeFile(newPath, data, function (err) {
          if (err) {
            console.log('err');
            res.send(err);
          } else {
            res.send({uploaded: true});
          }
        });
      });

      post.image = imageUrl;

      post.save(function (err) {
        if (err) {
          req.flash('error', err); 
          return res.redirect('/');
        }
        User.update(
          { _id: currentUser._id },
          { $push: { posts: post._id }},
          function( err, affectedNumber ) {
            // affectedNumber 返回被更新的记录数量
            if( err  ) {
              console.log( 'error update', error);
              req.flash('error', error);
            }
            User.findOne( { _id: currentUser._id }, function (err,user){//获得当前用户的信息
              if(err){
                  req.flash('error', err); 
                  return res.redirect('/');
              }
              req.session.user=user;//用户信息存入 session
              req.session.save();//关键是这个，要调用前台才会实时更新
              res.send({status: 0});
            });
          }
        );
      });
    })
  });

  app.get('/twibo/:detail', checkLogin);
  app.get('/twibo/:detail', function (req, res) {
    Post.findOne({_id: req.params.detail}).populate('poster').populate('comment').exec(function (err, twibo) {
      res.render('detail', {
        title: 'twibo详情页',
        user: req.session.user,
        post: twibo,
        comments: twibo.comment.sort(function(a,b){return b.time - a.time;}),
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.post('/comment', checkLogin);
  app.post('/comment', function (req, res) {
    if (req.body.comment == "") {
      req.flash('error', '你说啥？大声点我听不见╮(╯_╰)╭');
      res.redirect('/');
    } else {
      var currentUser = req.session.user,
          comment = new Comment(req.body);

      comment.poster_id = currentUser._id;
      comment.poster_name = currentUser.name;
      comment.poster_head = currentUser.head;

      comment.save(function (err) {
        if (err) {
          req.flash('error', err); 
          return res.redirect('/');
        }
        Post.update(
          { _id: req.body.post },
          { $push: { comment: comment._id }},
          function( err, affectedNumber ) {
            // affectedNumber 返回被更新的记录数量
            if( err  ) {
              console.log( 'error update', error);
              req.flash('error', error);
            }
            req.flash('success', '发布成功!');
            res.redirect('back');//发表成功跳转到主页
          }
        );
      });
    }
  });

  app.use(function (req, res) {
    res.render("404");
  });

  function checkLogin(req, res, next) {
    if (!req.session.user) {
      req.flash('error', '未登录!'); 
      res.redirect('/login');
    }
    next();
  }

  function checkNotLogin(req, res, next) {
    if (req.session.user) {
      req.flash('error', '已登录!'); 
      res.redirect('back');//返回之前的页面
    }
    next();
  }

};