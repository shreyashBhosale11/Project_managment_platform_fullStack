import Mailgen from "mailgen";
import nodemailer from "nodemailer"

const sendEmail = async(options)=>{
    const mailGenrator = new Mailgen({
        theme: "default",
        product: {
            name: "Task Manager",
            link:"https://taskmanagelink.com"
        }
    })

    const emailTextual = mailGenrator.generatePlaintext(options.mailgenContent)

    const emailHtml = mailGenrator.generate(options.mailgenContent)

    const transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_SMTP_HOST,
        port: process.env.MAILTRAP_SMTP_PORT,
        auth: {
            user: process.env.MAILTRAP_SMTP_USER,
            pass: process.env.MAILTRAP_SMTP_PASS
        }
    })

    const mail = {
        from: "mail.taskmanager@example.com",
        to: options.email,
        subject: options.subject,
        text: emailTextual,
        html: emailHtml

    }

    try {
        await transporter.sendMail(mail)
    } catch (error) {
        console.error("Email services failed siliently make sure that you have provided your Mailtrap credentials in the .env file ", )
        console.error("Error", error)
    }


}



const emailVerificationMailgenContent = (username , verficationUrl) =>{
    return {
        body:{
            name: username,
            intro: "Welcome to our App! we are excited to have you on board. ",
            action:{
                instructions: "To verify your email please click on the following button ",
                button: {
                    color: "#22BC66",
                    text: "verify your email",
                    link: verficationUrl
                }
            },
            outro: "Need help , or have questions? just reply to this email, we love to help "
        }
    }

}


const forgotPasswordMailgenContent = (username , passwordResetUrl) =>{
    return {
        body:{
            name: username,
            intro: "we got a request to reset the password of your account ",
            action:{
                instructions: "To reset your password please click on the following button ",
                button: {
                    color: "#1b99dd",
                    text: "reset password",
                    link: passwordResetUrl
                }
            },
            outro: "Need help , or have questions? just reply to this email, we love to help "
        }
    }
    
}

export {
    emailVerificationMailgenContent,
    forgotPasswordMailgenContent,
    sendEmail
}