import { Stack, StackProps } from "aws-cdk-lib";
import { GitHubActionRole } from "cdk-pipelines-github";
import { Construct } from "constructs";

export class MyGitHubActionRole extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const provider = new GitHubActionRole(this, 'github-action-role', {
      repos: ['wuiscmc/cdk-playground'],
      provider: GitHubActionRole.existingGitHubActionsProvider(this),
    });
  }
}