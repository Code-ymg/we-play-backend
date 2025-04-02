import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
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

export default router;