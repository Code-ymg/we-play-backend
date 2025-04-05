import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/APIError.js";
import { User } from "../models/user.model.js";
import { uploadCloudianry } from "../utils/cloudinary.js";
import { APIResponse } from "../utils/APIResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async(userid) => {
    try {
        const user = await User.findById(userid);
        const accessToken = user.generateAccesToken();
        const refreshToken = user.generateRefreshToken();
        
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken};
    } catch (error) {
        throw new APIError(501, "Something went wrong please try again later!");
    }
}

const registerUser = asyncHandler(async(req, res) => {
    const { username, email, fullname, password } = req.body;

    if([username, email, fullname, password].some((fields) => fields?.trim === "")) {
        throw new APIError(409, "Please enter all fields!");
    }

    const existedUser = await User.findOne({
        $or: [{ email }, { username }]
    });

    if(existedUser) {
        throw new APIError(400, "User already exist with this email or username!");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath) {
        throw new APIError(404, "Avatar path not found!");
    }

    const avatar = await uploadCloudianry(avatarLocalPath);
    const coverImage = await uploadCloudianry(coverImageLocalPath);

    const user = await User.create({
        username: username.toLowerCase(),
        email,
        fullname,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
    });

    const userData = await User.findById(user._id).select("-password -refreshToken");

    if(!userData) {
        throw new APIError(500, "Something went wrong from ourside!");
    }

    return res.status(201).json(new APIResponse(201, userData, "The data is inserted succesfully!"));

});

const loginUser = asyncHandler(async(req, res) => {
    const { username, email, password } = req.body;

    if(!(username || email)) {
        throw new APIError(401, "Please enter username or email");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }],
    });

    if(!user) {
        throw new APIError(404, "User not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid) {
        throw new APIError(401, "Please check your password is incorrect");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new APIResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "Logged in succesfully"
        )
    );    
});

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1, //* This removes the field from the document   
            }
        },
        {
            new: true
        }
    )
    
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new APIResponse(
            200,
            {},
            "You are succesfully logged out"
        )
    );
});

const refreshAccessToken = asyncHandler(async(req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken) {
        throw new APIError(401, "unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        
        const user = await User.findById(decodedToken._id);
        
        if(!user) {
            throw new APIError(404, "User not found!");
        }
        
        if(user.refreshToken !== incomingRefreshToken) {
            throw new APIError(401, "The token is expired!");
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id);

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new APIResponse(
                200,
                {
                    accessToken,
                    refreshToken: newRefreshToken
                },
                "Access token is refreshed"
            )
        )

    } catch (error) {
        throw new APIError(401, error.message || "unauthorized request found!")
    }

});

const updateCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body;

    const isPasswordCorrect = await req.user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect) {
        throw new APIError(401, "Old password is incorrect!");
    }

    if(!newPassword) {
        throw new APIError(401, "Please enter new password!");
    }

    const user = await User.findById(req.user._id);

    if(!user) {
        throw new APIError(400, "The user was not found!");
    }

    user.password = newPassword;
    user.save({ validateBeforeSave: false });

    return res
    .status(200)
    .json(
        new APIResponse(
            200,
            {},
            "Password changed successfully!"
        )
    )
});

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(
        new APIResponse(
            200,
            req.user,
            "The current user is fetched succesfully!"
        )
    )
});

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullname, email} = req.body;

    if(!(fullname || email)) {
        throw new APIError(401, "Please enter username or email");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                fullname,
                email,
            }
        }, 
        {
            new: true,
        }    
    ).select("-password");

    return res
    .status(200)
    .json(
        new APIResponse(
            200,
            user,
            "the details are updated succesfully!"
        )
    )

});

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.files?.avatar[0]?.path;

    if(!avatarLocalPath) {
        throw new APIError(404, "Avatar path not found!");
    }

    const avatar = await uploadCloudianry(avatarLocalPath);

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatar.url,
            }    
        },
        {
            new: true
        }
    ).select("-password");

    return res
    .status(200)
    .json(
        new APIResponse(
            200,
            user,
            "The avatar is updated succesfully!"
        )
    )
});

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.files?.avatar[0]?.path;

    if(!coverImageLocalPath) {
        throw new APIError(404, "Cover image path not found!");
    }

    const coverImage = await uploadCloudianry(coverImageLocalPath);

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: coverImage.url,
            }
        },
        {
            new: true
        }
    ).select("-password");

    return res
    .status(200)
    .json(
        new APIResponse(
            200,
            user,
            "The cover image is updated succesfully!"
        )
    )
});

const getUserChannelProfile = asyncHandler(async(req, res) => {
    const { username } = req.params;

    if(!username?.trim()) {
        throw new APIError(404, "Please enter username!");
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers"
                },
                subscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user._id, "$subscribers.subscriber"]},
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
                coverImage: 1,
                subscriberCount: 1,
                subscribedToCount: 1,
                isSubscribed: 1,
                email: 1,
            }
        }
    ])

    console.log(channel);

    if(!channel?.length) {
        throw new APIError(404, "The channel was not found!");
    }

    return res
    .status(200)
    .json(
        new APIResponse(
            200,
            channel[0],
            "The channel profile is fetched successfully!"
        )
    )
    
});

const getWatchHistory = asyncHandler(async(req, res) =>{
    const user = User.aggregate([
        {
            $match: {
                _id: mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
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
            user[0].watchHistory,
            "The watch history is fetched successfully!"
        )
    );
});

export { 
    registerUser,
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    updateCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
};