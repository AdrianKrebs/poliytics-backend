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


let userIds = R.map(function (user) {
    return user.id;
}, users.users);

console.log(userIds);

const client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.ACCESS_TOKEN_KEY,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET
});

client.stream('statuses/filter', {follow: userIds.toString()}, function (stream) {
    stream.on('data', streamFilter);
    stream.on('error', streamError);
});


function streamFilter(data) {
    const newTweet = new Tweet({user: data.user.id, text: data.text});
    console.log('someone just tweeted!.....' + data.text);
    newTweet.uploadAndSave(data);
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
    const userId = req.query.id;
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
})

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
