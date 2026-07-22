import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User } from "../models/user.model.js";
import { client } from "../utils/googleAuth.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnImageKit } from "../utils/imagekit.js";


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        // Find the user
        const user = await User.findById(userId);

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        // Generate tokens using methods defined in user.model.js
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // Save refresh token in database
        user.refreshToken = refreshToken;

        // Skip validation because we're only updating refreshToken
        await user.save({ validateBeforeSave: false });

        // Return both tokens
        return {
            accessToken,
            refreshToken,
        };

    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating access and refresh tokens"
        );
    }
};


const registerUser =  asyncHandler( async (req, res) => {

    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to imagekit, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res


    console.log("REQ.FILES:", req.files)
    console.log("ENV CHECK:", {
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY ? "EXISTS" : "MISSING",
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY ? "EXISTS" : "MISSING",
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "MISSING"
    });

// 1. Get user data
    const { fullName, email, username, password } = req.body;

    // 2. Validate fields
    if (
        [fullName, email, username, password].some(
            (field) => !field || field.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    // Normalize values
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedFullName = fullName.trim();

    // 3. Check existing user
    const existedUser = await User.findOne({
        $or: [
            { email: normalizedEmail },
            { username: normalizedUsername }
        ]
    });

    if (existedUser) {
        throw new ApiError(
            409,
            "User with this email or username already exists"
        );
    }

    // 4. Get uploaded files
    const avatarFile = req.files?.avatar?.[0];

    const coverImageFile = req.files?.coverImage?.[0];

    // Avatar is required
    if (!avatarFile) {
        throw new ApiError(400, "Avatar is required");
    }

    // 5. Upload to ImageKit
    const avatar = await uploadOnImageKit(avatarFile);

    let coverImage = null;

    if (coverImageFile) {
        coverImage = await uploadOnImageKit(
            coverImageFile
        );
    }

    if (!avatar?.url) {
    throw new ApiError(
        500,
        "Failed to upload avatar"
    );
}

    // 6. Create user
    const user = await User.create({
        fullName: normalizedFullName,
        email: normalizedEmail,
        username: normalizedUsername,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
    });

    // 7. Remove sensitive fields
    const createdUser = await User.findById(user._id)
        .select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(
            500,
            "Something went wrong while creating the user"
        );
    }

    // 8. Return response
    return res.status(201).json(
        new ApiResponse(
            201,
            createdUser,
            "User registered successfully"
        )
    );
});


const googleLogin = asyncHandler(async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        throw new ApiError(400, "ID token is required");
    }

    //Verify Google token
    const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    if (!payload) {
        throw new ApiError(401, "Invalid ID token");
    }

    const {
        sub: googleId,
        email,
        name,
        picture,
        email_verified,
    } = payload;

    if (!email_verified) {
        throw new ApiError(401, "Google email is not verified");
    }

     // Check if user already exists
    let user = await User.findOne({ email });

     // Create user if it doesn't exist
    if (!user) {
        user = await User.create({
            username: email.split("@")[0],
            email,
            fullName: name,
            avatar: picture,
            googleId,
            authProvider: "google",
            password: crypto.randomBytes(), // dummy password
        })
    }

    // Generate your existing JWTs
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const loogedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    },

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,
                accessToken,
                refreshToken
            },
            "Google Login successful"
        )
    )

});


const loginUser = asyncHandler(async (req, res) => {

    //Get data
    const { email, username, password } = req.body;

    //Validate
    if ((!email && !username) || !password) {
    throw new ApiError(
        400,
        "Email or username and password are required"
    );
}

    //Find User
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedUsername = username?.trim().toLowerCase();

    const user = await User.findOne({
    $or: [
        { email: normalizedEmail },
        { username: normalizedUsername }
    ]
}).select("+password +refreshToken");


    //if user not found, throw error
    if (!user) {
        throw new ApiError(
            404,
            "User not found"
        );
    }


    //Check Password
    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
        throw new ApiError(
            401,
            "Invalid password"
        );
    }

    console.log("Password from request:", password);
    console.log("User from DB:", user);
    console.log("Password in DB:", user.password);
    console.log("Request body:", req.body);
    console.log("Password from request:", password);
    console.log("User found:", user);
    console.log("Password from DB:", user.password);

    //Generate Tokens
    const {
        accessToken,
        refreshToken
    } = await generateAccessAndRefreshTokens(user._id);

    //Get Clean User
    const loggedInUser = await User.findById(user._id)
        .select("-password -refreshToken");

    //Cookie Options
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };

    //Response
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,
                accessToken,
                refreshToken
            },
            "User logged in successfully"
        )
    );

});


