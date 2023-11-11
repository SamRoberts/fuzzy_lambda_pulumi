Fuzzy Service Infrastructure
============================

Pulumi code to set up [fuzzy]-as-a-service.

Tentative End State
-------------------

I am still learning Pulumi, and also learning AWS' public offerings, so this will be very rough to start with. In the long run, the plan is to implement the following:

1. Host a fuzzy service using lambda. This gives me hosting, as well as availability, scalability, and load balancing.
1. Changes to the service are driven by AWS CodePipeline. Combined with specific build/deploy/test steps, this:
    1. picks up changes in GitHub,
    1. builds and unit tests them,
    1. deploys in dev while monitoring alarms,
    1. runs integration tests in dev, and finally
    1. deploys in prod while monitoring alarms.
1. **TODO:** still not sure of the best way to run a canary.
1. API Gateway provides an internet-facing API, handling:
    1. authentication/authorisation,
    1. throttling,
    1. usage plans for (purely hypothetical!) paying customers,
    1. hooking into AWS Cert Manager for SSL.
1. CloudWatch to collect metrics, display dashboards, and generate alarms.
1. **TODO:** still not sure of the best way to implement an Andon cord.
1. Use multiple accounts and IAM roles to control access to resources.
    1. I’ll try to imagine I have a team of developers with a rotating ops role who can access prod.
1. AWS Budgets alert on costs, and ideally trigger the Andon cord if necessary.

Manual actions required along the way
-------------------------------------

Ideally we would find solutions to minimize the following, or at least reduce any risk:

1. Pulumi is running as a user with manually granted permissions.
1. Finish setting up codestar connection for pipeline source stage.
1. Running pulumi up after every config change.

Minor TODOs
-----------

1. Pipeline
    1. **TODO:** lifecycle rule for pipeline bucket.

[fuzzy]: https://github.com/SamRoberts/fuzzy_rust
