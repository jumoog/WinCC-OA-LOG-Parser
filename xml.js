var XMLWriter = require('xml-writer');

var XmlLayout = function (){};
XmlLayout.prototype.format = function(event)
{
	xw = new XMLWriter();

	xw.startElement('log4j:event');
	xw.writeAttribute('timestamp', event.timestamp.toString());
	xw.writeAttribute('level', event.level.toUpperCase());

	this.writeMessageElement(xw, event.msg);
	this.writePropertiesElement(xw, event);

	xw.endElement();

	return xw.toString();
};

XmlLayout.prototype.writeMessageElement = function(xw, msg)
{
	xw.writeElement('log4j:message', msg);
};

XmlLayout.prototype.writePropertiesElement = function(xw, event)
{
	xw.startElement('log4j:properties');

	this.writeDataElement(xw, 'log4japp', event.app);

	xw.endElement();
};

XmlLayout.prototype.writeDataElement = function(xw, name, value)
{
	xw.startElement('log4j:data')
	xw.writeAttribute('name', name);
	xw.writeAttribute('value', value);
	xw.endElement();
};

module.exports = XmlLayout;
