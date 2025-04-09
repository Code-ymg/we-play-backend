import mongoose from "mongoose";
import {Video} from "../models/video.model.js";
import {Subscription} from "../models/subscription.model.js";
import {Like} from "../models/like.model.js";
import {APIError} from "../utils/APIError.js";
import {APIResponse} from "../utils/APIResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscribers",
                as: "totalSubs"
            }
        },
        {
            $addFields: {
                totalSubscribers: {
                    $size: "$totalSubs"
                }
            }
        },
        {
            $project: {
                totalSubsribers: 1
            }
        }
    ]);

    if(!subscribers) {
        throw new APIError(500, "Internally Something went wrong in Subs!");
    }

    const totalViews = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "views",
                as: "totalViews"
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "videoOwner",
                pipeline: [
                    {
                        $match: {
                            owner: new mongoose.Types.ObjectId(req.user._id)
                        }
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "allVideos",
                            pipeline: [
                                {
                                    $project: {
                                        videoFile: 1,
                                        thumbnail: 1,
                                        title: 1,
                                        isPublished: 1
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                allViews: {
                    $size: "$totalViews"
                }
            }
        },
        {
            $project: {
                allViews: 1
            }
        }
    ]);

    if(!totalViews) {
        throw new APIError(500, "Internally Something went wrong in views!");
    }

    const totalLikes = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "likes",
                as: "allLikes"
            }
        },
        {
            $addFields: {
                totalLikes: {
                    $size: "$allLikes"
                }
            }
        }
    ]);

    if(!totalLikes) {
        throw new APIError(500, "Internally Something went wrong in likes!");
    }

    return res
            .status(200)
            .json(
                new APIResponse(
                    200,
                    {
                        totalLikes: totalLikes[0].allLikes,
                        totalViews: totalViews[0].totalViews,
                        subscribers: subscribers[0].totalSubs,
                    },
                    "Dashboard data fetched succesfully!"
                )
            );
});

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const ownerVideos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "videoOwner",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "allVideos",
                            pipeline: [
                                {
                                    $project: {
                                        videoFile: 1,
                                        thumbnail: 1,
                                        title: 1,
                                        isPublished: 1
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ]);

    if(!ownerVideos) {
        throw new APIError(500, "The videos were not fetched!")
    }

    return res
            .status(200)
            .json(
                new APIResponse(
                    200,
                    ownerVideos[0].allVideos,
                    "The videos were fetched succesfully!"
                )
            )
})

export {
    getChannelStats, 
    getChannelVideos
}