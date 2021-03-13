import * as _ from 'lodash'
import * as cdk from '@aws-cdk/core'
import * as iam from '@aws-cdk/aws-iam'
import * as events from '@aws-cdk/aws-events'
import { ReplicationRule } from '../constructs/replication-rule'
import { App, Replica, Origin } from '../interfaces/config'

export class ReplicaStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const eventBus = new events.EventBus(this, `${App.Namespace}ReplicaBus`, {
      eventBusName: App.EventBusName,
    })
    new events.CfnEventBusPolicy(this, `ReplicaPolicy`, {
      eventBusName: App.EventBusName,
      statementId: `${App.Namespace}ReplicaStatement`,
      action: 'events:PutEvents',
      principal: Origin.AccountId,
    })

    const role = new iam.Role(this, 'CodeBuildRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      managedPolicies: [
        { managedPolicyArn: 'arn:aws:iam::aws:policy/AWSCodeCommitFullAccess' },
        { managedPolicyArn: 'arn:aws:iam::aws:policy/CloudWatchLogsFullAccess' },
      ],
    })
    _.forEach(Replica.Repositories, (repository) => {
      const props = { eventBus, role, repository }
      new ReplicationRule(this, `${repository.RepositoryName}-${repository.BranchName}-${repository.Region}-ReplicationRule`, props)
    })
  }

}
