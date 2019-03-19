const axios = require('axios');
const GIVEAWAY_CORS_ORIGIN = require('appsettings').GIVEAWAY_CORS_ORIGIN;

var getErrorResponse = (error) => {
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

  return errorResponse;
};

var logEvent = (message, email) => {
  var messageObject = {
    email: email,
    message: message
  };
  console.log(messageObject);
};

module.exports.addMemberToMailchimpList = (event, context, callback) => {
    const { firstname, lastname, email } = JSON.parse(event.body);
    logEvent("Processing contestant submission.", email);

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

    const mailchimpCustomerListMemebers = `https://us15.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members`;
    const mailchimpCustomerListGiveawaySegmentMembers = `https://us15.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/segments/${MAILCHIMP_SEGMENT_ID}/members`;
    const requestHeaders = {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `apikey ${MAILCHIMP_API_KEY}`
      }
    };

    // GET MAILCHIMP MEMBERS WITH GIVEAWAY TAG 
    axios.get(mailchimpCustomerListGiveawaySegmentMembers, requestHeaders)
    .then(response => {
      logEvent("Retreived members with giveaway tag.", email);
      var existingTagged = response.data.members.filter(member => member.email_address === email);
      var emailAlreadyEnteredGiveaway = existingTagged.length > 0;

      // RETURN BAD IF ALREADY ENTERED WITH TAG
      if(emailAlreadyEnteredGiveaway) {
        logEvent("Member already entered giveaway.", email);
        const duplicateEntryResponse = {
          statusCode: 400,
          headers: { "Access-Control-Allow-Origin": GIVEAWAY_CORS_ORIGIN },
          body: JSON.stringify({
            response: {message: `${email} is already entered in the giveaway.`}
          }),
        };

        callback(null, duplicateEntryResponse);
        return;
      }
      
      // GET MAILCHIMP MEMEBERS ON CUSTOMERS LIST
      axios.get(`${mailchimpCustomerListMemebers}?offset=0&count=10000`, requestHeaders)
      .then(response => {
        logEvent("Retreived members subscribed to list.", email);
        var existingMember = response.data.members.filter(member => member.email_address === email);
        var emailAlreadySubscribed = existingMember.length > 0;

        // SUBSCRIBE NEW MEMBER AND ADD TAG IF THEY DON'T EXIST
        if(!emailAlreadySubscribed){
          logEvent("Member not yet subscribed.", email);
          axios.post(mailchimpCustomerListMemebers, { "email_address": email, "status": "subscribed", "merge_fields": { "FNAME": firstname, "LNAME": lastname }}, requestHeaders)
            .then(response => {   
              logEvent("Member subscribed to list.", email);
              axios.post(mailchimpCustomerListGiveawaySegmentMembers, {"email_address": email}, requestHeaders)
                .then(response => {   
                  logEvent("Tag applied to new member.", email);
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
                logEvent("Error adding tag to new member.", email);
                console.error(error);
              
                callback(null, getErrorResponse(error));
              });
            })
            .catch(error => {
              logEvent("Error subscribing member.", email);
              console.error(error);
            
              callback(null, getErrorResponse(error));
            });
        // ADD TAG TO EXISTING SUBSCRIBER
        } else {
          axios.post(mailchimpCustomerListGiveawaySegmentMembers, {"email_address": email}, requestHeaders)
                .then(response => {   
                  logEvent("Tag applied to existing member.", email);
                  const successResponse = {
                    statusCode: 200,
                    headers: { "Access-Control-Allow-Origin": GIVEAWAY_CORS_ORIGIN },
                    body: JSON.stringify({
                      response: {message: `Tag ${MAILCHIMP_SEGMENT_ID} added to existing subscriber ${email} on list ${MAILCHIMP_LIST_ID}.`}
                    }),
                  };
            
                  callback(null, successResponse);
              })
              .catch(error => {
                logEvent("Error adding tag to existing member.", email);
                console.error(error);
              
                callback(null, getErrorResponse(error));
              });
        }        
      })
      .catch(error => {
        logEvent("Error getting list of subscribers.", email);
        console.error(error);
      
        callback(null, getErrorResponse(error));
      });

    })
    .catch(error => {
      logEvent("Error getting list of members with tag.", email);
      console.error(error);
    
      callback(null, getErrorResponse(error));
    });
  };