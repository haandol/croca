import * as cdk from '@aws-cdk/core'
import * as iam from '@aws-cdk/aws-iam'
import * as logs from '@aws-cdk/aws-logs'
import * as events from '@aws-cdk/aws-events'
import * as eventTargets from '@aws-cdk/aws-events-targets'
import * as cb from '@aws-cdk/aws-codebuild'
import { IRepository } from '../interfaces/interface'
import { Origin } from '../interfaces/config'

interface IProps {
  eventBus: events.IEventBus
  role: iam.IRole
  repository: IRepository
}

export class ReplicationRule extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: IProps) {
    super(scope, id)

    const logGroup = new logs.LogGroup(this, `ReplicaLogGroup`, {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })
    const buildSpec = this.createBuildSpec(props.repository)
    const project = this.createCodeBuildProject(props.role, buildSpec)

    new events.Rule(this, `ReplicaRule`, {
      eventBus: props.eventBus,
      eventPattern: {
        source: ['aws.codecommit'],
        detail: {
          event: ['referenceCreated', 'referenceUpdated'],
          repositoryName: [props.repository.RepositoryName],
          referenceName: [props.repository.BranchName],
        },
      },
      targets: [
        new eventTargets.CloudWatchLogGroup(logGroup),
        new eventTargets.CodeBuildProject(project),
      ],
    })
  }

  private createCodeBuildProject(role: iam.IRole, buildSpec: cb.BuildSpec): cb.IProject {
    const project = new cb.Project(this, `SyncProject`, {
      buildSpec,
      role,
      environment: {
        buildImage: cb.LinuxBuildImage.STANDARD_5_0,
        computeType: cb.ComputeType.SMALL,
      },
    })
    project.addToRolePolicy(new iam.PolicyStatement({
      actions: ['sts:AssumeRole'],
      resources: ['*'],
    }))
    return project
  }

  private createBuildSpec(repository: IRepository): cb.BuildSpec {
    const installCommands: string[] = [
      `pip install git-remote-codecommit`,

      `aws sts get-caller-identity`,
      `export ORIG_AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID`,
      `export ORIG_AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY`,
      `export ORIG_AWS_SESSION_TOKEN=$AWS_SESSION_TOKEN`,
    ]
    const preBuildCommands: string[] = [
      `aws sts assume-role --role-arn ${Origin.RoleArn} --role-session-name CrocaCode | jq '.Credentials' -r > amz.auth.json`,
      `cat amz.auth.json`,
    ]
    const buildCommands: string[] = [
      `export AWS_ACCESS_KEY_ID=$(cat amz.auth.json | jq '.AccessKeyId' -r)`,
      `export AWS_SECRET_ACCESS_KEY=$(cat amz.auth.json | jq '.SecretAccessKey' -r)`,
      `export AWS_SESSION_TOKEN=$(cat amz.auth.json | jq '.SessionToken' -r)`,

      `aws sts get-caller-identity`,
      `git clone --mirror codecommit::${Origin.Region}://${repository.RepositoryName} ${repository.RepositoryName}`,
      `cd ${repository.RepositoryName}`,

      `export AWS_ACCESS_KEY_ID=$ORIG_AWS_ACCESS_KEY_ID`,
      `export AWS_SECRET_ACCESS_KEY=$ORIG_AWS_SECRET_ACCESS_KEY`,
      `export AWS_SESSION_TOKEN=$ORIG_AWS_SESSION_TOKEN`,
      `aws sts get-caller-identity`,

      `git remote set-url --push origin codecommit::${repository.Region}://${repository.RepositoryName}`,
      `git push origin`,
      `cd ..`
    ]

    return cb.BuildSpec.fromObject({
      version: '0.2',
      phases: {
        install: {
          commands: installCommands,
        },
        pre_build: {
          commands: preBuildCommands,
        },
        build: {
          commands: buildCommands
        }
      },
    })
  }

}