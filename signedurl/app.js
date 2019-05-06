const AWS = require('aws-sdk')

const s3 = new AWS.S3()
const BUCKET = process.env.BUCKET
const INVOICES_DIR = 'invoices'

let response

exports.lambdaHandler = async (event, context) => {
    try {
        console.log('processing event: ', JSON.stringify(event))
        let invoiceId = (event.pathParameters || {}).invoiceId

        let invoiceKey = `${INVOICES_DIR}/${invoiceId}.pdf`

        let url = getSignedUrl(invoiceKey)
        response = {
            statusCode: 200,
            body: JSON.stringify({
                url
            })
        }
    } catch (err) {
        console.log(err)
        return err
    }

    return response
}

/**
 * get signed url for 'getObject' operation
 */
const getSignedUrl = key => {
    let params = { Bucket: BUCKET, Key: key, Expires: 900 } //Defaults to 15 minutes.
    let url = s3.getSignedUrl('getObject', params)
    console.log('The URL is', url)
    return url
}
