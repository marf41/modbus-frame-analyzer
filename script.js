var welcome = 'Work in progress.\nInsert frame or packet.\nSupported functions: ';
var supported = [];
for (var i = 1; i < 255; i++) { if (analyze(null, null, false, i)) { supported.push(i); } }
welcome += supported.join(', ') + '.';

function word(arr, a, b) {
  if (!arr) { return -1; }
  if (typeof arr === 'undefined') { return -1; }
  if (typeof arr[a] === 'undefined') { return -1; }
  if (typeof arr[b] === 'undefined') { return -1; }
  return (arr[a] << 8) + arr[b];
}

function lencheck(arr, start, calclen) {
  var len = arr.length - start - 6;
  return (len == calclen ? '==' : '<>') + ' ' + len;
}

function decodefunc(f) {
  const fmap = [
    'NULL',
    'Read Coils',
    'Read Discrete Inputs',
    'Read Multiple Holding Registers',
    'Read Input Registers',
    'Write Single Coil',
    'Write Single Holding Register',
    'Read Exception Status (SERIAL)',
    'Diagnostic (SERIAL)',
    'NO FUNCTION', // 9
    'NO FUNCTION', // 10
    'Get Com Event Counter (SERIAL)',
    'Get Com Event Log (SERIAL)',
    'NO FUNCTION', // 13
    'NO FUNCTION', // 14
    'Write Multiple Coils',
    'Write Multiple Holding Registers',
    'Report Server ID (SERIAL)',
    'NO FUNCTION', // 18
    'NO FUNCTION', // 19
    'Read File Record',
    'Write File Record',
    'Mask Write Register',
    'Read/Write Multiple Registers',
    'Read FIFO Queue'
  ];
  fmap[43] = 'Read Device Identification / Encapsulated Interface Transport';
  var name = fmap[f] || 'UNKNOWN FUNCTION';
  return f + ' - ' + name;
}

function pad(n, l, c) {
  return String(n).padStart(l, c || ' ');
}

function analyze(f, arr, short, check) {
  function list_registers(d, len, off, amount, start) {
    var out = '';
    var or = 0;
    for (var i = 0; i < len; i++) {
      var n = i * 2;
      var val = word(d, off + n, off + n + 1);
      out += 'Register ' + pad(i + 1, 5) + (start ? (' @ address ' + pad(i + start, 5)) : '') + ': ' + pad(val, 5) + '\n';
      or |= val;
    }
    if (or == 0) { out += 'All registers are ZERO.\n'; }
    return out;
  }
  const fmap = [];
  var start = word(arr, 0, 1);
  var amount = word(arr, 2, 3);
  fmap[3] = function(d) {
    var out = '';
    if (d.length == 4) {
      out += 'REQUEST: Read ' + amount + ' of registers from address ' + start + '. ';
    } else {
      var len = d[0] / 2;
      out += len + ' registers follow.\n';
      out += list_registers(d, len, 1, amount);
    }
    return out;
  }
  fmap[16] = function(d) {
    var out = '';
    if (d.length == 4) { out += 'RESPONSE: '; }
    out += 'Set ' + amount + ' registers from address ' + start + '. ';
    if (d[4]) {
      var len = d[4] / 2;
      out += len + ' registers follow.' + (amount == len ? ' OK.' : ' AMOUNT MISMATCH!') + '\n';
      out += list_registers(d, len, 5, amount, start);
    }
    return out;
  }
  if (check) { return fmap[check]; }
  if (f == 0) { return ''; }
  var outarr = arr;
  if (short) { outarr =  arr.slice(0, 10); outarr.push('...'); }
  out = 'Payload: ' + outarr.join(', ');
  if (fmap[f]) { out += '\n' + fmap[f](arr) + '\n' + '\n'; } else { out += ' FUNCTION UNSUPPORTED BY ANALYZER'; }
  return out;
}

function parse(arr, start) {
  var transaction = word(arr, start + 0, start + 1);
  var len = word(arr, start + 4, start + 5);
  var proto = word(arr, start + 2, start + 3);
  var func = arr[start + 7];
  var starts = [];
  var short = false;
  if (typeof func === 'undefined') { return 'Not a Modbus frame - no function code.'; }
  if (func == 0) { short = true; }
  if (len > 255) { short = true; }
  if (proto != 0) {
    if ((typeof start === 'undefined') || (start != 0)) { return 'Not a Modbus frame.'; }
    for (var i = 2; i < arr.length - 3; i++) {
      if ((arr[i] == 0) && (arr[i+1] == 0) && (arr[i+3] > 0)) { starts.push(i - 2); }
    }
    for (var i = 0; i < starts.length; i++) {
      starts[i] = pad(starts[i], 5) + ' - ' + parse(arr, starts[i]);
    }
    return (`
This doesn't parse as Modbus frame!
${word(arr, 12, 13) == 0x0800 ? ('Trying to parse as whole IPv4 packet (click here to remove first 54 bytes):\n' + parse(arr, 54)) : ''}
${starts.length ? 'Seeking possible frame starts: ' : ''}
${starts.join('\n')}
    `);
  }
  var out = [
    `Transaction ID: ${pad(transaction, 5)}`,
    `Protocol ID: ${proto} - ${proto == 0 ? 'OK' : 'Error'}`,
    `Length: ${pad(len, 5)} ${lencheck(arr, start, len)}`,
    `Unit ID: ${arr[start + 6]}`,
    `Function code: ${decodefunc(func)}`,
    `${analyze(arr[start + 7], arr.slice(start + 8), short)}`
  ];
  if (short) { out.splice(1, 1); }
  return out.join(short ? '. ' : '\n');
}

function parsetext(src) {
  if (src.length == 0) { return welcome; }
  var srctrim = src.replace(/\s/g, '');
  if (srctrim.length % 2 != 0) { return('Not a valid hex string (uneven length).'); }
  var sarr = srctrim.match(/[0-9a-z]{2}/gi);
  var arr = sarr.map(t => parseInt(t, 16));
  return(parse(arr, 0));
}

function pair(frameid, resultid) {
  var frame = document.getElementById(frameid);
  var result = document.getElementById(resultid);
  if (frame && result) {
    var parseframe = function() { result.innerText = parsetext(frame.value); }
    frame.oninput = parseframe;
    result.onclick = function() { if (frame.value.length < 108) { return; } frame.value = String(frame.value).substring(108); parseframe(); }
    parseframe();
  }
}
pair('frame1', 'result1');
pair('frame2', 'result2');
pair('frame3', 'result3');