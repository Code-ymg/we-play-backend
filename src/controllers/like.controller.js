import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {APIError} from "../utils/APIError.js"
import {APIResponse} from "../utils/APIResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if(!videoId || !isValidObjectId(videoId)) {
        throw new APIError(500, "There was an internal error!")
    }

    const videoLike = await Like.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "likedBy",
                foreignField: "_id",
                as: "isLiked"
            }
        },
        {
            $addFields: {
                likeToggle: {
                    $cond: {
                        if: {
                            $in: [req.user._id, "$isLiked.likedBy"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                avatar: 1,
                likeToggle: 1,
                email: 1
            }
        }
    ]);

    if(!videoLike) {
        throw new APIError(404, "The video was not found");
    }

    return res
            .status(200)
            .json(
                new APIResponse(
                    200,
                    videoLike[0],
                    "The like was done successfully!"
                )
            );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    if(!commentId || !isValidObjectId(commentId)) {
        throw new APIError(401, "The comment is invalid!");
    }

    const commentLike = await Like.aggregate([
        {
            $match: {
                comment: new mongoose.Types.ObjectId(commentId) 
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "comment",
                foreignField: "_id",
                as: "getComment",
                pipeline: [
                    {
                        $lookup: {
                            from: "videos",
                            localField: "video",
                            foreignField: "_id",
                            as: "videoOwner"
                        }
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "commentOwner"
                        }
                    },
                    {
                        $addFields: {
                            isCommentLiked: {
                                $cond: {
                                    if: {
                                        $in: [req.user.id, "$likes.likedBy"]
                                    },
                                    then: true,
                                    else: false
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            isCommentLiked: 1,
                            comment: 1,
                            video: 1
                        }
                    }
                ]
            }
        }
    ]);

    return res
            .status(200)
            .json(
                new APIResponse(
                    200,
                    commentLike[0].getComment,
                    "The comment toggleFetched Successfully!"
                )
            );

});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    
    if(!tweetId || !isValidObjectId(tweetId)) {
        throw new APIError(401, "The tweet is invalid!");
    }

    const tweetLike = await Like.aggregate([
        {
            $match: {
                tweet: new mongoose.Types.ObjectId(tweetId)
            }
        },
        {
            $lookup: {
                from: "tweets",
                localField: "tweet",
                foreignField: "_id",
                as: "isTweet"
            }
        },
        {
            $addFields: {
                isTweetLiked: {
                    $cond: {
                        if: {
                            $in: [req.user._id, "$tweets.owner"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },{
            $project: {
                isTweetLiked: 1,
                tweet: 1,
                createdAt: 1
            }
        }
    ]);

    if(!tweetLike) {
        throw new APIError(401, "The tweet is not found!");
    }

    return res
            .status(200)
            .json(
                new APIResponse(
                    200,
                    tweetLike[0],
                    "The tweet liked was toggled!"
                )
            );
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const allVideos = await Like.aggregate([
        {
            $match: {
                likedBy: req.user._id
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideos"
            }
        },
        {
            $project: {
                likedVideos: 1,
                createdAt: 1
            }
        }
    ]);
    
    if(!allVideos) {
        throw new APIError(404, "The videos were not found!");
    }

    return res.status(200).json(new APIResponse(200, allVideos[0], "The videos were fetched successfully!"));
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}