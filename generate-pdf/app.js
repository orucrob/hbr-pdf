const AWS = require('aws-sdk')

const pdf = require('./pdf')
const s3 = require('./s3')
const config = require('./config')
const dynamodb = new AWS.DynamoDB()

const PDF_TABLE = process.env.PDF_TABLE
const INVOICE_TEMPLATES_DIR = 'invoice_templates'
const FONTS_DIR = 'invoice_templates'
const INVOICES_DIR = 'invoices'
const LOCAL_TMP_DIR = '/tmp'

const getLocalFilePath = key => `${LOCAL_TMP_DIR}/${key}`

/**
 * generate invoice based on template from S3 and save it back to S3 enriched by provided values
 */
const generateInvoice = async (templateKey, invoiceKey, values) => {
    let conf = config.createVO()
    conf.configKey = `${templateKey}.yaml`
    conf.configFile = getLocalFilePath(conf.configKey)
    conf.pdfTemplateKey = `${templateKey}.pdf`
    conf.pdfTemplateFile = getLocalFilePath(conf.pdfTemplateKey)
    conf.invoiceKey = invoiceKey
    conf.invoiceFile = getLocalFilePath(conf.invoiceKey)

    //download files from s3
    await s3.downloadFile(conf.configKey, conf.configFile)
    await s3.downloadFile(conf.pdfTemplateKey, conf.pdfTemplateFile)

    //find and download required fonts
    let fonts = config.getFontNames(conf.configFile)
    conf.fonts = fonts
    if (fonts) {
        for (let i = 0; i < fonts.length; i++) {
            let fontKey = `${FONTS_DIR}/${fonts[i]}`
            let fontFile = getLocalFilePath(fontKey)
            conf.fontFiles[fonts[i]] = fontFile
            await s3.downloadFile(fontKey, fontFile)
        }
    }

    //generate
    const result = await pdf.generateInvoice({
        config: conf,
        values
    })

    //upload file
    console.log(`Generated: ${result} . Uploading file: ${conf.invoiceKey}`)
    let ok = await s3.uploadFile(conf.invoiceKey, conf.invoiceFile)

    return ok
}

let response

exports.lambdaHandler = async (event, context) => {
    try {
        console.log('processing event: ', JSON.stringify(event))
        let recs = event.Records
        if (recs && recs.length > 0) {
            for (let i = 0; i < recs.length; i++) {
                let message = recs[i].body
                let messageObj = JSON.parse(message)
                // check required properties
                if (
                    !messageObj.templateId &&
                    !messageObj.invoiceId &&
                    !messageObj.requestId &&
                    !messageObj.userId &&
                    !messageObj.lobbyId &&
                    !messageObj.data
                ) {
                    console.log(
                        `Record body is missing required attributes (templateId, invoiceNo, data, requestId, userId, lobbyId). Record body: ${message}`
                    )
                    //TODO notify for correction
                } else {
                    let templateKey = `${INVOICE_TEMPLATES_DIR}/${
                        messageObj.templateId
                    }`
                    let invoiceKey = `${INVOICES_DIR}/${
                        messageObj.invoiceId
                    }.pdf`
                    let ok = await generateInvoice(
                        templateKey,
                        invoiceKey,
                        messageObj.data
                    )
                    console.log(`Invoice generated successfull: ${ok}`)

                    //create record in DB
                    let data = await updateDB(messageObj, invoiceKey)
                    console.log(`data updated in DB: ${data}`)
                }
            }
        }
    } catch (err) {
        console.log(err)
        return err
    }

    return response
}

const updateDB = async (messageObj, invoiceKey) => {
    var params = {
        TableName: PDF_TABLE,
        Key: {
            requestId: {
                S: messageObj.requestId
            }
        },

        ExpressionAttributeNames: {
            // '#requestId': 'requestId',
            '#userId': 'userId',
            '#lobbyId': 'lobbyId',
            '#created': 'created',
            '#updated': 'updated',
            '#data': 'data',
            '#fileKey': 'fileKey'
        },
        ExpressionAttributeValues: {
            // ':requestId': {
            //     S: messageObj.requestId
            // },
            ':userId': {
                S: messageObj.userId
            },
            ':lobbyId': {
                S: messageObj.lobbyId
            },
            ':created': {
                S: new Date().toISOString()
            },
            ':updated': {
                S: new Date().toISOString()
            },
            ':data': {
                S: JSON.stringify(messageObj)
            },
            ':fileKey': {
                S: invoiceKey
            }
        },
        UpdateExpression:
            'SET  #userId = :userId, #lobbyId = :lobbyId, #data = :data, #fileKey = :fileKey, #updated = :updated, #created = if_not_exists(#created , :created) ',
        ReturnValues: 'ALL_NEW'
    }

    let data = undefined
    try {
        data = await dynamodb.updateItem(params).promise()
    } catch (e) {
        console.log('update error:', e)
        throw e
    }
    return data
}
