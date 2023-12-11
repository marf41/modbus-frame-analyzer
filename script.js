var frame = document.getElementById('frame');
var results = document.getElementById('results');

if (frame && results) {
  var sarr = frame.innerText.replace(/\s/g, '').match(/[0-9a-z]{2}/gi);
  var arr = sarr.map(t => parseInt(t, 16));
  results.innerText = arr;
}
