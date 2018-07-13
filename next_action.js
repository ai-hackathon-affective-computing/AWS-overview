'use strict';

const AWS = require('aws-sdk');
const axios = require('axios');
require('dotenv').config();

const getPerson = () => {
  let s3 = new AWS.S3();
  return new Promise((resolve, reject) => {
    s3.getObject({
      Bucket: 'affective-computing',
      Key: 'person.json'  
    }, (error, response) => {
      if (error) {
        reject(error);
      } else {
        var person = JSON.parse(response.Body.toString());
        resolve(person);
      }
    });
  });
};

const getAction = (env) => {
  return axios.request({
    method: 'get',
    url: `${process.env.AGENT_URL}/next_action`,
    params: env
  }).then(response => response.data);
};

module.exports.handle = (event, context, callback) => {
  if (!event.queryStringParameters || !event.queryStringParameters.music_on) {
    return callback(null, { statusCode: 400, body: "Param music_on missing" })
  }
  if (!event.queryStringParameters.step) {
    return callback(null, { statusCode: 400, body: "Param step missing" })
  }
  return getPerson().then(person => {
    var env = {
      music_on: parseInt(event.queryStringParameters.music_on),
      step: parseInt(event.queryStringParameters.step)
    };
    Object.assign(env, person);
    console.log('Env', env);
    return getAction(env);
  }).then(response => {
    callback(null, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(response)
    });
  }).catch(error => {
    console.error(error);
    callback(error, null);
  });
};
