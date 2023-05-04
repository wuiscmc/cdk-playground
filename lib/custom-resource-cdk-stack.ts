import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as customResources from 'aws-cdk-lib/custom-resources';
import * as logs from 'aws-cdk-lib/aws-logs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import path = require('path');

export class CustomResourceCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaFn = new NodejsFunction(this, 'nodejs-lambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, `/../custom-resources/index.ts`),
      logRetention: logs.RetentionDays.ONE_DAY,
    });

    const myProvider = new customResources.Provider(this, 'MyProvider2', {
      onEventHandler: lambdaFn,
    });

    new cdk.CustomResource(this, 'Resource1', { serviceToken: myProvider.serviceToken });
  }
}
