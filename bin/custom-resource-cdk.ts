#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CustomResourceCdkStack } from '../lib/custom-resource-cdk-stack';
import config from '../config.json';
import { AwsCredentials, GitHubActionRole, GitHubWorkflow } from 'cdk-pipelines-github';
import * as ghPipelines from 'cdk-pipelines-github';
import { ShellStep } from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';

const app = new cdk.App();

// 1. Stackset living in the management account with the OpenIdConnectProvider
// 2. GHAction Role in the target account (maps repo with role)
// 3. That's it?


// same thing CICD uses in their accounts
// a) if the provider is not passed, then it creates one
// b) if the provider is already in the account: GitHubActionRole.existingGitHubActionsProvider(this)
// with option b. we can distribute the provider first and then reference it in the role

// This Stack could be provided as a stackset cause its configuration is static
// export class GithubOIDCProvider extends cdk.Stack {
//   constructor(scope: Construct, id: string, props?: cdk.StackProps) {
//     super(scope, id, props);
    
//     // with option b. we can distribute the provider first and then reference it in the role
//     new iam.OpenIdConnectProvider(this, 'github-oidc-provider', {
//       url: 'https://token.actions.githubusercontent.com',
//       clientIds: ['sts.amazonaws.com']
//     });
//   }
// }

// // // this is the role that picks the provider and creates the OIDC role
// export class GitHubOIDCRole extends cdk.Stack {
//   constructor(scope: Construct, id: string, props?: cdk.StackProps) {
//     super(scope, id, props);
    
//     new GitHubActionRole(this, 'github-action-role', {
//       repos: ['wuiscmc/cdk-playground'],
//       provider: GitHubActionRole.existingGitHubActionsProvider(this) // created in the GithubOIDCProvider stack
//     });
//   }
// }
// const props = {};
// // const props = {
// //   env: {
// //     account: config['aws.deployment.accountId']
// //   }
// // };
// const githubOIDCProvider = new GithubOIDCProvider(app, 'GithubOIDCProvider', props);
// const githubOIDCRole = new GitHubOIDCRole(app, 'GitHubOIDCRole', props);


// githubOIDCRole.addDependency(githubOIDCProvider); // just so we can deploy them in the same go


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
    gitHubActionRoleArn: `arn:aws:iam::552193173995:role/GitHubActionRole`,
  }),
});

pipeline.addStageWithGitHubOptions(new MyStage(app, 'Prod', {  
  env: { 
    account: config['aws.deployment.accountId'], 
    region: config['aws.region']
  }
}));
