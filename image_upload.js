'use strict';

const AWS = require('aws-sdk');
const { bucket } = require('./config')

module.exports.handle = (event, context, callback) => {
  var s3 = new AWS.S3();
  var personId = Date.now();
  var params = {
    Bucket: bucket,
    Key: 'photos/' + personId + '.png',
    ContentType: 'image/png',
    ACL: 'public-read',
    Expires: 300000000
  };
  var uploadUrl = s3.getSignedUrl('putObject', params);
  console.log('Signed URL', uploadUrl)
  callback(null, {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({ uploadUrl: uploadUrl, personId: personId })
  });
};
