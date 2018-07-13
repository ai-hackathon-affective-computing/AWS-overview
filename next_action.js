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

const getAction = (environment) => {
  return axios.get({
    method: 'get',
    url: `${provess.env.AGENT_URL}/next_action`,
    params: Object.assign({ music_on: false }, person)
  }).then(response => response.data)
};

module.exports.handle = (event, context, callback) => {
  return getPerson().then(person => {
    var env = {
      music_on: (!!(event.queryStringParameters || {}).music_on) ? 1 : 0
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
