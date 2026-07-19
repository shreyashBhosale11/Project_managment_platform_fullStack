import { body } from "express-validator";


const userRegisterValidator = () =>{
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Email is invalid"),
        
        body("username")
            .notEmpty()
            .withMessage("user name  is required")
            .isLowercase()
            .withMessage("Username must be in lower case")
            .isLength({min: 3})
            .withMessage("username must be with 3 characters long"),

        body("password")
            .trim()
            .notEmpty()
            .withMessage("Password  is required")
            ,
        
            body("fullname")
                .optional()
                .trim()
                



    ]
}


const userLoginValidator = () =>{
    return [
        body("email")
            .optional()
            .isEmail()
            .withMessage("Email is invalid"),
        

        body("password")
            .trim()
            .notEmpty()
            .withMessage("Password  is required")
            



    ]
}


const userChangeCureentPasswordValidator = ()=>{
    return[
        body("oldPassword")
            .notEmpty()
            .withMessage("oldPassword is required") ,
        body("newPassword")
            .notEmpty()
            .withMessage("newPassword is required")    
    ]
}

const userForgotPasswordValidator = ()=>{
    return[
        body("email")
            .notEmpty()
            .withMessage("email is required")
            .isEmail()
            .withMessage("Email is invalide")
    
    ]
}

const userRestForgotPasswordValidator = ()=>{
    return[
        body("newPassword")
            .notEmpty()
            .withMessage("password is required")
            
    
    ]
}

export {
    userRegisterValidator,
    userLoginValidator, 
    userChangeCureentPasswordValidator,
    userForgotPasswordValidator, 
    userRestForgotPasswordValidator
}