import boto3
import json
import sys
import datetime
import os

def lambda_handler(event, context):

    try:
        s3 = boto3.client('s3', region_name='eu-west-1')

        s3bucket = event['Records'][0]['s3']['bucket']['name']
        print (s3bucket)
        s3object = event['Records'][0]['s3']['object']['key']
        print (s3object)

        response = s3.detect_labels(Image={'S3Object':{'Bucket':s3bucket,'Name':s3object}})

        print('Detected labels for ' + fileName)
        for label in response['Labels']:
            print (label['Name'] + ' : ' + str(label['Confidence']))
