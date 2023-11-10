import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

import * as lambda from "./lambda";
import * as budget from "./budget";

const budgetDefinition = budget.definition;
const lambdaDefinition = lambda.definition;

export const lambdaUrl = lambdaDefinition.functionUrl;
