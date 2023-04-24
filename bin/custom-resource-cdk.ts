#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CustomResourceCdkStack } from '../lib/custom-resource-cdk-stack';
// import { MyGitHubActionRole } from '../lib/github-action-role-stack';
import config from '../config.json';
// import { AwsCredentials, GitHubWorkflow } from 'cdk-pipelines-github';
import * as pipelines from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import { Stack, StackProps, Stage } from 'aws-cdk-lib';

const app = new cdk.App();

// One needs to manually set the Provider, despite what the documentation says
// new MyGitHubActionRole(app, 'MyGitHubActionRole', {
//   env: {
//     account: config['aws.deployment.accountId']
//   }
// });

class MyStage extends Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    new CustomResourceCdkStack(this, 'test-custom-resource', props);
  }
}

class MyPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const pipeline = new pipelines.CodePipeline(this, 'Pipeline', {
      crossAccountKeys: true,
      synth: new pipelines.ShellStep('Synth', {
        // Use a connection created using the AWS console to authenticate to GitHub
        // Other sources are available.
        input: pipelines.CodePipelineSource.connection('wuiscmc/cdk-playground', 'main', {
          connectionArn: 'arn:aws:codestar-connections:eu-north-1:552193173995:connection/ebc5a7d0-f606-436a-9467-55b84adfd416', // Created using the AWS console * });',
        }),
        commands: [
          'npm ci',
          'npm run build',
          'npx cdk synth',
        ],
      }),
    });

    pipeline.addStage(
      new MyStage(app, 'Prod', {
        env: {
          account: '682444753419', //sandbox, // config['aws.deployment.accountId'],
          region: config['aws.region']
        }
      })
    );
  }
}

new MyPipelineStack(app, 'PipelineStack', {
  env: {
    account: config['aws.deployment.accountId'],
    region: config['aws.region'],
  }
});


// const pipeline = new GitHubWorkflow(app, 'Pipeline', {
//   publishAssetsAuthRegion: config['aws.region'],
//   synth: new ShellStep('Build', {    
//     commands: [
//       'npm install',
//       'npm run build',
//       'npx cdk synth',
//     ],
//   }),
//   awsCreds: AwsCredentials.fromOpenIdConnect({
//     gitHubActionRoleArn: config['aws.github-role.arn'],
//   }),
// });

// const prodStage = new MyStage(app, 'Prod', {
//   env: {
//     account: config['aws.deployment.accountId'], 
//     region: config['aws.region']
//   }
// });

// pipeline.addStage(prodStage);