import { Router } from "express";
import { registerUser , login , logOutUser, verifyEmail, refreshAccessToken, forgotPasswordRequest, resetForgotpassword, getCurrentUser, changeCureentPassword, resendEmailVerification } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import  {userRegisterValidator , userLoginValidator , userForgotPasswordValidator, userRestForgotPasswordValidator, userChangeCureentPasswordValidator} from "../validators/index.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router()
// unsecure routes
router.route("/register").post(userRegisterValidator(), validate ,registerUser);
router.route("/login").post(userLoginValidator() ,validate,login);
router.route("/verify-email/:VerificationToken").get(verifyEmail);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/forgot-password").post(userForgotPasswordValidator(),validate,forgotPasswordRequest);
router.route("/reset-password/:resetToken").post(userRestForgotPasswordValidator(),validate,resetForgotpassword);




//secure routes
router.route("/logout").post(verifyJWT ,logOutUser);
router.route("/cureent-user").post(verifyJWT ,getCurrentUser);
router.route("/change-password").post(verifyJWT, userChangeCureentPasswordValidator(), validate ,changeCureentPassword);
router.route("/resend-email-verification").post(verifyJWT ,resendEmailVerification);








export default router
