import pkg from 'web-streams-polyfill/polyfill';
const { ReadableStream } = pkg;
if (typeof globalThis.ReadableStream === "undefined") {
    globalThis.ReadableStream = ReadableStream;
}
import { generate } from 'critical'


generate({
    inline: false,
    base: '_site/',
    src: 'index.html',
    // Output results to file
    target: {
        css: '../_includes/critical.css',
        uncritical: '../css/uncritical.css',
    },
    ignore: ['.active'],
    width: 1300,
    height: 900,
});