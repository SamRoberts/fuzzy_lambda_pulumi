import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

import * as util from "./util";

const lambdaExecutionAssumeRolePolicy = util.assumeRolePolicyJson("lambda");

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
}).then(policy => policy.json);

const lambdaExecutionRole = new aws.iam.Role("FuzzyLamdaExecutionRole", {
    name: "FuzzyLambdaExecutionRole",
    assumeRolePolicy: lambdaExecutionAssumeRolePolicy,
    inlinePolicies: [{
        name: "FuzzyLambdaExecutionPolicy",
        policy: lambdaExecutionPolicy,
    }],
});

const lambdaFunction = new aws.lambda.Function("FuzzyLambda", {
    name: "FuzzyLambda",
    packageType: "Zip",
    // TODO how to make this code reference more robust?
    code: new pulumi.asset.FileArchive("../fuzzy_rust/target/lambda/fuzzy_lambda/bootstrap.zip"),
    handler: "bootstrap",
    role: lambdaExecutionRole.arn,
    runtime: "provided.al2",
    architectures: ["arm64"],
});

export const definition = new aws.lambda.FunctionUrl("FuzzyLambdaUrl", {
    functionName: lambdaFunction.arn,
    authorizationType: "AWS_IAM",
});
