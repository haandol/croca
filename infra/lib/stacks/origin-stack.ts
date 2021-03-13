import * as _ from 'lodash'
import * as cdk from '@aws-cdk/core'
import * as iam from '@aws-cdk/aws-iam'
import * as events from '@aws-cdk/aws-events'
import * as eventsTargets from '@aws-cdk/aws-events-targets'
import { App, Origin } from '../interfaces/config'

export class OriginStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    this.createCodecommitRule()
    this.createAssumeRole()
  }

  /*
   * Create role to put events to custom event bus on replica account
   */
  private createCodecommitRule() {
    const eventReplicationRole = new iam.Role(this, `EventReplicationRole`, {
      assumedBy: new iam.ServicePrincipal('events.amazonaws.com'),
    })
    events.EventBus.grantAllPutEvents(eventReplicationRole)

    const targets = _.map(Origin.ReplicaAccounts, (account) => {
      const eventBusArn = `arn:aws:events:${account.Region}:${account.AccountId}:event-bus/${account.EventBusName}`
      const replicaEventBus = events.EventBus.fromEventBusArn(this, `ReplicaBus`, eventBusArn)
      return new eventsTargets.EventBus(replicaEventBus, { role: eventReplicationRole })
    })

    new events.Rule(this, `${App.Namespace}ReplicateRule`, {
      description: 'Propagate event to replica account',
      ruleName: `${App.Namespace}Replicate`,
      eventPattern: {
        source: ['aws.codecommit'],
        detail: {
          event: ['referenceCreated', 'referenceUpdated'],
          repositoryName: Origin.RepositoryNames,
          referenceName: Origin.BranchNames,
        }
      },
      targets,
    })
  }

  /*
   * Create role to support clone repository from codebuild project on replica account
   */
  private createAssumeRole() {
    const codeCommitRole = new iam.Role(this, `CodecommitRole`, {
      roleName: Origin.RoleName,
      assumedBy: new iam.CompositePrincipal(
        ..._.map(Origin.ReplicaAccounts, (account) => new iam.AccountPrincipal(account.AccountId)),
      ),
    })
    codeCommitRole.addToPolicy(new iam.PolicyStatement({
      actions: ['codecommit:*'],
      resources: ['*'],
    }))
  }

}
