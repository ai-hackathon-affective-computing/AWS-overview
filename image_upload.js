'use strict';

const AWS = require('aws-sdk');

module.exports.handle = (event, context, callback) => {
  var s3 = new AWS.S3();
  var params = {
    Bucket: 'affective-computing',
    Key: 'photos/' + Date.now() + '.png',
    ContentType: 'image/png',
    ACL: 'public-read'
  };
  var uploadUrl = s3.getSignedUrl('putObject', params);
  console.log('Signed URL', uploadUrl)
  callback(null, {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({ uploadUrl: uploadUrl })
  });
};
