import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

// TODO only set up budget in one stack (probably prod, once I have it)
const subscriberEmails = ["sam.roberts.1983@gmail.com"];

export const definition = new aws.budgets.Budget("MonthlyCostBudget", {
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
            subscriberEmailAddresses: subscriberEmails,
            threshold: 100,
            thresholdType: "PERCENTAGE",
        },
        {
            comparisonOperator: "GREATER_THAN",
            notificationType: "ACTUAL",
            subscriberEmailAddresses: subscriberEmails,
            threshold: 85,
            thresholdType: "PERCENTAGE",
        },
        {
            comparisonOperator: "GREATER_THAN",
            notificationType: "FORECASTED",
            subscriberEmailAddresses: subscriberEmails,
            threshold: 100,
            thresholdType: "PERCENTAGE",
        },
    ],
    timePeriodStart: "2023-10-01_00:00",
    timeUnit: "MONTHLY",
});
