// Start of Mastiffe manual testing code.
// (C) 2011 Ken Brazier, Automation Excellence

// Trim for IE
if(typeof String.prototype.trim !== 'function') {
  String.prototype.trim = function() {
    return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
  }
}

jsonOut = null;
testno = 0;
testcases = null;
current_test_step = null;
finishingTestSteps = null;
loadjQuery = function() {
	// TODO: Load a spinner.
	loadjQuery.getScript("/files/mastiffe/javascript/jquery-1.4.4.min.js");
	loadjQuery.tryReady(0); // Wait until jQuery loads before using it.
}

// dynamically load any javascript file.
loadjQuery.getScript = function(filename) {
	var script = document.createElement('script')
		script.setAttribute("type","text/javascript")
		script.setAttribute("src", filename)
		if (typeof script!="undefined")
			document.getElementsByTagName("head")[0].appendChild(script)
}
loadjQuery.tryReady = function(time_elapsed) {
	// Continually polls to see if jQuery is loaded.
	if (typeof $ == "undefined") { // if jQuery isn't loaded yet...
		if (time_elapsed <= 5000) { // and we havn't given up trying...
			setTimeout("loadjQuery.tryReady(" + (time_elapsed + 200) + ")", 200); // set a timer to check again in 200 ms.
		} else {
			alert("Timed out while loading jQuery.")
		}
	} else {
		// Any code to run after jQuery loads goes here!
		// First, load the CSS for jQuery UI.
		$("head").append("<link>");
		css = $("head").children(":last");
		css.attr({
		      rel:  "stylesheet",
		      type: "text/css",
		      href: "/files/mastiffe/css/jquery-ui-1.8.10.custom.css"
		      });

		// Init some global arrays.
		jsonOut = new Array();
		testcases = new Array();

		// Push a header onto jsonOut.
		jsonOut.push(new Array("report:<b>Step</b>", "report:<b>Expected</b>", "report:<b>Result</b>"));

		// Create the div to load pages into.
		// var testTextDiv = $('<div id="test-text-div"></div>');
		var testTextDiv = document.createElement("div");
		testTextDiv.id = "test-text-div";
		testTextDiv.style.display = "none";
		$('body').append(testTextDiv);

		// Create another div, to use for the jQuery UI Dialog.
		var jqDialog = document.createElement("div");
		jqDialog.id = "dialog-teststep";
		jqDialog.style.display = "none";
		jqDialog.innerHTML = "";
		$('body').append(jqDialog);

		$.ajax({
		    cache: true,
		    dataType: "script",
		    url: "/files/mastiffe/javascript/jquery-ui-1.8.10.custom.min.js",
		    success: function(){ setTimeout("initDialog()",200); }
		});
	}
}

