'use strict';

const mongoose = require('mongoose');

const MentionSchema = new mongoose.Schema({
    tweetId: { type: String },
    twitterUserId: { type: String },
    createdAt: { type: Date }
});

MentionSchema.path('tweetId').required(true, 'tweetId may not be null!');
MentionSchema.path('twitterUserId').required(true, 'twitterUserId may not be null!');
MentionSchema.path('createdAt').required(true, 'createdAt may not be null');

MentionSchema.methods = {
    uploadAndSave: function () {
        const error = this.validateSync();
        if (error && error.toString()) {
            throw new Error(error.toString());
        } else {
            return this.save();
        }
    }
};

MentionSchema.statics = {
    findByQuery: function (query) {
        console.log('Querying MentionSchema with query: ' + JSON.stringify(query));
        return this.find(query).exec();
    },

    getQueryById: function (id) {
        return { twitterUserId: id };
    },

    getQueryByIds: function (ids) {
        return { twitterUserId: { $in: ids } };
    }
};

mongoose.model('Mention', MentionSchema);