const logoutUser = asyncHandler(async (req, res) => {

    // Remove refresh token from database
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    );

    // Cookie options
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
    };

    // Clear cookies and return response
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                200,
                {},
                "User logged out successfully"
            )
        );

});


const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        // Verify Refresh Token
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        // Find User
        const user = await User.findById(decodedToken?._id).select(
            "+refreshToken"
        );

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        // Compare Refresh Token
        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(
                401,
                "Refresh token is expired or has been used"
            );
        }

        // Generate New Tokens
        const { accessToken, refreshToken: newRefreshToken } =
            await generateAccessAndRefreshTokens(user._id);

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken: newRefreshToken,
                    },
                    "Access token refreshed successfully"
                )
            );
    } catch (error) {
        throw new ApiError(
            401,
            error?.message || "Invalid refresh token"
        );
    }
});


const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(
            200,
            req.user,
            "Current user fetched successfully"
        )
    )
})


const updateAccountDetails = asyncHandler(async (req, res) => {
    const {fullName, email} = req.body

    if (!fullName && !email) {
        throw new ApiError(400, "All field is required to update")
    }

    const fieldsToUpdate = {};

    if (fullName?.trim()) {
        fieldsToUpdate.fullName = fullName.trim();
    }

    if (email?.trim()) {
        fieldsToUpdate.email = email.trim().toLowerCase();
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: fieldsToUpdate
        },
        {new: true}

    ).select("-password -refreshToken")

    return res.status(200)
    .json(new ApiResponse(200, user, "User details updated successfully"));
});


const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Old password and new password are required");
    }

    const user = await User.findById(req.user?._id).select("+password");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password");
    }

    user.password = newPassword;

    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Password changed successfully"
        )
    );
});


const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarFile = req.file;

    if (!avatarFile) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnImageKit(avatarFile);

    if (!avatar) {
        throw new ApiError(500, "Error while uploading avatar");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url,
            },
        },
        {
            new: true,
            runValidators: true,
        }
    ).select("-password -refreshToken");

    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            "Avatar updated successfully"
        )
    );
});


const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageFile = req.file;

    if (!coverImageFile) {
        throw new ApiError(400, "Cover image file is required");
    }

    const coverImage = await uploadOnImageKit(coverImageFile);

    if (!coverImage) {
        throw new ApiError(500, "Error while uploading cover image");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url,
            },
        },
        {
            new: true,
            runValidators: true,
        } 
    ).select("-password -refreshToken");

    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            "Cover image updated successfully"
        )
    );
});


const getUserProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "Username is required");
    }

    const profile = await User.aggregate([
        {
            $match: {
                username: username.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "followers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "following"
            }
        },
        {
            $addFields: {
                follwersCount: {
                    $size: "$followers"
                },
                followingCount: {
                    $size: "$following"
                },
                isFollowing: {
                    $cond: {
                        if: {
                            $in: [
                                req.user?._id,
                                "$followers.subscriber"
                            ]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
                followersCount: 1,
                followingCount: 1,
                isFollowing: 1
            }
        }
    ]);

    if (!profile.length) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            profile[0],
            "User profile fetched successfully"
        )
    );

});


export { 
    generateAccessAndRefreshTokens,
    registerUser,
    loginUser,
    googleLogin,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    updateAccountDetails,
    changeCurrentPassword,
    updateUserAvatar,
    updateUserCoverImage,
    getUserProfile,
};
