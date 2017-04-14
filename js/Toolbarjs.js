// javascript that handles toolbar on click calls
var visualizations = ["barchart", "scatterplot", "linechart"];
function showChart(chart) {
  for(id in visualizations) {
    document.getElementById(id).style.display = "none";
  }
  document.getElementById(chart).style.display = "block";
}
