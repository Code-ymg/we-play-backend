import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/APIError.js";
import { User } from "../models/user.model.js";
import { uploadCloudianry } from "../utils/cloudinary.js";
import { APIResponse } from "../utils/APIResponse.js";
import jwt from "jsonwebtoken";

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

const registerUser = asyncHandler(async (req, res) => {
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

const loginUser = asyncHandler(async (req, res) => {
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

    res.status(200)
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

    res
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

export { registerUser, loginUser, logoutUser, refreshAccessToken };