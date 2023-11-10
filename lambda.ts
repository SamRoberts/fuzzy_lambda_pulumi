import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

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
