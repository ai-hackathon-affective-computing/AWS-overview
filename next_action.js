'use strict';

const AWS = require('aws-sdk');
const axios = require('axios');
require('dotenv').config();

// const getPerson = (personId) => {
//   let s3 = new AWS.S3();
//   return new Promise((resolve, reject) => {
//     s3.getObject({
//       Bucket: 'affective-computing',
//       Key: `emotions/${personId}.json`
//     }, (error, response) => {
//       if (error) {
//         reject(error);
//       } else {
//         var person = JSON.parse(response.Body.toString());
//         resolve(person);
//       }
//     });
//   });
// };

const calculateHappiness = (faceDetails) => {
  var happiness = 0.5 * 100;
  if (faceDetails.Smile.Value) {
    happiness += 0.3 * faceDetails.Smile.Confidence;
  }
  faceDetails.Emotions.forEach(emotion => {
    switch (emotion.Type) {
      case 'HAPPY':
        happiness += 0.5 * emotion.Confidence;
        break;
      case 'CALM':
      case 'SURPRISED':
        happiness += 0.1 * emotion.Confidence;
        break;
      case 'ANGRY':
      case 'DISGUSTED':
        happiness -= 0.8 * emotion.Confidence;
        break;
      case 'CONFUSED':
      case 'SAD':
        happiness -= 0.5 * emotion.Confidence;
        break;
      default:
        break;
    }
  });
  return Math.min(Math.max(happiness / 100, 0), 1);
};

const getPerson = (personId) => {
  return new Promise((resolve, reject) => {
    var rekognition = new AWS.Rekognition();
    var params = {
      Image: {
        S3Object: {
          Bucket: 'affective-computing',
          Name: 'photos/' + personId + '.png'    
        }
      },
      Attributes: [ 'ALL' ]
    }
    return rekognition.detectFaces(params, (error, response) => {
      if (error) {
        return reject(error);
      }
      console.log('Rekognition', JSON.stringify(response));
      var faceDetails = response.FaceDetails[0];
      if (!faceDetails) {
        return resolve({
          age: 40,
          female: 0,
          has_sunglasses: 0,
          happiness: 0.5
        });
      }
      resolve({
        age: Math.round(faceDetails.AgeRange.Low + 0.5 * (faceDetails.AgeRange.High - faceDetails.AgeRange.Low)),
        female: (faceDetails.Gender.Value == 'female') ? 1 : 0,
        has_sunglasses: (faceDetails.Sunglasses) ? 0 : 1,
        happiness: calculateHappiness(faceDetails)
      });
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
  }).then(_ => console.log('CarAction', action)).catch(console.error)
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
  if (!event.queryStringParameters.personId) {
    return callback(null, {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: "Param personId missing"
    })
  }
  console.log('PersonID', event.queryStringParameters.personId);
  return getPerson(event.queryStringParameters.personId).then(person => {
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
