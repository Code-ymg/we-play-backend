import {isValidObjectId} from "mongoose";
import {Playlist} from "../models/playlist.model.js";
import {APIError} from "../utils/APIError.js";
import {APIResponse} from "../utils/APIResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";


const createPlaylist = asyncHandler(async (req, res) => {
    //TODO: create playlist
    const {name, description} = req.body;
    const {userId} = req.user;
    if (!name || !description) {
        throw new APIError(404, "Name and description are required");
    }
    if (!isValidObjectId(userId)) {
        throw new APIError(400, "Invalid user id");
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: userId,
    });

    if (!playlist) {
        throw new APIError(500, "Error creating playlist");
    }

    return res
            .status(201)
            .json(
                new APIResponse(
                    201,
                    playlist, 
                    "Playlist created successfully"
                )
            );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    //TODO: get user playlists
    const {userId} = req.params;
    
    if (!isValidObjectId(userId)) {
        throw new APIError(400, "Invalid user id");
    }

    const playlists = await Playlist.find({owner: userId});
    
    if (!playlists || playlists.length === 0) {
        throw new APIError(404, "No playlists found for this user");
    }

    return res
        .status(200)
        .json(
            new APIResponse(
                200,
                playlists,
                "Playlists retrieved successfully"
            )
        );
});

const getPlaylistById = asyncHandler(async (req, res) => {
    //TODO: get playlist by id
    const {playlistId} = req.params;
    
    if(!isValidObjectId(playlistId)) {
        throw new APIError(400, "Invalid playlist id");
    }

    const playlist = await Playlist.findById(playlistId);
    
    if (!playlist) {
        throw new APIError(404, "Playlist not found");
    }

    return res
        .status(200)
        .json(
            new APIResponse(
                200,
                playlist,
                "Playlist retrieved successfully"
            )
        );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    //TODO: add video to playlist
    const {playlistId, videoId} = req.params;
    
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new APIError(400, "Invalid playlist or video id");
    }

    const playlistVideo = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: {
                videos: videoId
            }
        },
        {
            new: true
        }
    );

    if (!playlistVideo) {
        throw new APIError(404, "Playlist not found or video already exists in playlist");
    }

    return res
        .status(200)
        .json(
            new APIResponse(
                200,
                playlistVideo,
                "Video added to playlist successfully"
            )
        );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    // TODO: remove video from playlist
    const {playlistId, videoId} = req.params;

    if(!playlistId || !videoId) {
        throw new APIError(400, "Playlist id and video id are required");
    }

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new APIError(400, "Invalid playlist or video id");
    }
    
    const removePlaylistVideo = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: videoId
            }
        },
        {
            new: true
        }
    );

    if (!removePlaylistVideo) {
        throw new APIError(404, "Playlist not found or video does not exist in playlist");
    }

    return res
            .status(200)
            .json(
                new APIResponse(
                    200,
                    removePlaylistVideo,
                    "Video removed from playlist successfully"
                )
            );
});

const deletePlaylist = asyncHandler(async (req, res) => {
    // TODO: delete playlist
    const {playlistId} = req.params;

    if(!isValidObjectId(playlistId)) {
        throw new APIError(400, "Invalid playlist id");
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

    if (!deletedPlaylist) {
        throw new APIError(404, "Playlist not found");
    }
    return res
            .status(200)
            .json(
                new APIResponse(
                    200,
                    {},
                    "Playlist deleted successfully"
                )
            );
});

const updatePlaylist = asyncHandler(async (req, res) => {
    //TODO: update playlist
    const {playlistId} = req.params;
    const {name, description} = req.body;

    if (!isValidObjectId(playlistId)) {
        throw new APIError(400, "Invalid playlist id");
    }
    if (name.trim() === "" || description.trim() === "") {
        throw new APIError(400, "Name and description are required");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            name : name,
            description: description
        },
        {
            new: true
        }
    );

    if (!updatedPlaylist) {
        throw new APIError(404, "Playlist not found");
    }

    return res
            .status(200)
            .json(
                new APIResponse(
                    200,
                    updatedPlaylist,
                    "Playlist updated successfully"
                )
            );
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