$dialog = null;
// The little image that goes next to the step number.
// Original by Pleple2000 (Own work) [GFDL (www.gnu.org/copyleft/fdl.html), CC-BY-SA-3.0 (www.creativecommons.org/licenses/by-sa/3.0/) or CC-BY-SA-2.5-2.0-1.0 (www.creativecommons.org/licenses/by-sa/2.5-2.0-1.0)], via Wikimedia Commons
// http://commons.wikimedia.org/wiki/File:Bulmastif_g%C5%82owa_451.jpg
mastiffe_img = '<a target="_blank" href="http://commons.wikimedia.org/wiki/File:Bulmastif_g%C5%82owa_451.jpg"><img src="data:image/jpeg;base64,/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAZAB4DASIAAhEBAxEB/8QAFwABAAMAAAAAAAAAAAAAAAAABwQFCP/EADAQAAICAQIEAwQLAAAAAAAAAAECAwQRAAUGEiExBxNBYXGBsiIyMzVRcnShs9Hw/8QAFgEBAQEAAAAAAAAAAAAAAAAABQQD/8QAHREAAQQDAQEAAAAAAAAAAAAAAQACAxEEEiET8P/aAAwDAQACEQMRAD8AGeF9sorLUr2K9aa7bcIiWMj0ycj07j26YZPDrhzZ9uE9qtA8xQOwjQhevoM9cDPfRhwTw+LfEEdt3fyqo5pJXyxRSwQN8C2fgdIm+cX7mN1mpbrFWhjrIawaJujSKwy/Xrgr2HbroedzpXVGUzjNbELkCgcU+HNKrtc+40p2SKNOcIvcj/emh2/belZcKolBwA69iBn9/wCtMe7cU7hu/DXEFd6qxUIBzrZ8zJCMcIgHqxbPuGdEiyOqeX9EpnOCAcHW2LuAQ82ps7QkFgq00+D8NRkmiuHlitx+Q7/hzEgaNLk9zbt63CG/Fea/BKYpCIiWXlOAeoIwygY0h+HP3PD7x/KNNVH7S5+VPl1JDN5Pdy1dkw+jG9pZJr3pLO3bnVjd/J5lsNGOnKwYgBh7i3T2aqScHtpA3X63FH6ub5To+bvpCJ+5Jr6kXOzQN79a/9k=" alt="Mastiffe" style="width:30px;height:25px;vertical-align:middle;margin-right:5px" /></a>'
// Initialize the dialog.  Done only once.
function initDialog() {
	$dialog = $('<div></div>')
		.html('<div id="dialog-step"></div><div id="dialog-expected"></div><div id="dialog-example"></div><div>Notes:<br/><textarea id="dialog-notes" style="width:100%"></textarea></div>')
		.dialog({
			autoOpen: false,
			title: mastiffe_img+'Test Step',
			width: 700,
			modal: true,
			buttons: {
				Pass: function() {
					var notes = $("#dialog-notes").val();

					if(typeof notes == "undefined" || notes == "") {
						current_test_step.push("pass:passed");
					} else {
						current_test_step.push("pass:"+notes);
					}
					displayNextStep();
				},
				"Pass All": function() {
					var notes = $("#dialog-notes").val();

					if(typeof notes == "undefined" || notes == "") {
						current_test_step.push("pass:passed");
					} else {
						current_test_step.push("pass:"+notes);
					}
					$( this ).dialog( "close" );
					finishTestSteps("pass", "passed");
				},
				Skip: function() {
					var notes = $("#dialog-notes").val();

					if(typeof notes == "undefined" || notes == "") {
						current_test_step.push("ignore:skipped");
					} else {
						current_test_step.push("ignore:"+notes);
					}
					displayNextStep();
				},
				Blocked: function() {
					var notes = $("#dialog-notes").val();

					if(typeof notes == "undefined" || notes == "") {
						alert("Please explain why the test is blocked in the Notes field.");
					} else {
						current_test_step.push("error:"+notes);
						$( this ).dialog( "close" );
						finishTestSteps("ignore", "skipped");
					}
				},
				Fail: function() {
					var notes = $("#dialog-notes").val();

					if(typeof notes == "undefined" || notes == "") {
						alert("Please explain why the test step failed in the Notes field.");
					} else {
						current_test_step.push("fail:"+notes);
						//$( this ).dialog( "close" );
						displayNextStep();
					}
				},
				Abort: function() {
					$( this ).dialog( "close" );
				}
			},
			close: function(event, ui) { 
				if(current_test_step != null && current_test_step.length < 3) {
					current_test_step.push("error:Test aborted!");
					finishTestSteps("ignore", "skipped");
				}
				// Reset the notes field.
				else $("#dialog-notes").val("");
		       	}
		});

	// Set a local timeout.  Now 8 hours or so.
	setTimeout('timeOutTest()', 28700000);
	// Begin looking for timeouts.
	setTimeout('testForTimeout()', 1000);
	//$('body').append($dialog);
	runTestOnPage(document.URL, new Array());
}
test_finished = false;
// Check that the page has not timed out.
function testForTimeout() {
	if(test_finished) return;
	// Verify the test didn't timeout.
	else if(document.getElementById("execution-status") != null) {
		$dialog.dialog("close");
		alert("Test timed out!");
		return;
	} else setTimeout('testForTimeout()', 1000);
}

// Load the given page's text.
function runTestOnPage(url, vars) {
	var testurl = url.replace(/(\?test)?$/, "?edit");
	$('#test-text-div').load(testurl+" #pageContentId", function() { parsePageContent(url, vars); } );
}

