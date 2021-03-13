import { IReplicaAccount, IRepository } from './interface'

export namespace App {
  export const Namespace = 'Croca'
}

export namespace Origin {
  export const AccountId = ''   // 12 digit number
  export const Region = 'ap-northeast-2'
  export const RoleName = `${App.Namespace}ReplicationRole`
  export const RoleArn = `arn:aws:iam::${AccountId}:role/${RoleName}`

  export const ReplicaAccounts: IReplicaAccount[] = []
  export const RepositoryNames: string[] = []
  export const BranchNames: string[] = []
}

export namespace Replica {
  export const AccountId = ''   // 12 digit number
  export const EventBusName = `${App.Namespace.toLowerCase()}-replica`

  export const Repositories: IRepository[] = []
}