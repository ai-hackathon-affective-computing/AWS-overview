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

const carAction = (action) => {
  axios.request({
    method: 'get',
    url: `https://bmw-api.hackathons.de/vehicles/${process.env.VEHICLE_ID}/services/${action}/`,
    headers: {
      'x-api-key': process.env.CAR_API_KEY
    }
  }).then(_ => console.log('Honked the horn')).catch(console.error)
}

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
    console.log('Response', response);
    if (response.action == 'HORN_BLOW') {
      carAction('horn_blow');
    } else if (response.action == 'DOOR_UNLOCK') {
      carAction('door_unlock');
    }
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
