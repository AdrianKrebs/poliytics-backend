'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const {wrap: async} = require('co');
const Tweet = mongoose.model('Tweet');
const Mention = mongoose.model('Mention');
const assign = Object.assign;
const Twitter = require('twitter');
const R = require('ramda');
const users = require('../data/id-name-party-mapping.json');
// const users = require('../data/paralament-list.json');
const userIds = R.map((user) => user.id, users);
const twitterScreenNames = R.map((user) => user.name, users);
const twitterScreenNamesAsSet = new Set(twitterScreenNames);
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
const nlu = new NaturalLanguageUnderstandingV1({
    version_date: NaturalLanguageUnderstandingV1.VERSION_DATE_2017_02_27
});

const FEATURE = {
    entities: {},
    keywords: {},
    sentiment: {},
};


const client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.ACCESS_TOKEN_KEY,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET
});


client.stream('statuses/filter', {follow: userIds.toString()}, function (stream) {
    console.log('following: ' + userIds);
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
                user: {id: data.user.id_str, name: data.user.name, party: getPartyById(data.user.id_str)},
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

function getPartyById(id) {
    return R.find((ele) => ele.id === id)(users).party;
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

exports.loadTweetsToday = async(function*(req, res) {
    const count = yield Tweet.loadTweetsToday();

    res.json({
        tweets: count
    });
});

exports.loadUsersToday = async(function*(req, res) {
    const users = yield Tweet.loadUsersToday();
    res.json({
        users: users.length
    });
});

exports.loadMostActiveUsers = async(function*(req, res) {
    const counterPerUser = yield Tweet.loadMostActiveUsers();
    res.json({
        users: counterPerUser
    });
});


exports.loadByPartyWeekly = async(function*(req, res) {
    const svp = yield Tweet.loadByPartyWeekly("SVP");
    const sp = yield Tweet.loadByPartyWeekly("SP");
    const fdp = yield Tweet.loadByPartyWeekly("FDP");
    const cvp = yield Tweet.loadByPartyWeekly("CVP");
    const glp = yield Tweet.loadByPartyWeekly("GLP");
    const bdp = yield Tweet.loadByPartyWeekly("BDP");
    const gps = yield Tweet.loadByPartyWeekly("GPS");
    const evp = yield Tweet.loadByPartyWeekly("EVP");
    const total = svp.length + sp.length + fdp.length + cvp.length + glp.length + gps.length + evp.length + bdp.length;
    res.json({
        tweetsPerParty: {
            parties: {
                "SVP": svp.length,
                "SP": sp.length,
                "FDP": fdp.length,
                "CVP": cvp.length,
                "GLP": glp.length,
                "GPS": gps.length,
                "EVP": evp.length,
                "BDP": bdp.length
            }, total: total
        }
    });
});


client.stream('statuses/filter', {track: twitterScreenNames.toString()}, function (trackingStream) {
    trackingStream.on('data', trackingFilter);
    trackingStream.on('error', trackingError);
});

function trackingFilter(tweet) {
    console.log('Got something through tracking');
    const politicianMentions = R.filter((mention) => twitterScreenNamesAsSet.has(mention.screen_name), tweet.entities.user_mentions);
    for (let mention of politicianMentions) {
        const aMention = new Mention({
            tweetId: tweet.id_str,
            twitterUserId: mention.id_str,
            createdAt: tweet.created_at
        });
        console.log('Mention found: ' + aMention);
        aMention.uploadAndSave();
    }
}

function trackingError(error) {
    console.log('Error during reception on track stream: ' + error);
}

exports.loadMentions = async(function*(req, res) {
    let mentions = yield Mention.findByQuery(createQuery(req.query));
    res.json({
        mentions: mentions
    });
});

function createQuery(urlQuery) {
    if (urlQuery.party != undefined) {
        return Mention.getQueryByIds(idsForParty(urlQuery.party.toUpperCase()));
    } else if (urlQuery.politicianId != undefined) {
        return Mention.getQueryById(urlQuery.politicianId);
    } else {
        return {};
    }
}

function idsForParty(party) {
    return R.map((politician) => politician.id, R.filter((politician) => politician.party === party, users));
}

//average
// welche Zeiteinheit für Diagramm? average per week?
exports.loadSentiment = async(function*(req, res) {
    let sentiment = yield Tweet.loadSentimentByParty("SVP");
    sentiment = sentiment.map((s) => {
        let positive = 0;
        let negative = 0;
        let label = R.path(['tweet', 'sentiment', 'label'], s);
        if (label === 'positive') {
            positive += s.tweet.sentiment.score
        } else if (label === 'negative') {
            negative += s.tweet.sentiment.score
        }
        return {positive: positive, negative: negative}
    });
    res.json({
        positive: R.mean(R.map((ele) => ele.positive, sentiment)),
        negative: R.mean(R.map((ele) => ele.negative, sentiment))
    });
});

function extractTrendingHashtags(tweets) {
    let trending = R.chain((ele) => ele.tweet.hashtags, tweets);
    trending = R.map((ele) => R.toUpper(ele), trending);
    console.log(trending);
    let frequency = R.countBy((ele) => ele)(trending);
    console.log(frequency);
    let result = R.sortBy((element) => -frequency[element], R.uniq(trending));
    return result;
}
exports.loadTrends = async(function*(req, res) {
    let tweets;
    if (req.query.party) {
        tweets = yield Tweet.loadTrendingHashtagsByParty(req.query.party.toUpperCase());
    } else if (req.query.politicianId) {
        tweets = yield Tweet.loadTrendingHashtagsByUser(req.query.party.toUpperCase());
    } else {
        tweets = yield Tweet.loadTrendingHashtags();
    }
    let result = extractTrendingHashtags(tweets);
    res.json({
        trending: result
    });
});


exports.loadTrendsWeekly = async(function*(req, res) {
    let tweets = yield Tweet.loadTrendingHashtagsWeekly();
    let result = extractTrendingHashtags(tweets);
    res.json({
        trending: result
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
