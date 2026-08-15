import { Post } from "../models/post.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnImageKit } from "../utils/imagekit.js"; 

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

    for (const file of mediaFiles) {
        const result = await uploadOnImageKit(file);

        if (!result) {
            throw new ApiError(500, "Failded to upload media to ImageKit");
        }

        uploadedMedia.push({
            url: result.url,
            fileId: result.fileId,
            mediaType: file.mimetype.startsWith("image/")
                ? "image"
                : "video",
        })
    }

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


const getFeed = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized request");
    }
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Number(req.query.limit) || 20, 50);

        const skip = (page - 1) * limit;

        const filter = {
        $or: [
            { visibility: "public" },
            { owner: userId }
        ]
    };

    const [posts, totalPosts] = await Promise.all([
        Post.find(filter)
            .populate("owner", "username fullName avatar")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),

        Post.countDocuments(filter)
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                posts,
                page,
                limit,
                totalPosts,
                totalPages: Math.ceil(totalPosts / limit)
            },
            "Feed fetched successfully"
        )
    )
});


const getUserPosts = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        throw new ApiError(400, "User Id is required");
    }

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 50);

    const skip = (page -1) * limit;

    const filter = {
        owner: userId,
        visibility: "public"
    };

    const [posts, totalPosts] = await Promise.all([
        Post.find(filter)
            .populate("owner", "username fullName avatar")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),

        Post.countDocuments(filter)
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,{
                posts,
                page,
                limit,
                totalPosts,
                totalPages: Math.ceil(totalPosts / limit)
            },
            "User posts fetched successfully"
        )
    )

})


const getPostById = asyncHandler(asyncHandler(async (req, res) => {
    const { postId } = req.params;

    if (!postId) {
        throw new ApiError(400, "Post Id is required");
    }

    const post = await Post.findById(postId)
    .populate("owner", "username fullName avatar");

    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            post,
            "post fetched successfully"
        )
    );
}))


const updatePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { title, caption, visibility } = req.body;

    if (!postId) {
        throw new ApiError(400, "Post Id is required");
    }

// Find the post
const post = await Post.findById(postId);

if (!post) {
    throw new ApiError(404, "Post not found");
}

// Check ownereship
if (post.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this post");
}

// Update only provided fields
if (title !== undefined) {
    post.title = title;
}

if (caption !==  undefined) {
    post.caption = caption;
}

if (visibility !== undefined) {
    if (!["public", "private"].includes(visibility)) {
        throw new ApiError(400, "Invalid visibility value");
    }

    post.visibility = visibility;
}

await post.save();

const updatedPost = await Post.findById(postId)
    .populate("owner", "username fullName avatar");

return res.status(200).json(
    new ApiResponse(
        200,
        updatedPost,
        "Post updated successfully"
        )
    )
})


export { 
    createPost, 
    getFeed, 
    getUserPosts,
    getPostById,
    updatePost
};