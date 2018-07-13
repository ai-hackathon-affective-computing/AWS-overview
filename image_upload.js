'use strict';

const AWS = require('aws-sdk');

module.exports.handle = (event, context, callback) => {
  var s3 = new AWS.S3();
  var params = {
    Body: Buffer.from(event.body, 'base64'),
    Bucket: 'affective-computing',
    Key: 'photos/' + (new Date()).toString() + '.jpg',
    ContentType: event.headers['content-type']
  };
  s3.putObject(params, (error, response) => {
    if (error) {
      console.error(error);
      return callback(error, null);
    }
    callback({
      statusCode: 200,
      body: 'OK'
    });
  });
};
