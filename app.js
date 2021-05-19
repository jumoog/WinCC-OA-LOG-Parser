"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const AutoDetectDecoderStream = require('autodetect-decoder-stream');
const readline_1 = __importDefault(require("readline"));
const stream_1 = __importDefault(require("stream"));
const underscore_1 = __importDefault(require("underscore"));
const moment_1 = __importDefault(require("moment"));
const xml_1 = __importDefault(require("./xml"));
const layout = new xml_1.default();
const fileName = process.argv[2];
const instream = fs_1.default.createReadStream(fileName).pipe(new AutoDetectDecoderStream());
const outstream = new stream_1.default();
const rl = readline_1.default.createInterface(instream, outstream);
const pattern = new RegExp("^\s*([a-zA-Z0-9]+).*((19[0-9]{2}|2[0-9]{3}).(0[1-9]|1[012]).([123]0|[012][1-9]|31)) (([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]).([0-9]{3})),.*(INFO|WARNING|SEVERE|FATAL).*,");
const WARNING = "WARNING";
const SEVERE = "SEVERE";
const FATAL = "FATAL";
const INFO = "INFO";
let lines = [];
let text = [];
let levels = [];
let message = [];
let times = [];
let oldLine = "";
let lineCount = -1;
rl.on('line', (line) => {
    text.push(line);
    let match = pattern.exec(line);
    lineCount++;
    if (match !== null) {
        if (match[11] == INFO) {
            times.push(moment_1.default(`${match[2]} ${match[6]}`, 'YYYY.MM.DD h:mm:ss:SSS').valueOf());
            lines.push(lineCount);
            levels.push(INFO);
        }
        if (match[11] == WARNING) {
            times.push(moment_1.default(`${match[2]} ${match[6]}`, 'YYYY.MM.DD h:mm:ss:SSS').valueOf());
            lines.push(lineCount);
            levels.push(WARNING);
        }
        if (match[11] == SEVERE) {
            times.push(moment_1.default(`${match[2]} ${match[6]}`, 'YYYY.MM.DD h:mm:ss:SSS').valueOf());
            lines.push(lineCount);
            levels.push(SEVERE);
        }
        if (match[11] == FATAL) {
            times.push(moment_1.default(`${match[2]} ${match[6]}`, 'YYYY.MM.DD h:mm:ss:SSS').valueOf());
            lines.push(lineCount);
            levels.push(FATAL);
        }
    }
});
rl.on('close', () => {
    for (let i = 0; i < text.length; ++i) {
        if (underscore_1.default.indexOf(lines, i, true) !== -1) {
            if (oldLine !== "") {
                message.push(oldLine);
            }
            if (text.length === i) {
                message.push(oldLine);
            }
            oldLine = text[i] + "\r\n";
        }
        else {
            oldLine += text[i] + "\r\n";
        }
    }
    createXML(createItemObjects(levels, times, message));
});
function createItemObjects(levels, times, message) {
    let results = [];
    for (let k = 0; k < message.length; ++k) {
        let manager = message[k].match(/^\w+/);
        let number = message[k].match(/\(([^)]+)\)/);
        results.push(layout.format({
            level: levels[k],
            msg: message[k],
            app: manager[0],
            number: number[1],
            timestamp: times[k],
        }));
    }
    return results;
}
function createXML(data) {
    fs_1.default.writeFile(`${fileName}.xml`, String(data), (err) => {
        if (err) {
            console.error("cant write the file");
        }
    });
}
