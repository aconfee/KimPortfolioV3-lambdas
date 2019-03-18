'use strict';
const nodemailer = require('nodemailer');
const axios = require('axios');
const ORIGIN = require('appsettings').ORIGIN;

module.exports.sendPortfolioMessage = (event, context, callback) => {

    const GMAIL_PASSWORD = process.env.GMAIL_PASSWORD;
    if(!GMAIL_PASSWORD) {
        console.error("Please set environment variable GMAIL_PASSWORD for email messenger.");
    }

    const { first, last, email, message } = JSON.parse(event.body);
    console.log("Event received: ", event.body);

    const messageText = `
        Sender:
        ${first} ${last}
        ${email}
        Message:
        ${message}`;

    const mailOptions = {
        from: "adamestela@gmail.com",
        to: "kimbyarting@gmail.com",
        subject: "PORTFOLIO MESSAGE!!",
        text: messageText
    };

    const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: "adamestela@gmail.com",
            pass: GMAIL_PASSWORD
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