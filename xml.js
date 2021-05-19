"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var XMLWriter = require('xml-writer');
class XmlLayout {
    constructor() { }
    format(event) {
        const xw = new XMLWriter();
        xw.startElement('log4j:event');
        xw.writeAttribute('timestamp', event.timestamp.toString());
        xw.writeAttribute('level', event.level.toUpperCase());
        xw.writeAttribute('number', event.number);
        this.writeMessageElement(xw, event.msg);
        this.writePropertiesElement(xw, event);
        xw.endElement();
        return xw.toString();
    }
    writeMessageElement(xw, msg) {
        xw.writeElement('log4j:message', msg);
    }
    writePropertiesElement(xw, event) {
        xw.startElement('log4j:properties');
        this.writeDataElement(xw, 'log4japp', event.app);
        xw.endElement();
    }
    writeDataElement(xw, name, value) {
        xw.startElement('log4j:data');
        xw.writeAttribute('name', name);
        xw.writeAttribute('value', value);
        xw.endElement();
    }
}
exports.default = XmlLayout;
