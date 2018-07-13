'use strict';

const AWS = require('aws-sdk');

module.exports.handle = (event, context, callback) => {
  let s3 = new AWS.S3();
  callback(null, {
    statusCode: 200,
    body: JSON.stringify({

    })
  });
};
