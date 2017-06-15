const fs = require('fs')
const AutoDetectDecoderStream = require('autodetect-decoder-stream')
const readline = require('readline')
const stream = require('stream')
const _ = require('underscore')
const moment = require('moment')
const XmlLayout = require('./xml')
const layout = new XmlLayout()
const fileName = process.argv[2]
// encode the iso88591 bullshit to utf8
const instream = fs.createReadStream(fileName).pipe(new AutoDetectDecoderStream())
const outstream = new stream
const rl = readline.createInterface(instream, outstream)
const pattern = new RegExp("(PVSS|WCC).*((19[0-9]{2}|2[0-9]{3}).(0[1-9]|1[012]).([123]0|[012][1-9]|31)) (([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]).([0-9]{3})),.*(INFO|WARNING|SEVERE|FATAL).*,")
const WARNING = "WARNING"
const SEVERE = "SEVERE"
const FATAL = "FATAL"
const INFO = "INFO"

let lines = []
let text = []
let levels = []
let message = []
let times = []
let oldLine = ""
let lineCount = -1
rl.on('line', line => {
  text.push(line)
  match = pattern.exec(line)
  lineCount++
  if (match !== null) {
    // if LEVEL equals "INFO"
    if (match[11] == INFO) {
      times.push(moment(`${match[2]} ${match[6]}`).unix())
      lines.push(lineCount)
      levels.push(INFO)
    }
    // if LEVEL equals "WARNING"
    if (match[11] == WARNING) {
      times.push(moment(`${match[2]} ${match[6]}`).unix())
      lines.push(lineCount)
      levels.push(WARNING)
    }
    // if LEVEL equals "SEVERE"
    if (match[11] == SEVERE) {
      times.push(moment(`${match[2]} ${match[6]}`).unix())
      lines.push(lineCount)
      levels.push(SEVERE)
    }
    // if LEVEL equals "FATAL"
    if (match[11] == FATAL) {
      times.push(moment(`${match[2]} ${match[6]}`).unix())
      lines.push(lineCount)
      levels.push(FATAL)
    }
  }
})

rl.on('close', () => {
  for (let i = 0; i < text.length; ++i) {
    // is the current line number in the lines array
    // with fast binary search
    if (_.indexOf(lines, i, true) !== -1) {
      // if oldLine is not empty and line number was in the lines array a new message beginns
      // so push the message to the array
      if (oldLine !== "") {
        message.push(oldLine)
      }
      // if we reached the last line push the message to the array
      if (text.length === i) {
        message.push(oldLine)
      }
      // store line in oldLine
      oldLine = text[i] +"\r\n"
      // if the new line is from the previous message
    } else {
      // append line
      oldLine += text[i] +"\r\n"
    }
  }
  // create the XML File
  createXML(createItemObjects(levels, times, message))
})


function createItemObjects(levels, times, message) {
  let results = []
  // loop through message array
  for (let k = 0; k < message.length; ++k) {
    // extract manager name from message
    // its always the first word
    let manager = message[k].match(/^\w+/)
    // split with LEVEL
    let levelSplit = message[k].split((/INFO,|WARNING,|SEVERE,|FATAL,/))
    results.push(layout.format({
      level: levels[k],
      msg: message[k],
      app: manager[0],
      timestamp: times[k],
    }))
  }
  // return new array
  return results
}

function createXML(data) {
  fs.writeFile(
    `./${fileName}.xml`,
    // write array to json
    data,
    err => {
      if (err) {
        console.error("cant write the file")
      }
    }
  )
}
