#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from '@aws-cdk/core'
import { OriginStack } from '../lib/stacks/origin-stack'
import { ReplicaStack } from '../lib/stacks/replica-stack'
import { App } from '../lib/interfaces/config'

const app = new cdk.App()
new OriginStack(app, `${App.Namespace}OriginStack`)
new ReplicaStack(app, `${App.Namespace}ReplicaStack`)