// Parse the text inside test-text-div.
var find_manual_test = /^\| *table *: *[Mm]astiffe [Tt]est *\| *$/;
function parsePageContent(url, vars) {
	// First, note that there is no pending test.
	current_test_step = null;
	// Find the textarea named pageContentId
	// Get its value.
	// Split by lines
	var lines = document.getElementById('pageContentId').value.split(/\r\n|\r|\n/);
	var in_manual_test = false;
	var find_define = /^!define ([^{]+)\{([^}]+)\}/;
	for(var i=0; i < lines.length; i++) {
		// Look for !defines.
		var defvar = lines[i].match(find_define);
		// Fill in only ones not already defined.
		if(defvar != null && typeof vars[defvar[1].trim()] == "undefined") {
			vars[defvar[1].trim()] = defvar[2];
		}

		// Look for the start of a test.
		if(find_manual_test.test(lines[i])) {
			// Push this array onto the stack, with the index to work from.
			testcases.push({text:lines, index:i+1, "url":url, "vars":vars });
			displayNextStep();
			return;
		}
	}
	// If we get here, report that calling this page failed!
	// But first, make the url a wikilink.
	var wikilink = url.replace(/^.*\//, '.');
	current_test_step = new Array("report:Call <a href=\""+url+'">'+wikilink+'</a>', "report:", "fail:call failed");
	// Then don't forget to do anything that's left.
	displayNextStep();
}

match_a_var = /\$\{([^}]+)\}/g;
match_a_link = /((?:https?|ftp):\/\/[^ ]*(?: |$))/g;
match_a_wikilink = /\.?[A-Z][a-z0-9]+(?:[A-Z][a-z0-9]*)+(?:\.[A-Z][a-z0-9]+(?:[A-Z][a-z0-9]*)+)*/g;
match_a_call = /^[Cc]all +(\.?[A-Z][a-z0-9]+(?:[A-Z][a-z0-9]*)+(?:\.[A-Z][a-z0-9]+(?:[A-Z][a-z0-9]*)+)*)/;
// Replace all instances of ${xyz} where vars["xyz"] is defined, with vars["xyz"].
function parseCell(s, vars, escaped, fromurl) {
	s = s.replace(match_a_var, function(str, p1) {
			p1 = p1.trim();
			if(typeof vars[p1] == "undefined") return str;
			else return vars[p1];
			}).trim();

	// If the original text wasn't escaped, escape any HTML.
	if(!escaped) {
		s = s.replace(/&/g, '&amp;')
		s = s.replace(/>/g, '&gt;')
		s = s.replace(/</g, '&lt;')
		// Also linkify http://*.
		s = s.replace(match_a_link, "<a target=\"_blank\" href=\"$1\">$1</a>");
		// Also linkify wikilinks.
		s = s.replace(match_a_wikilink, function(str) {
				if(match_a_call.test(s)) return str;	// Avoid messing with calls.
				else if(/^\./.test(str)) {
					return "<a target=\"_blank\" href=\"/"+str.substring(1)+"\">"+str+"</a>";
				} else {
					return "<a target=\"_blank\" href=\""+fromurl.replace(/\.[^.]*$/, '.')+str+"\">"+str+"</a>";
				}
			});
	}
	return s;
}

// Try calling anything that looks like "call" followed by a wikilink.
function tryCall(s, vars, fromurl) {
	var match = match_a_call.exec(s);
	if(match != null) {
		// Make sure vars is present, even if empty.
		if(typeof vars == "undefined") vars = '';
		vars = vars.trim();
          
                // Allow hash tables as parameters.
                if(/^!?{.*}$/.test(vars)) {
                	vars = vars.replace(/^!?{/,'');
                	vars = vars.replace(/}$/,'');
                }

		// Make vars proper JSON.
		if(vars == '') vars = '{}';
		else if(vars.indexOf('"') >= 0) {
			// This already has quotes.  Just wrap it in {}.
			vars = '{' + vars + '}';
		} else {
			// This does not have quotes.  Give it some.
			vars = '{"'+vars.replace(/ *([:,]) */g,'"$1"')+'"}';
		}

		// If this is a full URL, use that.
		if(/^\./.test(match[1])) {
			runTestOnPage('/'+match[1].substring(1), JSON.parse(vars));
		} else {
			// This is relative to the current url, fromurl.
			runTestOnPage(fromurl.replace(/\.[^.]*$/, '.')+match[1], JSON.parse(vars));
		}
		return true;
	}	
	return false;
}

