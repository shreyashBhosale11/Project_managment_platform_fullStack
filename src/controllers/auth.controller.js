import {User} from "../models/user.models.js"
import { ApiResponse } from "../utils/api-responce.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/asyn-handler.js";
import {emailVerificationMailgenContent, forgotPasswordMailgenContent, sendEmail} from "../utils/mail.js"
import { validationResult } from "express-validator";
import jwt from "jsonwebtoken"

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

const logOutUser = asyncHandler(async(req , res) =>{
    await User.findByIdAndUpdate(
        req.user._id ,
         {
            $set:{
                refreshToken: ""
            }
         },{
            new: true
         }
         
        )
        const options = {
            httpOnly: true,
            secure: true
        }
        return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(
                new ApiResponse(200 , {} , "User logged out ")
            )


})


const getCurrentUser = asyncHandler(async(req , res )=>{
    return res
        .status(200)
        .json(
            new ApiResponse(200, 
                req.user,
                "Current user fetched successfully"
            )
        )
})


const verifyEmail = asyncHandler(async(req , res )=>{
    const {VerificationToken}= req.params

    if (!VerificationToken) {
        throw new ApiError(400 , "Email verifcation token is missing ")
    }

    let hashedToken = crypto
        .createHash("sha256")
        .update(VerificationToken)
        .digest("hex")

    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpiry:{$gt: Date.now()}
    })

    user.emailVerificationToken = undefined
    user.emailVerificationExpiry = undefined

    if(!user){
        throw new ApiError(400 , "Token is invalide and expired ")
    }
    user.isEmailVerified = true
    await User.save({validateBeforeSave: false})

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {
                isEmailVerified: true
            },
            "Email is verified"
        ))
})

const resendEmailVerification = asyncHandler(async(req , res )=>{
    const user = await User.findById(req.user._id);
    
    if (!user) {
        throw new ApiError(404 , "User does not exist ")

    }
    if(user.isEmailVerified ){
        throw new ApiError(409 , "Email has already verified ")
    }

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


    return res
        .status(201)
        .json(new ApiResponse(200 , {
            user: createdUser
        },
        "varification email has been sent on your email "
    ))
})

const refreshAccessToken = asyncHandler(async(req , res )=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(404 , "Unauthorized access  ")

    }
    try {
      const decodedToken =jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET)

      const user = await User.findById(decodedToken?._id)
        
      if (!user) {
        throw new ApiError(401 , "Invalid refresh Token ")

        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401 , "Refresh Token is expired")
        }

        const options = {
            httpOnly : true,
            secure : true
        }
        const {accessToken , refreshToken: newRefreshToken} = await generateAccessAndRefreshTokens(user.id)
        user.refreshToken = newRefreshToken

        await user.save

        return res
        .status(201)
        .cookie("accessToken" , accessToken)
        .cookie("refreshToken" , newRefreshToken)
        .json(new ApiResponse(200 , {
            accessToken , refreshToken : newRefreshToken
        },
        "Access Token refresh"
    ))


    } catch (error) {
        throw new ApiError(402 , "Invalid refreshToken ")
    }


})
const forgotPasswordRequest = asyncHandler(async(req , res )=>{
    const {email} = req.body

    const user = await User.findOne({email})
    if(!user){
        throw new ApiError(404, "User does not exists" ,[])
    }
    const {unhashedToken,
        hashedToken,
        tokenExpiry} = user.generateRTemporaryToken();
    user.forgotPasswordToken = hashedToken
    user.forgotPasswordExpiry = tokenExpiry

    await user.save({validateBeforeSave: false})

    await sendEmail({
        email: user?.email,
        subject:"Password Reset request ", 
        mailgenContent: forgotPasswordMailgenContent(
            user.username ,`${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unhashedToken}` )

    })
    return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                {},
                "Password reset mail been sent on your mail id"
            )
        )
        
})

const resetForgotpassword = asyncHandler(async(req , res )=>{
    const {resetToken} = req.params
    const {newPassword} = req.body

    let hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex")
    
    const user = await User.findOne({
        forgotPasswordToken: hashedToken, 
        forgotPasswordExpiry: {$gt: Date.now()}
    })
    if (!user) {
        throw new ApiError(489 , "Token is invalid or expired")

    }
    user.forgotPasswordToken = undefined
    user.forgotPasswordExpiry= undefined

    user.password = newPassword
    user.save({validateBeforeSave: false})

    return res 
        .status(200)
        .json(
            new ApiResponse(
                200, 
                {},

                "Password reset successfully "
            )
        )

})

const changeCureentPassword = asyncHandler(async(req , res )=>{
     const {oldPassword , newPassword} = req.body 
     const user =await User.findById(req.user?.id);

    const isPasswordValid = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordValid){
        throw new ApiError(400 , "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

   return res 
        .status(200)
        .json(
            new ApiResponse(
                200, 
                {},

                "Password change successfully "
            )
        )
})

export {
    registerUser, 
    login,
    logOutUser,
    getCurrentUser,
    verifyEmail,
    resendEmailVerification,
    forgotPasswordRequest, 
    resetForgotpassword,
    changeCureentPassword, 
    refreshAccessToken,


    
}


