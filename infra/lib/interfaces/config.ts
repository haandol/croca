import { IReplicaAccount, IRepository } from './interface'

export namespace App {
  export const Namespace = 'Croca'
  export const EventBusName = `${App.Namespace.toLowerCase()}-replica`
}

export namespace Origin {
  export const AccountId = '213809038850'   // 12 digit number
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

export namespace Replica {
  export const AccountId = '924918149261'   // 12 digit number

  export const Repositories: IRepository[] = [
    {
      RepositoryName: 'myapp',
      BranchName: 'main',
      Region: 'us-west-2',
    }
  ]
}