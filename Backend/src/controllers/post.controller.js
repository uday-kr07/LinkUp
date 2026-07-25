import { Post } from "../models/post.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPost = asyncHandler(async (req, res) => {
    const { title, caption, visibility } = req.body;

    const owner = req.user?._id;

    if (!owner) {
        throw new ApiError(401, "Unauthorized request");
    }

    const mediaFiles = req.files;

    if (!mediaFiles || mediaFiles.length === 0) {
        throw new ApiError(400, "At least one media file is required");
    }

    // Upload media files
    const uploadedMedia = [];

    // TODO:
    // Loop through mediaFiles
    // Upload each file to ImageKit/Cloudinary
    // Push into uploadedMedia like:
    //
    // uploadedMedia.push({
    //     url: uploadedFile.url,
    //     fileId: uploadedFile.fileId,
    //     mediaType: "image" // or "video"
    // });

    const post = await Post.create({
        owner,
        title,
        caption,
        media: uploadedMedia,
        visibility,
    });

    if (!post) {
        throw new ApiError(500, "Failed to create post");
    }

    return res.status(201).json(
        new ApiResponse(
            201,
            post,
            "Post created successfully"
        )
    );
});

export { createPost };