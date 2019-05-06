# hbr-pdf

Examples how we can use hummusjs with lambda to generate pdf files based on pdf template

## How does it work?

### Generate PDF

Take a look into `./generate-pdf/app.js`
Event type: SQS

1. prepare - find correct keys and templates
2. download files (templates) from s3
3. process input data and templates to generate new PDF
4. uplouad generated file to s3

### Download generated PDF

Then there is a `./signedurl/app.js` lambda for getting the signed url for generated file
Event type: API

## Deploying

```bash
sam build
cp .\hummus.node .\.aws-sam\build\GeneratePdfFunction\node_modules\hummus\binding\
sam package --output-template-file packaged.yaml --s3-bucket <bucket-to-deploy>
sam deploy --template-file .\packaged.yaml --stack-name hbr-pdf --capabilities CAPABILITY_IAM
```

Then create folders in S3 bucket based on constants in `./generate-pdf/app.js`

### TODO:

-   skip copying hummus.node binding, which is specific for nodejs8.1 lambda environment. It should be specified & downloaded within 'npm install' (build time)
-   automate creation of folders in S3 and move constants to env variables
-   include test data and describe how to test it
-   update permissions in template to reflect minimal needs
