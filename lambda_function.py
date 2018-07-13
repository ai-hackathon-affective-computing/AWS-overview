import boto3
import json
import sys
import datetime
import os

def lambda_handler(event, context):

    try:

        max_labels = 10
        min_confidence = 80
        region = "eu-west-1"
        s3bucket = event['Records'][0]['s3']['bucket']['name']
        print (s3bucket)
        s3object = event['Records'][0]['s3']['object']['key']
        print (s3object)

        for label in detect_labels(s3bucket, s3object, max_labels, min_confidence, region):
        	print "{Name} - {Confidence}%".format(**label)

    except Exception as e:
        print(e)
        sys.exit(-1)


def detect_labels(bucket, key, max_labels, min_confidence, region):
	rekognition = boto3.client("rekognition", region)
	response = rekognition.detect_labels(
		Image={
			"S3Object": {
				"Bucket": bucket,
				"Name": key,
			}
		},
		MaxLabels=max_labels,
		MinConfidence=min_confidence,
	)
	return response['Labels']
