import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

export function assumeRolePolicyJson(service: string): Promise<string> {
    return aws.iam.getPolicyDocument({
        statements: [{
            effect: "Allow",
            principals: [{
                type: "Service",
                identifiers: [`${service}.amazonaws.com`],
            }],
            actions: ["sts:AssumeRole"],
        }],
    }).then(doc => doc.json);
}
