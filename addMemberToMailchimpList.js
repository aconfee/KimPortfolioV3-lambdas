const axios = require('axios');
const GIVEAWAY_CORS_ORIGIN = require('appsettings').GIVEAWAY_CORS_ORIGIN;

module.exports.addMemberToMailchimpList = (event, context, callback) => {
    console.log("Creating mailchimp contestant.")
    const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
    if(!MAILCHIMP_API_KEY) {
        console.error("Please set environment variable MAILCHIMP_API_KEY for Mailchimp access.");
    }

    const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID;
    if(!MAILCHIMP_LIST_ID) {
        console.error("Please set environment variable MAILCHIMP_LIST_ID for Mailchimp list to add member to.");
    }

    const MAILCHIMP_SEGMENT_ID = process.env.MAILCHIMP_SEGMENT_ID;
    if(!MAILCHIMP_SEGMENT_ID) {
        console.error("Please set environment variable MAILCHIMP_SEGMENT_ID for Mailchimp tag to add to member.");
    }

    const addMemberToListUrl = `https://us15.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members`;
    const addTagToMemeberUrl = `https://us15.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/segments/${MAILCHIMP_SEGMENT_ID}/members`;
    
    const { firstname, lastname, email } = JSON.parse(event.body);

    console.log(`Contestant information is: ${firstname} ${lastname} ${email}.`);

    axios.post(addMemberToListUrl, {
        "email_address": email,
        "status": "subscribed",
        "merge_fields": {
          "FNAME": firstname,
          "LNAME": lastname
        }
      },{
        headers: {
          "Content-Type": "application/json",
          "Authorization": `apikey ${MAILCHIMP_API_KEY}`
        }
      }).then(response => {   
        console.log("Contestant added.");
        axios.post(addTagToMemeberUrl, {"email_address": email},{
          headers: {
            "Content-Type": "application/json",
            "Authorization": `apikey ${MAILCHIMP_API_KEY}`
          }
        }).then(response => {   
          console.log("Tag added.");
          const successResponse = {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin": GIVEAWAY_CORS_ORIGIN },
            body: JSON.stringify({
              response: {message: `${email} added to list ${MAILCHIMP_LIST_ID} with tag ${MAILCHIMP_SEGMENT_ID}.`}
            }),
          };
      
          callback(null, successResponse);
        })
        .catch(error => {
          console.error(error);
        
          var errorMessage;
          var errorStatus;
          if(error.response){ 
            errorMessage = error.response.data.detail;
            errorStatus = error.response.data.status
          }
          else {
            errorMessage = `Error ${error.message}`;
            errorStatus = 500;
          }
  
          const errorResponse = {
            statusCode: errorStatus,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({
              error: errorMessage
            }),
          };
      
          callback(null, errorResponse);
        });

      })
      .catch(error => {
        console.error(error);

        var errorMessage;
        var errorStatus;
        if(error.response){ 
          errorMessage = error.response.data.detail;
          errorStatus = error.response.data.status
        }
        else {
          errorMessage = `Error ${error.message}`;
          errorStatus = 500;
        }

        const errorResponse = {
          statusCode: errorStatus,
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({
            error: errorMessage
          }),
        };
    
        callback(null, errorResponse);
      });
  };