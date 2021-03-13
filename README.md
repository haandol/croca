# Croca - Replicate Cross Account Codecommint Repositories

This repository is for replicating codecommit repositories across accounts

<img src="img/architecture.png" />

> If you are looking for replicating codecommit repositories across regions on same account, check [**Picapica**](https://github.com/haandol/picapica) out.

# Prerequisites

- Nodejs 14.x
- AWS Account and Locally configured AWS credential

# Installation

Install project dependencies

```bash
$ npm i -g cdk@1.93.0

$ cd infra
$ npm i
$ cdk bootstrap
```

# Usage

This CDK project is consists of 2 parts,

- [**OriginStack**](/infra/lib/stacks/origin-stack.ts)
- [**ReplicaStack**](/infra/lib/stacks/replica-stack.ts)

## OriginStack

OriginStack must be deployed on the origin account having repositories to replicate to other accounts

### Setup config

Edit [**lib/interfaces/config.ts**](infra/lib/interfaces/config.ts) and fill variables under Origin namespace

```bash
$ vim lib/interfaces/config.ts
```

Here is an example of the configuration for origin

```javascript
export namespace Origin {
  export const AccountId = '213809038850'
  export const Region = 'ap-northeast-2'
  export const RoleName = `${App.Namespace}ReplicationRole`
  export const RoleArn = `arn:aws:iam::${AccountId}:role/${RoleName}`

  export const ReplicaAccounts: IReplicaAccount[] = [
    {
      AccountId: '924918149261',
      Region: 'ap-northeast-2',
      EventBusName: App.EventBusName,
    },
    {
      AccountId: '735029250372',
      Region: 'ap-northeast-1',
      EventBusName: App.EventBusName,
    }
  ]
  export const RepositoryNames: string[] = ['myapp', 'otherapp']
  export const BranchNames: string[] = ['main', 'release']
}
```

### Deploy OriginStack on Origin Account

```bash
$ cdk deploy CrocaOriginStack --require-approval never --profile default
```

## ReplicaStack

ReplicaStack should be deployed on the replica account having repositories to be replicated from the origin account

### Setup config

Edit [**lib/interfaces/config.ts**](infra/lib/interfaces/config.ts) and fill variables under Replica namespace

```bash
$ vim lib/interfaces/config.ts
```

Here is an example of the configuration for replica

```javascript
export namespace Replica {
  export const AccountId = '924918149261'   // 12 digit number

  export const Repositories: IRepository[] = [
    {
      RepositoryName: 'myapp',
      BranchName: 'main',
      Region: 'us-west-2',
    },
    {
      RepositoryName: 'otherapp',
      BranchName: 'release',
      Region: 'ap-northeast-2',
    },
  ]
}
```

### Deploy ReplicaStack on Replica Account

```bash
$ cdk deploy CrocaReplicaStack --require-approval never --profile replica
```

# Test

```bash
$ aws codecommit create-repository --repository-name myapp
```

```bash
$ pip install git-remote-codecommit
$ git clone codecommit::ap-northeast-2//myapp myapp
```

```bash
$ cd myapp
$ cat > README.md
# This is MyApp for testing

$ git add README.md
$ git commit -m "add README"
```

# Cleanup

destroy provisioned cloud resources for both accounts

```bash
$ cdk destroy "*"
```