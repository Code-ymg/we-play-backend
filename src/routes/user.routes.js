import { getCurrentUser, 
         getUserChannelProfile, 
         getWatchHistory, 
         loginUser, 
         logoutUser, 
         refreshAccessToken, 
         registerUser, 
         updateAccountDetails, 
         updateCurrentPassword, 
         updateUserAvatar,
         updateUserCoverImage
        } from "../controllers/user.controller.js";
import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },{
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
);

router.route("/login").post(loginUser);

//* Secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refesh-token").post(refreshAccessToken);
router.route("/update-password").patch(verifyJWT, updateCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-user-details").patch(verifyJWT, updateAccountDetails);
router.route("/update-user-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router.route("/update-user-coverImage").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);
router.route("/channel/:username").get(verifyJWT, getUserChannelProfile);
router.route("/watch-history").get(verifyJWT, getWatchHistory);


export default router;