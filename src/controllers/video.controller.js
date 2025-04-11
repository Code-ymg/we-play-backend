import mongoose, {isValidObjectId} from "mongoose";
import {Video} from "../models/video.model.js";
import {User} from "../models/user.model.js";
import {APIError} from "../utils/APIError.js";
import {APIResponse} from "../utils/APIResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {uploadCloudianry, deleteFromCloudinary} from "../utils/cloudinary.js";


const getAllVideos = asyncHandler(async (req, res) => {
    //TODO: get all videos based on query, sort, pagination
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    
    if(!userId || !isValidObjectId(userId)) {
        throw new APIError(404, "UserID not found!");
    }
    
    if(!query) {
        throw new APIError(404, "Query not found!");
    }

    const owner = await User.findById(userId);
    
    if (!owner) {
        throw new APIError(404, "User not found!");
    }

    const videos = await Video.find(query).aggregate([
                                {
                                    $match: { 
                                        owner: new mongoose.Types.ObjectId(userId) 
                                    }
                                },
                                {
                                    $lookup: {
                                        from: "users",
                                        localField: "owner",
                                        foreignField: "_id",
                                        as: "ownerDetails",
                                        pipeline: [
                                            {
                                                $project: {
                                                    username: 1,
                                                    avatar: 1
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    $unwind: "$ownerDetails"
                                },
                                {
                                    $sort: {
                                        [sortBy]: sortType === "desc" ? -1 : 1
                                    }
                                },
                                {
                                    $skip: (page - 1) * limit
                                },
                                {
                                    $limit: limit
                                },
                                {
                                    $project: {
                                        title: 1,
                                        description: 1,
                                        videoFile: 1,
                                        thumbnail: 1,
                                        ownerDetails: 1,
                                        createdAt: 1,
                                        updatedAt: 1
                                    }
                                }
                            ]);
    
                            
    if (videos.length === 0) {
        throw new APIError(404, "No videos found for the given query.");
    }
    
    return res
            .status(200)
            .json(
                new APIResponse(
                    200,
                    videos,
                    "Videos retrieved successfully."
                )
            );
});

const publishAVideo = asyncHandler(async (req, res) => {
    // TODO: get video, upload to cloudinary, create video
    const { title, description } = req.body;
    const videoFilePath = req.files.videoFile[0].path;
    const thumbnailPath = req.files.thumbnail[0].path;

    if(!videoFilePath || !thumbnailPath) {
        throw new APIError(400, "Video file and thumbnail are required!");
    }

    if (!title || !description) {
        throw new APIError(400, "Title and description are required!");
    }

    const videoFile = await uploadCloudianry(videoFilePath);
    const thumbnail = await uploadCloudianry(thumbnailPath);

    if (!videoFile || !thumbnail) {
        throw new APIError(500, "Failed to upload video or thumbnail to Cloudinary.");
    }

    const newVideo = await Video.create({
        title,
        description,
        videoFile: [videoFile.secure_url, videoFile.public_id],
        thumbnail: [thumbnail.secure_url, thumbnail.public_id],
        owner: req.user._id
    });

    return res
        .status(201)
        .json(
            new APIResponse(
                201,
                newVideo,
                "Video published successfully."
            )
        );
});

const getVideoById = asyncHandler(async (req, res) => {
    //TODO: get video by id
    const { videoId } = req.params;
    if (!videoId || !isValidObjectId(videoId)) {
        throw new APIError(404, "Video not found!");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new APIError(404, "Video not found!");
    }

    return res
        .status(200)
        .json(
            new APIResponse(
                200,
                video,
                "Video retrieved successfully."
            )
        );

});

const updateVideo = asyncHandler(async (req, res) => {
    //TODO: update video details like title, description, thumbnail
    const { videoId } = req.params;
    
    if (!videoId || !isValidObjectId(videoId)) {
        throw new APIError(404, "Video not found!");
    }

     //* to delete the old avatar from cloudinary
    const video = await Video.findById(req.user._id);
    await deleteFromCloudinary(video.thumbnail[1]);

    const { title, description } = req.body;
    const thumbnailPath = req.file.thumbnail[0].path;

    if (!title || !description) {
        throw new APIError(400, "Title and description are required!");
    }

    if(!thumbnailPath) {
        throw new APIError(400, "Thumbnail is required!");
    }

    const thumbnail = await uploadCloudianry(thumbnailPath);
    
    if (!thumbnail) {
        throw new APIError(500, "Failed to upload thumbnail to Cloudinary.");
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId, {
        title,
        description,
        thumbnail: [thumbnail.secure_url, thumbnail.public_id],
        owner: req.user._id
    }, { new: true });

    if (!updatedVideo) {
        throw new APIError(404, "Video not found!");
    }

    return res
        .status(200)
        .json(
            new APIResponse(
                200,
                updatedVideo,
                "Video updated successfully."
            )
        );
});

const deleteVideo = asyncHandler(async (req, res) => {
    //TODO: delete video
    const { videoId } = req.params;
    if (!videoId || !isValidObjectId(videoId)) {
        throw new APIError(404, "Video not found!");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new APIError(404, "Video not found!");
    }

    const thumbnailId = video.thumbnail[1];
    const videoFileId = video.videoFile[1];
    await deleteFromCloudinary(thumbnailId);
    await deleteFromCloudinary(videoFileId);
    await Video.findByIdAndDelete(videoId);

    return res
        .status(204)
        .json(
            new APIResponse(
                204,
                {},
                "Video deleted successfully."
            )
        );
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    //TODO: toggle publish status of a video
    const { videoId } = req.params;
    
    if (!videoId || !isValidObjectId(videoId)) {
        throw new APIError(404, "Video not found!");
    }

    const video = await Video.findById(videoId);
    
    if (!video) {
        throw new APIError(404, "Video not found!");
    }

    video.isPublished = !video.isPublished;
    await video.save({ validateBeforeSave: false });


    return res
        .status(200)
        .json(
            new APIResponse(
                200,
                video,
                "Video publish status toggled successfully."
            )
        );
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}