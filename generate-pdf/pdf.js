const hummus = require('hummus')
const YAML = require('yamljs')
const mkdirp = require('mkdirp')
const getDirName = require('path').dirname

const createFolderForFile = file => {
    return new Promise((resolve, reject) => {
        mkdirp(getDirName(file), function(err) {
            if (err) {
                reject(err)
            } else {
                resolve(true)
            }
        })
    })
}

/**
 * generate invoice
 */
exports.generateInvoice = async ({ config, values }) => {
    try {
        let pdfConf = YAML.load(config.configFile)

        let fieldsConf = pdfConf && pdfConf.Fields
        console.log('Fields:', JSON.stringify(fieldsConf))
        if (fieldsConf) {
            let defaultOptions =
                (pdfConf && pdfConf.Default && pdfConf.Default.options) || {}

            createFolderForFile(config.invoiceFile)
            var pdfWriter = hummus.createWriterToModify(
                config.pdfTemplateFile,
                {
                    modifiedFilePath: config.invoiceFile
                }
            )

            var pageModifier = new hummus.PDFPageModifier(pdfWriter, 0, true)
            let ctx = pageModifier.startContext().getContext()
            //let pdfDoc = new HummusRecipe(templateFile, getFilePath(invoiceKey))
            console.log('starting editing page')
            //pdfDoc = pdfDoc.editPage(1)
            let data = values || {}
            for (var key in fieldsConf) {
                console.log(`processing key:${key}`)
                //if (!fieldsConf.hasOwnProperty(key)) continue
                if (data[key]) {
                    console.log(
                        'Adding field:',
                        key,
                        data[key],
                        JSON.stringify(fieldsConf[key])
                    )

                    ctx.writeText(
                        data[key] + '',
                        fieldsConf[key].x || 0,
                        fieldsConf[key].y || 0,
                        getOptions(
                            fieldsConf[key].options,
                            defaultOptions,
                            config,
                            pdfWriter
                        )
                    )

                    // pdfDoc = pdfDoc.text(
                    //     values[key] + '',
                    //     fieldsConf[key].x || 0,
                    //     fieldsConf[key].y || 0,
                    //     fieldsConf[key].options || {}
                    // )
                } else {
                    console.log(`No value for key: ${key}`)
                }
            }
            // pageModifier
            //     .startContext()
            //     .getContext()
            //     .writeText('Test Text', 80, 80, {
            //         font: pdfWriter.getFontForFile(
            //             'C:/Users/robert.hikl/Projects/HBR/playground/hbr-pdf/Pacifico.ttf'
            //         ),
            //         size: 20,
            //         colorspace: 'gray',
            //         color: 0x00
            //     })

            console.log(`ending page : ${config.invoiceFile}`)
            pageModifier.endContext().writePage()
            //let a = pdfDoc.endPage()
            console.log(`ending  PDF`)
            pdfWriter.end()
            //let ret = await endPDF(a)
            console.log(`DONE ending page and PDF: ${config.invoiceFile}`)
            return true
        } else {
            //wrong configuration
            return false
        }
    } catch (err) {
        console.log(err)
        console.log(
            `Unable to generate invoice: ${config.pdfTemplateFile} ${
                config.invoiceFile
            } ${values}`
        )
        return false
    }
}

const FONTS = {}

/**
 * update option for writing the text
 * @param {Object} options option defined for field
 * @param {Object} defaultOptions default options defined for whole document
 * @param {Object} config configuration object with keys and files (for templates, fonts, ...)
 * @param {Object} pdfWriter hummusjs pdf writer for getting the font required to write text
 */
const getOptions = (options, defaultOptions, config, pdfWriter) => {
    let ret = { ...defaultOptions, ...options }
    if (!FONTS[ret.font]) {
        FONTS[ret.font] = pdfWriter.getFontForFile(config.fontFiles[ret.font])
    }
    ret.font = FONTS[ret.font]
    return ret
}
