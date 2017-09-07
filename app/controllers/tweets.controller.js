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

const FEATURE = {
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


client.stream('statuses/filter', {follow: userIds.toString()}, function (stream) {
    stream.on('data', streamFilter);
    stream.on('error', streamError);
});

function streamFilter(data) {
    console.log('someone just tweeted!.....' + data.text);
    console.log('let me analyze the sentiment of it....');

    if (isReply(data)) {
        return;
    }
    let query = {features: FEATURE, text: data.text};
    nlu.analyze(query, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            console.log('sentiment analyzed: ' + JSON.stringify(result));
            const newTweet = new Tweet({
                user: {id: data.user.id, name: data.user.name, party: "SVP"},
                tweet: {
                    text: data.text,
                    sentiment: {score: result.sentiment.document.score, label: result.sentiment.document.label},
                    hashtags: R.map((hashtag) => hashtag.text, data.entities.hashtags)
                }
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

exports.loadMentions = function (req, res) {
    //
}

// Deprecated
// Call into Twitter Search API
// https://api.twitter.com/1.1/search/tweets.json?q=%40cedricwermuth&count=10
const _loadMentions = function (req, res) {
    const screenName = req.query.name;
    client.get('search/tweets', {
        q: '@' + screenName,
        count: 100
    }, function (error, tweets, response) {
        let mentions = R.map((status) => {
            return {
                id: status.id,
                created_at: status.created_at,
                sender: {
                    id: status.user.id,
                    screen_name: status.user.screen_name
                },
            };
        }, tweets.statuses);
        console.log(JSON.stringify(mentions));
        res.json(mentions);
    });
};


//average
// welche Zeiteinheit für Diagramm? average per week?
exports.loadSentiment = async(function*(req, res) {
    let sentiment = yield Tweet.loadSentimentByParty("SVP");
    sentiment = sentiment.map((s) => {
        let positive = 0;
        let negative = 0;
        let label = R.path(['tweet','sentiment','label'],s);
        if (label === 'positive') {
            positive += s.tweet.sentiment.score
        } else if (label === 'negative') {
            negative += s.tweet.sentiment.score
        }
        return {positive: positive, negative: negative}
    });
    res.json({
        positive: R.mean(R.map((ele)=> ele.positive,sentiment)),
        negative: R.mean(R.map((ele)=> ele.negative,sentiment))
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
