import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

import * as lambda from "./lambda";
import * as budget from "./budget";
import * as pipeline from "./pipeline";

const budgetDefinition = budget.definition;
const lambdaDefinition = lambda.definition;
const pipelineDefinition = pipeline.definition;

export const lambdaUrl = lambdaDefinition.functionUrl;
