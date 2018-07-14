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
  if (!event.queryStringParameters || !event.queryStringParameters.music) {
    return callback(null, {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: "Param music missing"
    })
  }
  if (!event.queryStringParameters.route) {
    return callback(null, {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: "Param route missing"
    })
  }
  if (!event.queryStringParameters.step) {
    return callback(null, {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: "Param step missing"
    })
  }
  return getPerson().then(person => {
    var env = {
      music: parseInt(event.queryStringParameters.music),
      route: parseInt(event.queryStringParameters.route),
      step: parseInt(event.queryStringParameters.step)
    };
    Object.assign(env, person);
    console.log('Env', env);
    return getAction(env);
  }).then(response => {
    console.log('Response', response);
    if (response.action == 9) {
      carAction('horn_blow');
      carAction('door_unlock');
    }
    callback(null, {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(response)
    });
  }).catch(error => {
    console.error(error);
    callback(null, {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: error.toString() // TODO: Do not tell error message in real world scenario
    });
  });
};