// Split a pipe-delimited test step, accounting for escape characters.
function splitThisStep(thisStep) {
  var escapedCell = new Array();
  thisStep = thisStep.trim().substring(1, thisStep.length-1).split(/\|/);
  // Fix escaped pipes.
  for(var i=0; i < thisStep.length; i++) {
    if(/^!-/.test(thisStep[i])) {
      // Record that this cell was escaped.
      escapedCell.push(true);
      if(!/-!$/.test(thisStep[i])) {
        while(i < thisStep.length-2 && !/-!$/.test(thisStep[i+1])) {
          // Merge these two entries.
          thisStep[i] += '|'+thisStep[i+1];
          thisStep.splice(i+1,1);
        }
        // Merge these two entries.
        thisStep[i] += '|'+thisStep[i+1];
        thisStep.splice(i+1,1);
      }
      thisStep[i] = thisStep[i].substring(2, thisStep[i].length-2);
    } else escapedCell.push(false); // Record that this cell wasn't escaped.
  }
  return {
    thisStep: thisStep,
    escapedCell: escapedCell
  }
}

testStepNo = 1;
// Display the next test step in testcases, if any.
function displayNextStep() {
	if(finishingTestSteps != null) { finishTestSteps(); return; }
	if(current_test_step != null) jsonOut.push(current_test_step);

	// Clear the notes box.
	$("#dialog-notes").val("");
	// Un-highlight all buttons.
	$('.ui-dialog :button').blur();
	// Verify the test didn't timeout.
	if(document.getElementById("execution-status") != null) {
		$dialog.dialog("close");
		alert("Test timed out!");
		return;
	}

	while(testcases.length > 0) {
		var testcase = testcases.pop();
		if(testcase.index < testcase.text.length && /^\|/.test(testcase.text[testcase.index])) {
                        var escapedCell;
			thisStep = testcase.text[testcase.index];
			testcase.index++;
			// Save the next step.
			testcases.push(testcase);
			// Split thisStep.
			thisStep = splitThisStep(thisStep);
                        escapedCell = thisStep.escapedCell;
                        thisStep = thisStep.thisStep;

			// Test for a header line, just after a manual test starting line.
			// If found, just skip it.
			if(thisStep.length == 3 && /.*(?:[Ss]tep|[Tt]est).*/.test(thisStep[0]) &&
					/.*[eE]xpect.*/.test(thisStep[1]) && /.*Example.*/.test(thisStep[2]) &&
					find_manual_test.test(testcase.text[testcase.index-2]))
				continue;

			thisStep[0] = parseCell(thisStep[0], testcase.vars, escapedCell[0], testcase.url);
			// If a call is seen, this section will be returned to later.
			if(tryCall(thisStep[0], thisStep[2], testcase.url)) return;
			$("#dialog-step").html(thisStep[0]);
			if(thisStep.length > 0) {
				thisStep[1] = parseCell(thisStep[1], testcase.vars, escapedCell[1], testcase.url);
				$('#dialog-expected').html("Expected: "+thisStep[1]);
				$('#dialog-expected').show();
			} else {
				thisStep.push('');
				$('#dialog-expected').hide();
			}

			if(thisStep.length > 1) {
				thisStep[2] = parseCell(thisStep[2], testcase.vars, escapedCell[2], testcase.url);
				if(thisStep[2] != '') {
					$('#dialog-example').html("Example: "+thisStep[2]);
					$('#dialog-example').show();
				} else $('#dialog-example').hide();
			} else $('#dialog-example').hide();


			// Close the dialog, so it will open at the right size in a moment.
			current_test_step = null;
			$dialog.dialog("close");
			// Begin setting up the results.
			current_test_step = new Array("report:"+thisStep[0], "report:"+thisStep[1]);

			// Set the title.
			$dialog.dialog( "option", "title", mastiffe_img+'Step '+testStepNo );
			testStepNo++;

			// Display the dialog.
			$dialog.dialog("open");

			return;
		}
	}
	postjson();
}

testTimedOutLocal = false;
function timeOutTest() {
	if(!test_finished) {
		testTimedOutLocal = true;
		if(current_test_step != null) current_test_step.push("error:Timed out");
		finishTestSteps("error", "Timed out");
	}
}

