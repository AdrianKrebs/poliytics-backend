'use strict';

/**
 * Module dependencies.
 */

const home = require('../app/controllers/home');
const tweets = require('../app/controllers/tweets');
/**
 * Expose
 */

module.exports = function (app) {

    app.get('/', home.index);


// tweet routes
    app.param('id', tweets.load);
    app.get('/tweets', tweets.index);  //GET http://localhost:3000/tweets
    app.get('/tweets/count'); // count of tweets, optional query params to search for party or specific politican

    app.get('/tweets/user/id/:userId', tweets.loadByUser); // GET http://localhost:3000/tweets/user?id=168234077
    app.get('/tweets/user/name/:name', tweets.loadByName);
    app.get('/tweets/user/party/:party', tweets.loadByParty);

    app.post('/tweets', tweets.create);
    app.get('/tweets/:id/edit', tweets.edit);

    //mentions
    app.get('/mentions', tweets.loadMentions);

    //sentiment
    app.get('/sentiment', tweets.loadSentiment);

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
        res.status(500).render('500', {error: err.stack});
    });

// assume 404 since no middleware responded
    app.use(function (req, res, next) {
        res.status(404).render('404', {
            url: req.originalUrl,
            error: 'Not found'
        });
    });

};
