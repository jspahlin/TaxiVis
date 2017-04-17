// put our chord handling code here!

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index; 
}
// Given a set of taxi data, figure out what streets are the starting and ending points.
// returns a 1D array of street names.
function relevantStreets(data) {
  var resultArray = new Array();
  for(var i = 0; i < data.length; ++i) {
    var d = data[i];
    var starting_street = d.streetnames[0];
    var ending_street = d.streetnames[d.streetnames.length-1];
    resultArray.push(starting_street);
    resultArray.push(ending_street);
  }
  var result = resultArray.filter(onlyUnique);
  return result;
}
