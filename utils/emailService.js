import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'Gmail', // You can use other services like 'SendGrid', 'Mailgun', etc.
    auth: {
        user: process.env.EMAIL, // Your email address
        pass: process.env.EMAIL_PASSWORD  // Your email password or application-specific password
    }
});

export const sendEmail = async (to, subject, html) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL,
            to,
            subject,
            html
        });
    } catch (error) {
        console.error('Error sending email:', error);
    }
};