const fs = require('fs')
const AutoDetectDecoderStream = require('autodetect-decoder-stream')
const readline = require('readline')
const stream = require('stream')
const _ = require('underscore')
const fileName = process.argv[2]
// encode always to UTF8
const instream = fs.createReadStream(fileName).pipe(new AutoDetectDecoderStream())
const outstream = new stream
const rl = readline.createInterface(instream, outstream)
// regex pattern to detect new manager entries
const pattern = new RegExp("(PVSS|WCC).*((19[0-9]{2}|2[0-9]{3}).(0[1-9]|1[012]).([123]0|[012][1-9]|31)) (([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]).([0-9]{3})),.*(INFO|WARNING|SEVERE|FATAL).*,")
const WARNING = "WARNING"
const SEVERE = "SEVERE"
const FATAL = "FATAL"
const INFO = "INFO"

let lines = []
let text = []
let levels = []
let message = []
let dates = []
let times = []
let oldLine = ""
let lineCount = 0
rl.on('line', line => {
  text.push(line)
  match = pattern.exec(line)
  lineCount++
  if (match !== null) {
    // if LEVEL equals "INFO"
    if (match[11] == INFO) {
      dates.push(match[2])
      times.push(match[6])
      lines.push(lineCount)
      levels.push(INFO)
    }
    // if LEVEL equals "WARNING"
    if (match[11] == WARNING) {
      dates.push(match[2])
      times.push(match[6])
      lines.push(lineCount)
      levels.push(WARNING)
    }
    // if LEVEL equals "SEVERE"
    if (match[11] == SEVERE) {
      dates.push(match[2])
      times.push(match[6])
      lines.push(lineCount)
      levels.push(SEVERE)
    }
    // if LEVEL equals "FATAL"
    if (match[11] == FATAL) {
      dates.push(match[2])
      times.push(match[6])
      lines.push(lineCount)
      levels.push(FATAL)
    }
  }
})

rl.on('close', () => {
  for (let i = 0; i < text.length; ++i) {
    // checks if the current line number is in the lines array
    // with fast binary search (67 times faster with 12 mb log)
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
      oldLine = text[i]
      // if the new line is from the previous message
    } else {
      // append line
      oldLine += text[i] +"\r\n"
    }
  }
  // create the JSON File
  createJson(createItemObjects(levels, dates, times, message))
})


function createItemObjects(levels, dates, times, message) {
  // empty result array
  let results = []
  // loop through message array
  for (let k = 0; k < message.length; ++k) {
    // extract manager name from message
    // its always the first word
    let manager = message[k].match(/^\w+/)
    // split with LEVEL
    let levelSplit = message[k].split((/INFO,|WARNING,|SEVERE,|FATAL,/))
    results.push({
      manager: manager[0],
      level: levels[k],
      date: dates[k],
      time: times[k],
      //remove whitespace at beginning of line
      message: levelSplit[1].replace(/^ +/gm, '')
    })
  }
  // return new array
  return results
}

function createJson(data) {
  fs.writeFile(
    `./${fileName}.json`,
    // write array to json
    JSON.stringify(data),
    err => {
      if (err) {
        console.error("cant write the file")
      }
    }
  )
}
