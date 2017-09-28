'use strict';

/**
 * Module dependencies.
 */

const home = require('../app/controllers/home');
const tweets = require('../app/controllers/tweets.controller');
const parlamentController = require('../app/controllers/parlament.controller');
/**
 * Expose
 */

module.exports = function (app) {

    app.get('/', home.index);


// tweet routes
    app.get('/tweets', tweets.index);  //GET http://localhost:3000/tweets

    app.get('/tweets/user/id/:userId', tweets.loadByUser); // GET http://localhost:3000/tweets/user?id=168234077
    app.get('/tweets/user/name/:name', tweets.loadByName);
    app.get('/tweets/user/party/:party', tweets.loadByParty);

    app.post('/tweets', tweets.create);
    app.get('/tweets/:id/edit', tweets.edit);

    //count
    app.get('/tweets/count', tweets.loadTweetsToday);
    app.get('/tweets/users/count', tweets.loadUsersToday);
    app.get('/tweets/count/party', tweets.loadByPartyWeekly);
    app.get('/tweets/count/weekly', tweets.loadMostActiveUsers);


    //mentions
    app.get('/mentions', tweets.loadMentions);
    app.get('/mentions/countLastWeek', tweets.getMentionsCountLastWeek);

    //sentiment
    app.get('/sentiments', tweets.loadSentiments); //mentions?politican-id=1234142


    // trending topics
    app.get('/trending', tweets.loadTrends);
    app.get('/trending/weekly', tweets.loadTrendsWeekly);


    app.get('/councillor/:id', parlamentController.getCouncillor);
    app.get('/faction/:id', parlamentController.getFaction);

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
