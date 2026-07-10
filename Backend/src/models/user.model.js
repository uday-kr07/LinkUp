import mongoose, { Schema } from 'mongoose';
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            minlength: 3,
            maxlength: 30,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"]
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String, 
            default: ""
        },
        coverImage: {
            type: String,   
            default: "",
        },
        password: {
                type: String,
                required: [true, "Password is required"],
                minlength: 6,
                select: false,
            },
        refreshToken: {
                type: String,
                select: false,
            },
    },
    {
        timestamps: true,
    }
)

 userSchema.pre("save", async function () {  // remove (next)
     if(!this.isModified("password")) return ;   // removed next()
    
    this.password = await bcrypt.hash(this.password, 10)
      //remove next()
})

userSchema.methods.isPasswordCorrect = async function
(password) {
    return await bcrypt.compare(password, this.password)
} 

userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)
