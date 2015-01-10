var crypto = require('crypto'),
    fs = require('fs'),
    User = require('../models/user.js'),
    Post = require('../models/post.js'),
    Comment = require('../models/comment.js'),
    mongoose = require('mongoose'),
    ObjectId = mongoose.Types.ObjectId,
    User = mongoose.model('User');

module.exports = function(app) {
  app.get('/', function (req, res) {
    if (!(req && req.session && req.session.user)) {
      Post.getAll(null, function (err, posts) {
        if (err) {
          posts = [];
        }
        console.log('shenma');
        res.render('index', {
          title: '主页',
          user: req.session.user,
          posts: posts,
          success: req.flash('success').toString(),
          error: req.flash('error').toString()
        });
      });
    } else {
      Post.getAll(null, function (err, posts) {
        if (err) {
          posts = [];
        }
        function postFilter (post) {
          return post.name === req.session.user.name;
        }
        function followFilter (post) {
          return req.session.user.follow.some(function (follow) {
            return post.name === follow;
          });
        }
        res.render('index', {
          title: '主页',
          user: req.session.user,
          posts: posts.filter(followFilter),
          postNum: posts.filter(postFilter).length,
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
    var user = new User(req.body);
    user.save();
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
    //生成密码的 md5 值
    var md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');
    //检查用户是否存在
    User.get(req.body.name, function (err, user) {
      if (!user) {
        req.flash('error', '用户不存在!'); 
        return res.redirect('/login');//用户不存在则跳转到登录页
      }
      //检查密码是否一致
      if (user.password != password) {
        req.flash('error', '密码错误!'); 
        return res.redirect('/login');//密码错误则跳转到登录页
      }
      //用户名密码都匹配后，将用户信息存入 session
      req.session.user = user;
      req.flash('success', '登陆成功!');
      res.redirect('/');//登陆成功后跳转到主页
    });
  });

  app.post('/post', checkLogin);
  app.post('/post', function (req, res) {
    var currentUser = req.session.user,
        post = new Post(currentUser.name, req.body.post);
    post.save(function (err) {
      if (err) {
        req.flash('error', err); 
        return res.redirect('/');
      }
      req.flash('success', '发布成功!');
      res.redirect('/');//发表成功跳转到主页
    });
  });

  app.get('/logout', checkLogin);
  app.get('/logout', function (req, res) {
    req.session.user = null;
    req.flash('success', '登出成功!');
    res.redirect('/');//登出成功后跳转到主页
  });

  app.get('/upload', checkLogin);
  app.get('/upload', function (req, res) {
    res.render('upload', {
      title: '文件上传',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });

  app.post('/upload', checkLogin);
  app.post('/upload', function (req, res) {
    for (var i in req.files) {
      if (req.files[i].size == 0){
        // 使用同步方式删除一个文件
        fs.unlinkSync(req.files[i].path);
        console.log('Successfully removed an empty file!');
      } else {
        var target_path = './public/images/' + req.files[i].name;
        // 使用同步方式重命名一个文件
        fs.renameSync(req.files[i].path, target_path);
        console.log('Successfully renamed a file!');
      }
    }
    req.flash('success', '文件上传成功!');
    res.redirect('/upload');
  });

  app.get('/archive', function (req, res) {
    Post.getArchive(function (err, posts) {
      if (err) {
        req.flash('error', err); 
        return res.redirect('/');
      }
      res.render('archive', {
        title: '存档',
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.get('/tags', function (req, res) {
    Post.getTags(function (err, posts) {
      if (err) {
        req.flash('error', err); 
        return res.redirect('/');
      }
      res.render('tags', {
        title: '标签',
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.get('/tags/:tag', function (req, res) {
    Post.getTag(req.params.tag, function (err, posts) {
      if (err) {
        req.flash('error',err); 
        return res.redirect('/');
      }
      res.render('tag', {
        title: 'TAG:' + req.params.tag,
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.get('/links', function (req, res) {
    res.render('links', {
      title: '友情链接',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });

  app.get('/search', function (req, res) {
    Post.search(req.query.keyword, function (err, posts) {
      if (err) {
        req.flash('error', err); 
        return res.redirect('/');
      }
      res.render('search', {
        title: "SEARCH:" + req.query.keyword,
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.get('/u/:name', function (req, res) {
    //检查用户是否存在
    User.get(req.params.name, function (err, user) {
      if (!user) {
        req.flash('error', '用户不存在!'); 
        return res.redirect('/');
      }
      //查询并返回该用户第 page 页的 10 篇文章
      Post.getAll(req.params.name, function (err, posts) {
        if (err) {
          req.flash('error', err); 
          return res.redirect('/');
        }
        res.render('posts', {
          title: user.name + '的主页',
          user: req.session.user,
          puser: user,
          posts: posts,
          success: req.flash('success').toString(),
          error: req.flash('error').toString()
        });
      });
    });
  });

  app.post('/follow', checkLogin);
  app.post('/follow', function (req, res) {
    User.get( req.body.follow + '', function (err, puser ) {
      var user = req.session.user;
      if (err) {
        req.flash('error', err)
        return res.redirect('/');
      }
      user.follow.push(puser.name);
      //puser.fans.push(user.name);

      User.prototype.save.call(user);
      //User.prototype.save.call(puser);

      res.send({status: 0});
    });
  });

  app.get('/u/:name/:day/:title', function (req, res) {
    Post.getOne(req.params.name, req.params.day, req.params.title, function (err, post) {
      if (err) {
        req.flash('error', err); 
        return res.redirect('/');
      }
      res.render('article', {
        title: req.params.title,
        post: post,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.post('/u/:name/:day/:title', function (req, res) {
    var date = new Date(),
        time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + 
               date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
    var md5 = crypto.createHash('md5'),
        email_MD5 = md5.update(req.body.email.toLowerCase()).digest('hex'),
        head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48"; 
    var comment = {
        name: req.body.name,
        head: head,
        email: req.body.email,
        website: req.body.website,
        time: time,
        content: req.body.content
    };
    var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
    newComment.save(function (err) {
      if (err) {
        req.flash('error', err); 
        return res.redirect('back');
      }
      req.flash('success', '留言成功!');
      res.redirect('back');
    });
  });

  app.get('/edit/:name/:day/:title', checkLogin);
  app.get('/edit/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user;
    Post.edit(currentUser.name, req.params.day, req.params.title, function (err, post) {
      if (err) {
        req.flash('error', err); 
        return res.redirect('back');
      }
      res.render('edit', {
        title: '编辑',
        post: post,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.post('/edit/:name/:day/:title', checkLogin);
  app.post('/edit/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user;
    Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function (err) {
      var url = '/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title;
      if (err) {
        req.flash('error', err); 
        return res.redirect(url);//出错！返回文章页
      }
      req.flash('success', '修改成功!');
      res.redirect(url);//成功！返回文章页
    });
  });

  app.get('/remove/:name/:day/:title', checkLogin);
  app.get('/remove/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user;
    Post.remove(currentUser.name, req.params.day, req.params.title, function (err) {
      if (err) {
        req.flash('error', err); 
        return res.redirect('back');
      }
      req.flash('success', '删除成功!');
      res.redirect('/');
    });
  });

  app.get('/reprint/:name/:day/:title', checkLogin);
  app.get('/reprint/:name/:day/:title', function (req, res) {
    Post.edit(req.params.name, req.params.day, req.params.title, function (err, post) {
      if (err) {
        req.flash('error', err); 
        return res.redirect(back);
      }
      var currentUser = req.session.user,
          reprint_from = {name: post.name, day: post.time.day, title: post.title},
          reprint_to = {name: currentUser.name, head: currentUser.head};
      Post.reprint(reprint_from, reprint_to, function (err, post) {
        if (err) {
          req.flash('error', err); 
          return res.redirect('back');
        }
        req.flash('success', '转载成功!');
        var url = '/u/' + post.name + '/' + post.time.day + '/' + post.title;
        //跳转到转载后的文章页面
        res.redirect(url);
      });
    });
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