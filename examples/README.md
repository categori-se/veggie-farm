# Runnable learning example

Start with [Build something you care about](../docs/building/README.md) and `node examples/building/walkthrough.mjs` for an offline tour of attributed evidence, shared plant geometry and portable garden records.

# Optional deployment configuration

No account configuration is needed for the community build. Keep real configuration outside source control. A custom Cognito domain must explicitly bind hostname, region and user pool in the same-origin configuration:

```json
{"version":1,"region":"us-east-1","userPoolId":"us-east-1_ExamplePool","clientId":"exampleclient123","hostedUiBaseUrl":"https://auth.example.org","customHostedUi":{"hostname":"auth.example.org","region":"us-east-1","userPoolId":"us-east-1_ExamplePool"},"redirectUri":"https://garden.example.org/login","logoutUri":"https://garden.example.org/login","scopes":["openid","email","profile"]}
```

This is not a working identity provider. Never add a client secret. Existing deployments using a custom domain must add this binding before deploying the updated validator; deployed assets have not been changed by source preparation. Community mode keeps notebook data local. See the extension contracts before enabling account storage.
