import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

import * as util from "./util";

const githubConnection = new aws.codestarconnections.Connection("FuzzyPipelineSource", {
    providerType: "GitHub"
});

const bucket = new aws.s3.BucketV2("FuzzyPipelineBucket", {});

const bucketKeyAliasName = "alias/bucketKey";

const bucketKey = new aws.kms.Key("FuzzyPipelineBucketKey", {});
const bucketKeyAlias = new aws.kms.Alias("FuzzyPipelineBucketKeyAlias", {
    targetKeyId: bucketKey.keyId,
    name: bucketKeyAliasName,
});

const assumeBuildRolePolicy = util.assumeRolePolicyJson("codebuild");

const buildExecutionPolicy = pulumi.all([bucket.arn, bucketKey.arn])
    .apply(([bucketArn, bucketKeyArn]) => aws.iam.getPolicyDocument({
        statements: [
            {
                effect: "Allow",
                actions: [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                ],
                resources: ["*"],
            },
            {
                effect: "Allow",
                actions: [
                    "s3:GetObject",
                    "s3:GetObjectVersion",
                    "s3:GetBucketVersioning",
                    "s3:PutObjectAcl",
                    "s3:PutObject",
                ],
                resources: [
                    bucketArn,
                    `${bucketArn}/*`,
                ],
            },
            {
                effect: "Allow",
                actions: [
                    "kms:GenerateDataKey",
                    "kms:Decrypt",
                ],
                resources: [bucketKeyArn],
            },
        ]
    }).then(policy => policy.json));

const buildRole = new aws.iam.Role("FuzzyPipelineBuildRole", {
    name: "FuzzyPipelineBuildRole",
    assumeRolePolicy: assumeBuildRolePolicy,
    inlinePolicies: [{
        name: "FuzzyPipelineBuildExecutionPolicy",
        policy: buildExecutionPolicy,
    }],
});

const build = new aws.codebuild.Project("FuzzyPipelineBuild", {
    name: "FuzzyPipelineBuild",
    description: "Build fuzzy_rust",
    serviceRole: buildRole.arn,
    source: { type: "CODEPIPELINE" },
    artifacts: { type: "CODEPIPELINE" },
    environment: {
        type: "LINUX_CONTAINER",
        computeType: "BUILD_GENERAL1_SMALL",
        image: "rust:latest",
    },
    cache: {
        type: "LOCAL",
        modes: [
            "LOCAL_DOCKER_LAYER_CACHE",
            "LOCAL_SOURCE_CACHE",
        ],
    },
});

const assumeRolePolicy = util.assumeRolePolicyJson("codepipeline");

const executionPolicy = pulumi.all([bucket.arn, bucketKey.arn, githubConnection.arn])
    .apply(([bucketArn, bucketKeyArn, githubArn]) => aws.iam.getPolicyDocument({
        statements: [
            {
                effect: "Allow",
                actions: [
                    "s3:GetObject",
                    "s3:GetObjectVersion",
                    "s3:GetBucketVersioning",
                    "s3:PutObjectAcl",
                    "s3:PutObject",
                ],
                resources: [
                    bucketArn,
                    `${bucketArn}/*`,
                ],
            },
            {
                effect: "Allow",
                actions: [
                    "kms:GenerateDataKey",
                    "kms:Decrypt",
                ],
                resources: [bucketKeyArn],
            },
            {
                effect: "Allow",
                actions: ["codestar-connections:UseConnection"],
                resources: [githubArn],
            },
            {
                effect: "Allow",
                actions: [
                    "codebuild:BatchGetBuilds",
                    "codebuild:StartBuild",
                ],
                resources: ["*"],
            },
        ],
    }).then(policy => policy.json));

const role = new aws.iam.Role("FuzzyPipelineRole", {
    name: "FuzzyPipelineRole",
    assumeRolePolicy: assumeRolePolicy,
    inlinePolicies: [{
        name: "FuzzyPipelineExecutionPolicy",
        policy: executionPolicy,
    }],
});

export const definition = new aws.codepipeline.Pipeline("FuzzyPipeline", {
    roleArn: role.arn,
    artifactStores: [{
        location: bucket.bucket,
        type: "S3",
        encryptionKey: {
            id: bucketKeyAlias.arn,
            type: "KMS",
        },
    }],
    stages: [
        {
            name: "Source",
            actions: [{
                name: "Source",
                category: "Source",
                owner: "AWS",
                provider: "CodeStarSourceConnection",
                version: "1",
                outputArtifacts: ["source_output"],
                configuration: {
                    ConnectionArn: githubConnection.arn,
                    FullRepositoryId: "SamRoberts/fuzzy_rust",
                    BranchName: "main",
                },
            }],
        },
        {
            name: "Build",
            actions: [{
                name: "Build",
                category: "Build",
                owner: "AWS",
                provider: "CodeBuild",
                inputArtifacts: ["source_output"],
                outputArtifacts: ["build_output"],
                version: "1",
                configuration: {
                    ProjectName: "FuzzyPipelineBuild",
                },
            }],
        },
    ],
});

