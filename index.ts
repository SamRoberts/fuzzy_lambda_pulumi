import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

// TODO only set up budget in one stack (probably prod, once I have it)
const budgetSubscriberEmails = ["sam.roberts.1983@gmail.com"];

const budget = new aws.budgets.Budget("MonthlyCostBudget", {
    name: "MonthlyCostBudget",
    budgetType: "COST",
    costTypes: {
        includeCredit: false,
        includeRefund: false,
    },
    limitAmount: "3.0",
    limitUnit: "USD",
    notifications: [
        {
            comparisonOperator: "GREATER_THAN",
            notificationType: "ACTUAL",
            subscriberEmailAddresses: budgetSubscriberEmails,
            threshold: 100,
            thresholdType: "PERCENTAGE",
        },
        {
            comparisonOperator: "GREATER_THAN",
            notificationType: "ACTUAL",
            subscriberEmailAddresses: budgetSubscriberEmails,
            threshold: 85,
            thresholdType: "PERCENTAGE",
        },
        {
            comparisonOperator: "GREATER_THAN",
            notificationType: "FORECASTED",
            subscriberEmailAddresses: budgetSubscriberEmails,
            threshold: 100,
            thresholdType: "PERCENTAGE",
        },
    ],
    timePeriodStart: "2023-10-01_00:00",
    timeUnit: "MONTHLY",
});

const lambdaExecutionAssumeRolePolicy = aws.iam.getPolicyDocument({
    statements: [{
        effect: "Allow",
        principals: [{
            type: "Service",
            identifiers: ["lambda.amazonaws.com"],
        }],
        actions: ["sts:AssumeRole"],
    }],
});

const lambdaExecutionPolicy = aws.iam.getPolicyDocument({
    statements: [{
        effect: "Allow",
        actions: [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents",
        ],
        resources: ["arn:aws:logs:*:*:*"], // TODO can I lock this down a bit more?
    }],
});

const lambdaExecutionRole = new aws.iam.Role("FuzzyLamdaExecutionRole", {
    name: "FuzzyLambdaExecutionRole",
    assumeRolePolicy: lambdaExecutionAssumeRolePolicy.then(policy => policy.json),
    inlinePolicies: [{
        name: "FuzzyLambdaExecutionPolicy",
        policy: lambdaExecutionPolicy.then(policy => policy.json),
    }],
});

const lambda = new aws.lambda.Function("FuzzyLambda", {
    name: "FuzzyLambda",
    packageType: "Zip",
    // TODO how to make this code reference more robust?
    code: new pulumi.asset.FileArchive("../fuzzy_rust/target/lambda/fuzzy_lambda/bootstrap.zip"),
    handler: "bootstrap",
    role: lambdaExecutionRole.arn,
    runtime: "provided.al2",
    architectures: ["arm64"],
});

const lambdaUrl = new aws.lambda.FunctionUrl("FuzzyLambdaUrl", {
    functionName: lambda.arn,
    authorizationType: "AWS_IAM",
});

export const url = lambdaUrl.functionUrl;
