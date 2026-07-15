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


const login = asyncHandler(async(req , res)=>{
    const {email , password , username}= req.body

    if(!email){
        throw new ApiError(400 , " email is required")
    }

    const user = await User.findOne({email})
    if(!user){
        throw new ApiError(400 , " User does not exits")
    }

    const  PasswordISValid = await user.isPasswordCorrect(password);
    if (!PasswordISValid) {
        throw new ApiError(400 , " Password is incorrect ")
    }

    const {accessToken , refreshToken}=await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken" , accessToken , options)
        .cookie("refreshToken" , refreshToken , options)
        .json(
            new ApiResponse(200,
                {
                   user: loggedInUser ,
                   accessToken,
                   refreshToken
                },
                "User logged in successfully"
            )
        )

})


export {
    registerUser, 
    login
}


