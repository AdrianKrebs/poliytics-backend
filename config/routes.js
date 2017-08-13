'use strict';

/**
 * Module dependencies.
 */

const home = require('../app/controllers/home');
const tweets = require('../app/controllers/tweets');
/**
 * Expose
 */

module.exports = function (app, passport) {

  app.get('/', home.index);


    // tweet routes
    app.param('id', tweets.load);
    app.get('/tweets', tweets.index);  //GET http://localhost:3000/tweets
    app.get('/tweets/user', tweets.loadByUser); // GET http://localhost:3000/tweets/user?id=168234077
    app.post('/tweets', tweets.create);
    //app.get('/tweets/new', tweets.new);
    //app.get('/tweets/:id', tweets.show);
    app.get('/tweets/:id/edit', tweets.edit);



  /**
   * Error handling
   */

  app.use(function (err, req, res, next) {
    // treat as 404
    if (err.message
      && (~err.message.indexOf('not found')
      || (~err.message.indexOf('Cast to ObjectId failed')))) {
      return next();
    }
    console.error(err.stack);
    // error page
    res.status(500).render('500', { error: err.stack });
  });

  // assume 404 since no middleware responded
  app.use(function (req, res, next) {
    res.status(404).render('404', {
      url: req.originalUrl,
      error: 'Not found'
    });
  });
};
