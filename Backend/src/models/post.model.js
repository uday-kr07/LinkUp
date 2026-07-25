import mongoose, { Schema } from "mongoose";

const postSchema = new Schema (
    {
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        title: {
            type: String,
            trim: true,
            maxlength: 100,
        },

        caption: {
            type: String,
            trim: true,
            maxlength: 2200,
        },

        media: [
        {
            url: {
                type: String,
                required: true,
            },
            fileId: {
                type: String,
            },
            mediaType: {
                type: String,
                enum: ["image", "video"],
                required: true,
            },
        },
    ],

    visibility: {
        type: String,
        enum: ["public", "followers", "private"],
        default: "public",
    },

    likesCount: {
        type: Number,
        default: 0,
    },

    commentsCount: {
        type: Number,
        default: 0,
    },

    },
    {
        timestamps: true,
    }
);

export const Post = mongoose.model("Post", postSchema);