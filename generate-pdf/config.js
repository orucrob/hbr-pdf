const YAML = require('yamljs')

/**
 * get array of fonts defined in config file
 * @param {string} configFile path for config file
 */
exports.getFontNames = configFile => {
    let config = YAML.load(configFile) || {}
    let fonts = []
    let defaultFont =
        (config.Default &&
            config.Default.options &&
            config.Default.options &&
            config.Default.options.font) ||
        undefined
    if (defaultFont) {
        fonts.push(defaultFont)
    }

    let fields = config.Fields || undefined
    if (fields) {
        for (var key in fields) {
            let font = (fields[key].options || {}).font || undefined
            if (font && fonts.indexOf(font) == -1) {
                fonts.push(font)
            }
        }
    }
    return fonts
}

/**
 * create empty value object for config
 */
exports.createVO = () => {
    return {
        configKey: undefined,
        configFile: undefined,
        pdfTemplateKey: undefined,
        pdfTemplateFile: undefined,
        invoiceKey: undefined,
        invoiceFile: undefined,
        fonts: [],
        fontFiles: {} //key is font, value is file (local path)
    }
}
