'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const {wrap: async} = require('co');
const Tweet = mongoose.model('Tweet');
const assign = Object.assign;
const Twitter = require('twitter');
const R = require('ramda');
const Rx = require('rxjs');
const users = require('./paralament-list.json');
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
const nlu = new NaturalLanguageUnderstandingV1({
    version_date: NaturalLanguageUnderstandingV1.VERSION_DATE_2017_02_27
});

const FEATURE =  {
    concepts: {},
    entities: {},
    keywords: {},
    categories: {},
    emotion: {},
    sentiment: {},
    semantic_roles: {},
};

let userIds = R.map(function (user) {
    return user.id;
}, users.users);

const client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.ACCESS_TOKEN_KEY,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET
});

const nluCredentials = {
    "url": "https://gateway.watsonplatform.net/natural-language-understanding/api",
    "username": process.env.NATURAL_LANGUAGE_UNDERSTANDING_USERNAME,
    "password": process.env.NATURAL_LANGUAGE_UNDERSTANDING_PASSWORD

};


client.stream('statuses/filter', {follow: userIds.toString()}, function (stream) {
    stream.on('data', streamFilter);
    stream.on('error', streamError);
});


function streamFilter(data) {
    if (isReply(data)) {
        return;
    }
    console.log('someone just tweeted!.....' + data.text);
    console.log('let me analyze the sentiment of it....');
    let query = {features: FEATURE, text: data.text};
    nlu.analyze(query, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            console.log('sentiment analyzed: ' + JSON.stringify(result));
            const newTweet = new Tweet({
                user: {id: data.user.id, name: data.user.name, party: "SVP"},
                tweet: {text: data.text, sentiment: {score: result.sentiment.document.score, label: result.sentiment.document.label}}
            });
            newTweet.uploadAndSave(data);
        }
    });

}
function isReply(tweet) {
    if (tweet.retweeted_status
        || tweet.in_reply_to_status_id
        || tweet.in_reply_to_status_id_str
        || tweet.in_reply_to_user_id
        || tweet.in_reply_to_user_id_str
        || tweet.in_reply_to_screen_name)
        return true
}


function streamError(error) {
    console.log(error);
}

/**
 * Load
 */


exports.load = async(function*(req, res, next, id) {
    try {
        req.tweet = yield Tweet.load(id);
        if (!req.tweet) return next(new Error('Tweet not found'));
    } catch (err) {
        return next(err);
    }
    next();
});

/**
 * List
 */

exports.index = async(function*(req, res) {
    const page = (req.query.page > 0 ? req.query.page : 1) - 1;
    const _id = req.query.item;
    const limit = 30;
    const options = {
        limit: limit,
        page: page
    };

    if (_id) options.criteria = {_id};

    const tweets = yield Tweet.list(options);
    const count = yield Tweet.count();

    res.json({
        title: 'Tweets',
        tweets: tweets,
        page: page + 1,
        pages: Math.ceil(count / limit)
    });
});


exports.loadByUser = async(function*(req, res) {
    const page = (req.query.page > 0 ? req.query.page : 1) - 1;
    const userId = req.params.userId;
    const limit = 30;
    const options = {
        limit: limit,
        page: page
    };

    const tweets = yield Tweet.loadByUser(userId);
    const count = yield Tweet.count();

    res.json({
        title: 'Tweets',
        tweets: tweets,
        page: page + 1,
        pages: Math.ceil(count / limit)
    });
});

exports.loadByName = async(function*(req, res) {
    const page = (req.query.page > 0 ? req.query.page : 1) - 1;
    const name = req.params.name.replace(/\+/g, ' ');
    const limit = 30;
    const options = {
        limit: limit,
        page: page
    };

    const tweets = yield Tweet.loadByName(name);
    const count = yield Tweet.count();

    res.json({
        title: 'Tweets',
        tweets: tweets,
        page: page + 1,
        pages: Math.ceil(count / limit)
    });
});

exports.loadByParty = async(function*(req, res) {
    const page = (req.query.page > 0 ? req.query.page : 1) - 1;
    const party = req.params.party;
    const limit = 30;
    const options = {
        limit: limit,
        page: page
    };

    const tweets = yield Tweet.loadByParty(party);
    const count = yield Tweet.count();

    res.json({
        title: 'Tweets',
        tweets: tweets,
        page: page + 1,
        pages: Math.ceil(count / limit)
    });
});


/**
 * New tweet
 */

exports.create = async(function*(req, res) {
    const tweet = new Tweet(req.body.text);
    try {
        yield tweet.uploadAndSave(req.file);
        res.json(tweet);
    } catch (err) {
        res.status(422);
        res.json([err.toString()])
    }
});

/**
 * Edit an article
 */

exports.edit = function (req, res) {
    res.render('articles/edit', {
        title: 'Edit ' + req.article.title,
        article: req.article
    });
};

/**
 * Update article
 */

exports.update = async(function*(req, res) {
    const article = req.article;
    assign(article, only(req.body, 'title body tags'));
    try {
        yield article.uploadAndSave(req.file);
        respondOrRedirect({res}, `/tweets/${article._id}`, article);
    } catch (err) {
        respond(res, 'tweets/edit', {
            title: 'Edit ' + article.title,
            errors: [err.toString()],
            article
        }, 422);
    }
});

/**
 * Delete an article
 */

exports.destroy = async(function*(req, res) {
    yield req.article.remove();

});
