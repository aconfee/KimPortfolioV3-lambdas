'use strict';
const nodemailer = require('nodemailer');
const axios = require('axios');
const ORIGIN = require('appsettings').ORIGIN;

module.exports.sendPortfolioMessage = (event, context, callback) => {

    const SMTP_CLIENT_ID = process.env.SMTP_CLIENT_ID;
    if(!SMTP_CLIENT_ID) {
        console.error("Please set environment variable SMTP_CLIENT_ID for email messenger.");
    }

    const SMTP_CLIENT_SECRET = process.env.SMTP_CLIENT_SECRET;
    if(!SMTP_CLIENT_SECRET) {
        console.error("Please set environment variable SMTP_CLIENT_SECRET for email messenger.");
    }

    const SMTP_REFRESH_TOKEN = process.env.SMTP_REFRESH_TOKEN;
    if(!SMTP_REFRESH_TOKEN) {
        console.error("Please set environment variable SMTP_REFRESH_TOKEN for email messenger.");
    }

    const SMTP_ACCESS_TOKEN = process.env.SMTP_ACCESS_TOKEN;
    if(!SMTP_ACCESS_TOKEN) {
        console.error("Please set environment variable SMTP_ACCESS_TOKEN for email messenger.");
    }

    const { first, last, email, message } = JSON.parse(event.body);

    const messageText = `
        Sender:
        ${first} ${last}
        ${email}
        Message:
        ${message}`;

    const messageHtml = `<div>
        <h1>Sender</h1>
        <p>${first} ${last}</p>
        <p>${email}</p>
        <br />
        <h1>Message</h1>
        <p>${message}</p>
    </div>`;

    const mailOptions = {
        from: '"Portfolio Message" <adamestela@gmail.com>',
        to: "kimbyarting@gmail.com",
        subject: "PORTFOLIO MESSAGE!!",
        text: messageText,
        html: messageHtml
    };

    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // secure:true for port 465, secure:false for port 587
        auth: {
            type: "OAuth2",
            user: "adamestela@gmail.com",
            clientId: SMTP_CLIENT_ID,
            clientSecret: SMTP_CLIENT_SECRET,
            refreshToken: SMTP_REFRESH_TOKEN,
            accessToken: SMTP_ACCESS_TOKEN
        }
    });

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log("Something went wrong when trying to send email:");
            console.log(error);

            const errorResponse = {
                statusCode: 500,
                headers: { "Access-Control-Allow-Origin": ORIGIN },
                body: JSON.stringify({
                    error: error
                }),
            };

            callback(null, errorResponse);
            return;
        }

        const successResponse = {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin": ORIGIN },
            body: JSON.stringify({
                messageId: info.messageId, 
                response: info.response
            }),
        };

        callback(null, successResponse);
    });
};