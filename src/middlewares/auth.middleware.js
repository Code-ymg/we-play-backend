import { User } from "../models/user.model.js";
import { APIError } from "../utils/APIError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";


export const verifyJWT = asyncHandler(async(req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
    
        if(!token) {
            throw new APIError(401, "No accesstoken found");
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
        if(!decodedToken) {
            throw new APIError(401, "The token is invalid");
        }
    
        const user = await User.findById(decodedToken._id).select("-password -refreshToken");
    
        if(!user) {
            throw new APIError(401, "User not found");
        }
    
        req.user = user;
        next();
    } catch (error) {
        throw new APIError(401, error?.message || "Something went wrong");
    }
});