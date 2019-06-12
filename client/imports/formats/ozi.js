/**
 * @file
 * Ozi parser module for the task creator.
 */
import './export/ozi.html';

	/**
   * @todo
   * Worse check ever : File containing "OziExplorer" !
   */
  var check = function(text, filename) {
    var lines = text.split("\n");
    var nb = 0;
    var searchOzi = lines[0].match(/oziexplorer/i);
    if (searchOzi) {
      return true;
    }
    return false;
  }
  
  var parse = function(text, filename) {
    var lines = text.split("\n");
    var words = [];
    // for each lines.
    for (var i = 0; i < lines.length; i++) {
      // Replace all bad formated whitespace at the begining and end of the line..
      lines[i] = lines[i].replace(/^\s\s*/, '').replace(/\s\s*$/, '');
      // If the first character is an interger.
      if (!isNaN(parseInt(lines[i].charAt(0)))) {
        var word = lines[i].split(",");
        words.push(word);
      }
    }
    
    // Storing the turnpoints.
    var tps = [];
    for (var i = 0; i < words.length; i++) {
      var tp =  {
        filename : filename,
        id : words[i][1],
        x : words[i][2],
        y : words[i][3],
        z : ftToMeter(words[i][14]),
        name : words[i][10],
      };
      tps.push(tp);
    }
    
    return {
      'waypoints' : tps,
    };
  }
  
  var exporter = function(waypoints) {
    for (var i = 0; i < waypoints.length; i++) {
      waypoints[i].feet = (waypoints[i].z > 0) ? Math.round(waypoints[i].z * 3.2808399) : 0;
    }
    var data = Blaze.toHTMLWithData(Template.exportOZI, {waypoints : waypoints});
    return new Blob([data], {'type': "text/plain"});
  }

  function ftToMeter(ft) {
    return Math.round(ft * 0.3048);
  }

  let extension = '.wpt';
	let name = "OziExplorer";

  export {
    check,
    extension,
    exporter,
    name,
    parse,
  }
