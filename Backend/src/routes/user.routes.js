import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";
import { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    updateAccountDetails,
    changeCurrentPassword,
    updateUserAvatar,
    updateUserCoverImage,
    getUserProfile,
        } from "../controllers/user.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";



    const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
    )

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/current-user").post(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);
router.route("/change-password").patch(verifyJWT, changeCurrentPassword);
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router.route("/coverImage").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);
router.route("/profile/:username").get(verifyJWT, getUserProfile);

export default router ;
