'use strict';

const AWS = require('aws-sdk');
const axios = require('axios');
require('dotenv').config();

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
        happiness += 0.3 * emotion.Confidence;
        break;
      case 'ANGRY':
      case 'DISGUSTED':
        happiness -= 0.5 * emotion.Confidence;
        break;
      case 'CONFUSED':
      case 'SAD':
        happiness -= 0.3 * emotion.Confidence;
        break;
      default:
        break;
    }
  });
  return Math.min(Math.max(happiness / 100, 0), 1);
};

const detectPerson = (s3Object, callback) => {
  var rekognition = new AWS.Rekognition();
  var params = {
    Image: { S3Object: s3Object },
    Attributes: [ 'ALL' ]
  }
  return rekognition.detectFaces(params, (error, response) => {
    if (error) {
      return callback(error, null);
    }
    console.log('Rekognition', response);
    var faceDetails = response.FaceDetails[0];
    if (!faceDetails) {
      return callback(null, null);
    }
    callback(null, {
      age: Math.round(faceDetails.AgeRange.Low + 0.5 * (faceDetails.AgeRange.High - faceDetails.AgeRange.Low)),
      gender: (faceDetails.Gender.Value == 'female') ? 0 : 1,
      has_sunglasses: (faceDetails.Sunglasses) ? 0 : 1,
      happiness: calculateHappiness(faceDetails)
    });
  });
};

const uploadPerson = (person) => {
  var s3 = new AWS.S3();
  s3.putObject({
    Bucket: 'affective-computing',
    Key: 'person.json',
    Body: JSON.stringify(person),
    ACL: 'public-read'
  }, (error, _) => {
    if (error) {
      console.error(error, null);
    } else {
      console.log('Uploaded person');
    }
  });
}

const postToAgent = (person) => {
  return axios.request({
    method: 'get',
    url: `${process.env.AGENT_URL}/observe`,
    params: Object.assign({ happiness: person.happiness })
  }).then(_ => {
    console.log('Posted happiness to agent');
  }).catch(error => {
    console.error(error);
  });
}

module.exports.handle = (event, context, callback) => {
  let s3Object = {
    Bucket: event.Records[0].s3.bucket.name,
    Name: event.Records[0].s3.object.key,
  }
  console.log('Image', s3Object);
  detectPerson(s3Object, (error, person) => {
    if (error) {
      return callback(error, null);
    }
    console.log('Person', person);
    uploadPerson(person);
    postToAgent(person);
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(person)
    });
  });
};
