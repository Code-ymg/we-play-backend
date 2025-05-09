import {v2 as cloudinary} from "cloudinary";
import fs from "fs";
import { APIError } from "../utils/APIError.js";

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadCloudianry = async (localFilePath) => {
    try {
        if(!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        // console.log("file is uploaded successfully ", response.url);
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        //* remove the locally saved temporary file as the upload
        return null;
    }
};

const deleteFromCloudinary = async (docId) => {
    try {
        await cloudinary.uploader.destroy(docId);
    } catch (error) {
        throw new APIError(404, "File was not found!");
    }
};

export {uploadCloudianry, deleteFromCloudinary};