// Finish the test steps in testcases without displaying anything to the user.
function finishTestSteps(state, report) {
	if(finishingTestSteps == null) finishingTestSteps = state+":"+report;
	if(current_test_step != null) jsonOut.push(current_test_step);

	while(testcases.length > 0) {
		var testcase = testcases.pop();
		if(testcase.index < testcase.text.length && /^\|/.test(testcase.text[testcase.index])) {
			thisStep = testcase.text[testcase.index];
			testcase.index++;
			// Save the next step.
			testcases.push(testcase);
			// Split thisStep.
			thisStep = thisStep.trim().substring(1, thisStep.length-1).split(/\|/);
			// Fix escaped pipes.
			var escapedCell = new Array();
			for(var i=0; i < thisStep.length; i++) {
				if(/^!-/.test(thisStep[i])) {
					// Record that this cell was escaped.
					escapedCell.push(true);
					if(!/-!$/.test(thisStep[i])) {
						while(i < thisStep.length-2 && !/-!$/.test(thisStep[i+1])) {
							// Merge these two entries.
							thisStep[i] += '|'+thisStep[i+1];
							thisStep.splice(i+1,1);
						}
						// Merge these two entries.
						thisStep[i] += '|'+thisStep[i+1];
				thisStep.splice(i+1,1);
					}
					thisStep[i] = thisStep[i].substring(2, thisStep[i].length-2);
				} else escapedCell.push(false); // Record that this cell wasn't escaped.
			}

			// Produce the result.
			thisStep[0] = parseCell(thisStep[0], testcase.vars, escapedCell[0], testcase.url);
			// If a call is seen, this section will be returned to later, from a callback.
			if(tryCall(thisStep[0], thisStep[2], testcase.url)) return;
			
			thisStep[1] = parseCell(thisStep[1], testcase.vars, escapedCell[1], testcase.url);
			jsonOut.push(new Array("report:"+thisStep[0], "report:"+thisStep[1], finishingTestSteps));
		}
	}
	postjson();
}

// POST the JSON data to FitNesse.
function postjson() {
	// Verify the test didn't timeout.
	if(document.getElementById("execution-status") != null) {
		$dialog.dialog("close");
		alert("Test timed out!");
		return;
	}
	test_finished = true;	// Prevent any further timeout errors.
	$.post('/MastiffeResults.ResNo'+testno, {
responder: "saveData", 
pageContent: JSON.stringify(jsonOut)
});
	// Perform any cleanup work, like removing a spinner, here.
	$dialog.dialog("close");
	if(testTimedOutLocal) alert("Test timed out! But partial results were saved.");
}

// Limit the times to search for a manual test after the page is loaded:
var retestForManual=2;
// Search for a manual test starter entry.
function testForManual() {
  var stoptest = document.getElementById("stop-test");
  try {
    // Find the tag without xpath, for IE.
    var tds = stoptest.parentNode.getElementsByTagName('TD');
    testno = '0';
    for(var i = 0; i < tds.length; i++){
      if(tds[i].innerHTML == "mastiffe tag"){
        testno = tds[i+1].innerHTML;
        break;
      }
    }
    if(testno == '0') {
      if(document.getElementById("execution-status") != null) --retestForManual;
      if(retestForManual > 0) setTimeout('testForManual()', 100);
      return;
    }
    //var firstTestNumber = document.evaluate("..//tr[td='mastiffe tag']/td[3]", stoptest, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null );
    //testno = firstTestNumber.singleNodeValue.innerHTML;
    if(document.getElementById("execution-status") == null) {
      if(/^\d+$/.test(testno) && testno != '0') loadjQuery();
      else alert("Invalid Mastiffe tag "+testno);
    } else alert("No Mastiffe tests found!");
  } catch(e) {
    if(document.getElementById("execution-status") != null) --retestForManual;
    if(retestForManual > 0) setTimeout('testForManual()', 100);
    // Else give up searching.
  }
}
if(document.URL.search(/\?test$/) >= 0) {
  testForManual();
} else if(document.URL.search(/\?edit$/) >= 0) {
  // Insert manual testing helper buttons.
  loadjQuery.getScript("/files/mastiffe/javascript/mastiffe_buttons.js"); 
}
