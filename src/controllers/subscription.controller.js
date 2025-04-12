import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { APIError } from "../utils/APIError.js";
import { APIResponse } from "../utils/APIResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const toggleSubscription = asyncHandler(async (req, res) => {
    // TODO: toggle subscription
    const {channelId} = req.params;
    
    if(!isValidObjectId(channelId)){
        throw new APIError(400, "Invalid channel id");
    }

    const {userId} = req.user; // subscriber id
    
    const isSubscriber = await User.findByIdAndUpdate(
        userId,
        {
            isSubscribed: !req.user.isSubscribed
        },
        { 
            new: true 
        }
    );

    if(!isSubscriber) {
        throw new APIError(404, "User not found");
    }

    return res
            .status(200)
            .json(
                new APIResponse(
                    200,
                    isSubscriber,
                    "Subscription updated successfully"
                )
            );
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    //TODO to return subscriber list of a channel
    const { channelId } = req.params;

    if(!isValidObjectId(channelId)) {
        throw new APIError(401, "Invalid channelId");
    }

    const subscribers = await Subscription.findById(channelId);

    if(!subscribers) {
        throw new APIError(400, "The subcribers where not found!");
    }

    return res
            .status(200)
            .json(
                new APIResponse(
                    200,
                    subscribers.subscriber,
                    "This are the subscribers of the channel!"
                )
            );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
    //TODO to return channel list to which user has subscribed
    const { subscriberId } = req.params;

    if(!isValidObjectId(subscriberId)) {
        throw new APIError(401, "This is a invalid subscriberId!");
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriberId: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedChannels"
            }
        },
        {
            $project: {
                username: 1,
                avatar: 1,
                subscriberCount: 1,
            }
        }
    ]);

    if(!subscribedChannels) {
        throw new APIError(400, "The channels where not found!");
    }

    return res  
            .status(200)
            .json(
                new APIResponse(
                    200,
                    subscribedChannels[0].subscribedChannels,
                    "The subscribed channels fetched successfully!"
                )
            );
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}