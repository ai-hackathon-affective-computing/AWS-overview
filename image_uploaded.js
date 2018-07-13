'use strict';

const AWS = require('aws-sdk');

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
    Attributes: [ 'AgeRange', 'Smile', 'Sunglasses', 'Gender', 'Emotions' ]
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
      age: (int)(faceDetails.AgeRange.Low + 0.5 * (faceDetails.AgeRange.High - faceDetails.AgeRange.Low)),
      gender: (faceDetails.Gender.Value == 'female') ? 0 : 1,
      has_sunglasses: (faceDetails.Sunglasses) ? 0 : 1,
      happiness: calculateHappiness(faceDetails)
    });
  });
};

const uploadPerson = (person, callback) => {
  var s3 = new AWS.S3();
  s3.putObject({
    Bucket: 'affective-computing',
    Key: 'person.json',
    Body: JSON.stringify(person)
  }, (error, _) => {
    callback(error, null);
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
    uploadPerson(person, (error) => {
      if (error) {
        callback(error, null);
      } else {
        callback(null, {
          statusCode: 200,
          body: JSON.stringify(person)
        });
      }
    });
  });
};
