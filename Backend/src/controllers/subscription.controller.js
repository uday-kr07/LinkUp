import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    // Validate channelId
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid user id");
    }

    // Prevent following yourself
    if (req.user._id.toString() === channelId) {
        throw new ApiError(400, "You cannot follow yourself");
    }

    // Check if the user exists
    const channel = await User.findById(channelId);

    if (!channel) {
        throw new ApiError(404, "User not found");
    }

    // Check if already following
    const existingSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    });

    // Already following → Unfollow
    if (existingSubscription) {

        await Subscription.findByIdAndDelete(existingSubscription._id);

            return res.status(200).json(
                new ApiResponse(
                    200,
                    {},
                    "Unfollowed successfully"
                )
            );
    }

    // Not following → Follow
    await Subscription.create(
    {
        subscriber: req.user._id,
        channel: channelId
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Followed successfully"
        )
    );

});

export {
    toggleSubscription
};