import { User } from "../models/user.model.js";
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



export { 
    generateAccessAndRefreshTokens,
    registerUser,
    loginUser,
};
