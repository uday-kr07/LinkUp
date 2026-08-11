import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
    createPost,
    getFeed,
    getUserPosts,
    //updatePost,
    //deletePost,
} from "../controllers/post.controller.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

router.use(verifyJWT);

router
    .route("/")
    .post(
        upload.array("media", 10),
        createPost
    )
    .get(getFeed);

router
    .route("/user/:userId")
    .get(getUserPosts);
    //.patch(updatePost)
    //.delete(deletePost);

export default router;