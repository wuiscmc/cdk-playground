#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CustomResourceCdkStack } from '../lib/custom-resource-cdk-stack';
import { MyGitHubActionRole } from '../lib/github-action-role-stack';
import config from '../config.json';
import { AwsCredentials, GitHubWorkflow } from 'cdk-pipelines-github';
import { ShellStep } from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';

const app = new cdk.App();

// One needs to manually set the Provider, despite what the documentation says
// new MyGitHubActionRole(app, 'MyGitHubActionRole', {
//   env: {
//     account: config['aws.deployment.accountId']
//   }
// });

class MyStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    new CustomResourceCdkStack(this, 'test-custom-resource', props);
  }
}

const pipeline = new GitHubWorkflow(app, 'Pipeline', {
  publishAssetsAuthRegion: config['aws.region'],
  synth: new ShellStep('Build', {    
    commands: [
      'npm install',
      'npm run build',
      'npx cdk synth',
    ],
  }),
  awsCreds: AwsCredentials.fromOpenIdConnect({
    gitHubActionRoleArn: config['aws.github-role.arn'],
  }),
});

const prodStage = new MyStage(app, 'Prod', {
  env: {
    account: config['aws.deployment.accountId'], 
    region: config['aws.region']
  }
});

pipeline.addStage(prodStage);