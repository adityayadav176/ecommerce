import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    }
})

const sendEmail = async({to, subject, html}) => {
    return transporter.sendMail({
        from: process.env.SENDER_EMAIL,
        to,
        subject,
        html
    })
}
export{
   transporter,
   sendEmail
};