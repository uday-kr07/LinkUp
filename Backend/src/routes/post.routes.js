import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
    createPost,
    getFeed,
    getPostById,
    updatePost,
    deletePost,
} from "../controllers/post.controller.js";

const router = Router();

router.use(verifyJWT);

router
    .route("/")
    .post(createPost)
    .get(getFeed);

router
    .route("/:postId")
    .get(getPostById)
    .patch(updatePost)
    .delete(deletePost);

export default router;