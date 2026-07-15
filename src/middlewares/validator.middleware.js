import {validationResult} from 'express-validator'
import { ApiError } from '../utils/api-error.js'


export const validate = (req, res , next ) =>{
    const error = validationResult(req)
    if(error.isEmpty()){
        return next()
    }

    const extractrdError = []
    error.array().map((err)=> extractrdError.push(
        {
            [err.path]: err.msg
        }))
        throw new ApiError(422 , "Recived data is not valid",
            extractrdError
        ) 
}