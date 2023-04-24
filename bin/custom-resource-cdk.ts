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

// new MyAmazingPipelineStack(app, 'MyAmazingPipeline');

// one needs to manually set the Provider, despite what the documentation says
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
  publishAssetsAuthRegion: 'eu-west-1',
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
  // primaryOutputDirectory: './cdk.out',
});

// Build the stages
// const betaStage = new MyStage(app, 'Beta', { env: BETA_ENV });
// const prodStage = new MyStage(app, 'Prod', { env: PROD_ENV });
pipeline.addStage(new MyStage(app, 'Account1', {
  env: {
    account: config['aws.deployment.accountId'], 
    region: 'eu-west-1'
  }
}));

pipeline.addStage(new MyStage(app, 'Account2', {
  env: {
    account: '682444753419', 
    region: 'eu-west-1'
  }
}));

pipeline.addStage(new MyStage(app, 'Account3', {
  env: {
    account: '656811865361', 
    region: 'eu-west-1'
  }
}));

// Add the stages for sequential build - earlier stages failing will stop later ones:
// pipeline.addStage(betaStage);
// pipeline.addStage(prodStage);
// pipeline.addStage(prodStage);
// pipeline.addStage(prodStage);

// OR add the stages for parallel building of multiple stages with a Wave:
// const wave = pipeline.addWave('Wave');
// wave.addStage(betaStage);
// wave.addStage(prodStage);
