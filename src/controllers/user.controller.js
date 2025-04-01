import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/APIError.js";
import { User } from "../models/user.model.js";
import { uploadCloudianry } from "../utils/cloudinary.js";
import { APIResponse } from "../utils/APIResponse.js";

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

export { registerUser };