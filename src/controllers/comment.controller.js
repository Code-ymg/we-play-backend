import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { APIError } from "../utils/APIError.js";
import { APIResponse } from "../utils/APIResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
    // TODO: get all comments for a video
    const {videoId} = req.params;
    const {page = 1, limit = 10} = req.query;

    if(!videoId) {
        throw new APIError(404, "VideoID not found!");
    }

    const comments = await Comment.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "allComments",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        }
    ])


    if(!comments) {
        throw new APIError(500, "Something went wrong while fetching comments!");
    }

    const options = {
        page,
        limit
    }

    const result = await Comment
    .aggregatePaginate(comments, options, (err, results) => {
        if(err) {
            throw new APIError(400, err);
        } else {
            console.log(results);
            return results;
        }
    })

    if(!result) {
        throw new APIError(400, "the callback didnt worked");
    }

    return res
            .status(200)
            .json(
                new APIResponse(
                    200,
                    {
                        result
                    },
                    "The comments are fetched successfully!"
                )
            );
});

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {comment} = req.body;
    const {videoId} = req.params;

    if(comment === "") {
        throw new APIError(400, "Please enter a comment!");
    }

    const newComment = await Comment.create({
        content: comment,
        video: videoId,
        owner: req.user._id
    });

    const addedComment = await Comment.findById(newComment._id);
    
    if(!addedComment) {
        throw new APIError(400, "something went wrong in creating comment");
    }
    
    return res
            .status(200)
            .json(
                new APIResponse(
                    200,
                    addedComment,
                    "New comment added"
                )
            );
});

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params;
    const {updatedComment} = req.body;

    if(updatedComment === "") {
        throw new APIError(400, "Please enter a proper comment!");
    }

    if(!commentId) {
        throw new APIError(401, "No comment was found!");
    }

    const comment = await Comment.findById(commentId);

    if(!comment) {
        throw new APIError(400, "The comment was not found!");
    }

    comment.content = updatedComment;
    comment.save({validateBeforeSave: false});

    return res
    .status(200)
    .json(
        new APIResponse(
            200,
            {},
            "Comment updated successfully!"
        )
    );
});

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params;

    if(!commentId) {
        throw new APIError(400, "The comment was not found!");
    }

    const comment = await Comment.findByIdAndDelete(commentId);

    if(!comment) {
        throw new APIError(500, "Somethig went wrong in finding comment!");
    }

    return res
    .status(200)
    .json(
        new APIResponse(
            200,
            comment,
            "Comment updated successfully!"
        )
    );
});

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}