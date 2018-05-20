'use strict';
const nodemailer = require('nodemailer');
const COMMISSION_SITE_ORIGIN = require('appsettings').COMMISSION_SITE_ORIGIN;

module.exports.sendCommissionMessage = (event, context, callback) => {

    const smtpClientId = process.env.SMTP_CLIENT_ID;
    if(!smtpClientId) {
    console.error("Please set environment variable SMTP_CLIENT_ID for email messenger.");
    }

    const smtpClientSecret = process.env.SMTP_CLIENT_SECRET;
    if(!smtpClientSecret) {
    console.error("Please set environment variable SMTP_CLIENT_SECRET for email messenger.");
    }

    const smtpRefreshToken = process.env.SMTP_REFRESH_TOKEN;
    if(!smtpRefreshToken) {
    console.error("Please set environment variable SMTP_REFRESH_TOKEN for email messenger.");
    }

    const smtpAccessToken = process.env.SMTP_ACCESS_TOKEN;
    if(!smtpAccessToken) {
    console.error("Please set environment variable SMTP_ACCESS_TOKEN for email messenger.");
    }

    const { first, last, email, message } = JSON.parse(event.body).senderDetails;
  
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
  
    let mailOptions = {
        from: '"Kimby Arting Commissions" <adamestela@gmail.com>',
        to: "kimbyarting@gmail.com",
        subject: "NEW COMMISSION MESSAGE!!",
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
            clientId: smtpClientId,
            clientSecret: smtpClientSecret,
            refreshToken: smtpRefreshToken,
            accessToken: smtpAccessToken
        }
    });

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Something went wrong when trying to send email:", error);
          
          const errorResponse = {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": COMMISSION_SITE_ORIGIN },
            body: JSON.stringify({
                error: error
            }),
        };

        callback(null, errorResponse);
        return;
        }

        const successResponse = {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin": COMMISSION_SITE_ORIGIN },
            body: JSON.stringify({ 
                messageId: info.messageId, 
                response: info.response 
            }),
        };

        callback(null, successResponse);
    });
};