const axios = require('axios');

const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
if(!INSTAGRAM_ACCESS_TOKEN) {
  console.error("Please set environment variable INSTAGRAM_ACCESS_TOKEN for instagram feed.");
}

module.exports.getInstagramFeed = (event, context, callback) => {
    const count = 20;
    const url = `https://api.instagram.com/v1/users/1381993170/media/recent/?access_token=${INSTAGRAM_ACCESS_TOKEN}&count=${count}`;
  
    axios.get(url).then(response => {
      const images = response.data.data.map(feedItem => {
        return feedItem.images.low_resolution.url;
      });
  
      const successResponse = {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "http://www.kimgreenough.com" },
        body: JSON.stringify({
          response: images
        }),
      };
  
      callback(null, successResponse);
    })
    .catch(error => {
  
      const errorResponse = {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          error: error
        }),
      };
  
      callback(null, errorResponse);
    });
  };