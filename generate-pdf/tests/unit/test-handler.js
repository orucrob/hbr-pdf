'use strict'

const pdf = require('../../pdf.js')
const config = require('../../config.js')
const chai = require('chai')
const YAML = require('yamljs')
const expect = chai.expect

describe('Tests generate PDF', function() {
    it('verifies no error', async () => {
        let conf = config.createVO()
        conf.pdfTemplateFile = 'tests/assets/template1.pdf'
        conf.configFile = 'tests/assets/template1.yaml'
        conf.invoiceFile = 'tests/assets/invoice1.pdf'

        conf.fontFiles['Pacifico.ttf'] = 'tests/assets/Pacifico.ttf'

        const result = await pdf.generateInvoice({
            config: conf,
            values: getExampleValues(conf.configFile)
        })

        expect(result).to.be.true
    })
})

const getExampleValues = configFile => {
    let config = YAML.load(configFile) || {}
    let values = {}
    let fields = config.Fields || undefined
    if (fields) {
        for (var key in fields) {
            values[key] = fields[key].example || 'Simple test value'
        }
    }
    return values
}
