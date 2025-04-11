import mongoose, { isValidObjectId } from "mongoose";
import {Tweet} from "../models/tweet.model.js";
import {User} from "../models/user.model.js";
import {APIError} from "../utils/APIError.js";
import {APIResponse} from "../utils/APIResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
        throw new APIError(404, "User not found");
    }
    
    if (!content || content.trim() === "") {
        throw new APIError(404, "Content is required");
    }

    if (!isValidObjectId(userId) || !userId) {
        throw new APIError(400, "Invalid user ID");
    }

    const tweet = await Tweet.create({
        owner: userId,
        content,
    })

    if(!tweet) {
        throw new APIError(500, "Failed to create tweet");
    }

    return res.status(201).json(
        new APIResponse(
            201,
            tweet,
            "Tweet created successfully", 
        )
    );
});

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const userId = req.params.userId;

    if (!isValidObjectId(userId) || !userId) {
        throw new APIError(400, "Invalid user ID");
    }

    
    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "allTweets",  
            }
        },
        {
            $unwind: "$allTweets"
        },
        {
            $project: {
                _id: 1,
                content: 1,
                "allTweets.username": 1,
                "allTweets.email": 1
            }
        }
    ]);

    if (!tweets || tweets.length === 0) {
        throw new APIError(404, "No tweets found for this user");
    }

    return res.status(200).json(
        new APIResponse(
            200,
            tweets,
            "Tweets fetched successfully",
        )
    );
});

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {updatedContent} = req.body;
    const tweetId = req.params;

    if(!tweetId || !isValidObjectId(tweetId)) {
        throw new APIError(400, "The tweetId is Invalid!");
    }

    if(!updatedContent || updatedContent.trim() === "") {
        throw new APIError(400, "The tweet content is required!");
    }

    const newTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            content: updatedContent
        },
        {
            new: true
        }
    );

    if(!newTweet) {
        throw new APIError(404, "Tweet not found!");
    }

    return res.status(200).json(
        new APIResponse(
            200,
            newTweet,
            "Tweet updated successfully",
        )
    );
});

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const tweetId = req.params;

    if(!tweetId || !isValidObjectId(tweetId)) {
        throw new APIError(400, "The tweetId is Invalid!");
    }

    
    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

    if(!deletedTweet) {
        throw new APIError(404, "Tweet not found!");
    }

    return res.status(200).json(
        new APIResponse(
            200,
            deletedTweet,
            "Tweet deleted successfully",
        )
    );
});

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}