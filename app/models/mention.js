'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MentionSchema = new Schema({
    tweetId: { type: Number },
    twitterUserId: { type: Number },
    createdAt: { type: Date }
});

MentionSchema.path('tweetId').required(true, 'tweetId may not be null!');
MentionSchema.path('twitterUserId').required(true, 'twitterUserId may not be null!');
MentionSchema.path('createdAt').required(true, 'createdAt may not be null');

MentionSchema.methods = {
    uploadAndSave: function () {
        const error = this.validateSync();
        if (error && error.toString()) throw new Error(error.toString());
        return this.save();
    }
};

mongoose.model('Mention', MentionSchema);