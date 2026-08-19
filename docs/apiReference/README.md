API reference best practices

- For resposiding with messages and errors use backend/src/contasnts/apiResponse.ts unesless a custom response is nesccary 
- The repositry uses strict contract based api devlopment before buidling any changes to the backend pls define a contact first. Zod handles the runtime validation for api resposnes and requests if there is any requirment for runtie validation. OpenAPI is used to is a source of trutuh at build time to make sure apis are designeged as perstandard spec file to make sure it's easier to provide sdks and devlopment kits in the future and make it easiser to rewrite teh codebase when the neeed arsises.
- 