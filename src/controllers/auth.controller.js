import {User} from "../models/user.models.js"
import { ApiResponse } from "../utils/api-responce.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/asyn-handler.js";
import {emailVerificationMailgenContent, sendEmail} from "../utils/mail.js"

const generateAccessAndRefreshTokens = async (userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
        return {accessToken , refreshToken}
    } catch (error) {
        throw new ApiError(500 ,"somthing went wrong while generating access token  " )
    }
}


const registerUser = asyncHandler(async (req , res)=>{
    const {email , username ,password }=req.body

    const existedUser = await User.findOne({
        $or:[{username} , {email}]
    })

    if(existedUser){
        throw new ApiError(409 , "User with eamil or username already exists ", [])
    }

    const user = await User.create({
        email,
        password,
        username,
        isEmailVerified: false 
    })

    const {unhashedToken , hashedToken , tokenExpriy} =user.generateRTemporaryToken()

    user.emailVerificationToken = hashedToken
    user.emailVerificationExpiry = tokenExpriy

    await user.save({validateBeforeSave: false})

    await sendEmail({
        email: user?.email,
        subject:"Please verify your email ", 
        mailgenContent: emailVerificationMailgenContent(
            user.username ,`${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unhashedToken}` )

    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
    )

    if(!createdUser){
        throw new ApiError(500, "somthing went wrong while registring user ")
    }

    return res
        .status(201)
        .json(new ApiResponse(200 , {
            user: createdUser
        },
        "User registered successfully and varification email has been sent on your email "
    ))

})


export {
    registerUser
}


