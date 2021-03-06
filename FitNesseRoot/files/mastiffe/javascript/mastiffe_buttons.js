//Add buttons to an editing page to allow for easier entry of manual test steps.
project_name = 'Mastiffe';
if(document.all) {
  LINE_SPLIT_CHARS = "\r\n";
} else {
  LINE_SPLIT_CHARS = "\n";
}

loadjQuery = function() {
  // TODO: Load a spinner.
  loadjQuery.getScript("/files/mastiffe/javascript/jquery-1.4.4.min.js");
  loadjQuery.tryReady(0); // Wait until jQuery loads before using it.
}

// dynamically load any javascript file.
loadjQuery.getScript = function(filename) {
  var script = document.createElement('script');
  script.setAttribute("type","text/javascript");
  script.setAttribute("src", filename);
  if (typeof script!="undefined")
    document.getElementsByTagName("head")[0].appendChild(script);
}

loadjQuery.tryReady = function(time_elapsed) {
  // Continually polls to see if jQuery is loaded.
  if (typeof $ == "undefined") { // if jQuery isn't loaded yet...
    if (time_elapsed <= 5000) { // and we havn't given up trying...
      setTimeout("loadjQuery.tryReady(" + (time_elapsed + 200) + ")", 200); // set a timer to check again in 200 ms.
    } else {
      alert("Timed out while loading jQuery.");
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

    $("head").append("<link>");
    css = $("head").children(":last");
    css.attr({
          rel:  "stylesheet",
          type: "text/css",
          href: "/files/mastiffe/css/jquery.wysiwyg.css"
          });

    $.ajax({
        cache: true,
        dataType: "script",
        url: "/files/mastiffe/javascript/jquery-ui-1.8.10.custom.min.js",
        success: function(){ loadwysiwyg(); }
    });
  }
}

function loadwysiwyg() {
  $.ajax({
      cache: true,
      dataType: "script",
      url: "/files/mastiffe/javascript/jquery.wysiwyg.js",
      success: function(){ setTimeout("programButtons()",200); }
  });
}

html_regex = /<[a-z]+[ >]|\||&(#[0-9]+|[a-z]+);/i;
html_only_regex = /<[a-z]+[ >]|\|/i;
// HTML-ify an argument, mainly escaping stuff.
function doescape(original) {
  original = original.replace(/&/g, '&amp;'); // First, of course.
  original = original.replace(/</g, '&lt;');
  original = original.replace(/>/g, '&gt;');
  return original;
}
// un-HTML-ify an argument, if it has only unnecessary HTML.
function unhtmlify(original) {
  original = original.trim();
  // Also remove any newlines, adding a space if there was none otherwise.
  original = original.replace(/( (\r\n|\n|\r)+|(\r\n|\n|\r)+ |(\r\n|\n|\r)+)/gm," ");
  var testversion = original.replace(/^ *<p>/i, '').replace(/<\/p> *$/i, '');
  if(!html_only_regex.test(testversion)) {
    testversion = dounescape(testversion);
    if(!html_regex.test(testversion)) return testversion;
  }
  return original;
}

function dounescape(original) {
  var testversion2 = original.replace(/&quot;/g, '"');
  testversion2 = testversion2.replace(/&lt;/g, '<');
  testversion2 = testversion2.replace(/&gt;/g, '>');
  testversion2 = testversion2.replace(/&nbsp;/g, ' ');
  testversion2 = testversion2.replace(/&amp;/g, '&'); // Last, of course.
  return testversion2;
}

var MSTATE = {
    BEFORE : 0,
    WITHIN : 1,
    AFTER : 2
};
issues_dialog = null;
add_step_dialog = null;
add_param_dialog = null;

// These three vars hold what text the Add Step dialog should start out with.
dialog_set_row = -1;
dialog_set_action = null;
dialog_set_expected = null;
dialog_set_example = null;
dialog_selection_start = 0;
dialog_selection_end = 0;
dialog_selection_text = null;
dialog_fatal_page_error = false;

function programButtons() { // Now that jQuery UI is loaded...
  // Load other bits of wysiwyg.
  $.ajax({
      cache: true,
      dataType: "script",
      url: "/files/mastiffe/javascript/wysiwyg.link.js",
  });
  $.ajax({
      cache: true,
      dataType: "script",
      url: "/files/mastiffe/javascript/wysiwyg.table.js",
  });
  // Finish loading
  // Add the dialogs.
  // * Add Step dialog
  // * Add Syntax warning dialog
  issues_dialog = $('<div></div>')
    .html('<textarea id="dialog-issues" style="width:100%;height:100%" readonly="readonly"></textarea>')
    .dialog({
autoOpen: false,
title: mastiffe_img+'Error Check',
height: 500,
width: 700,
modal: false,
buttons: {
    "Save Anyway": function() {
        if(dialog_fatal_page_error) {
          alert("There is an error on this page that MUST be fixed before you can save it!");
        } else {
          $( this ).dialog( "close" );
          document.getElementsByTagName('FORM')[0].submit();
        }
      },
    Cancel: function() {
      $( this ).dialog( "close" );
      }
    }
  });

  add_step_dialog = $('<div></div>')
    .html('<table class="mastiffe" width="100%">' +
        '<tr><td>Step:</td><td width="100%"><textarea rows=4 style="width:660px" id="dialog-add-step-action" class="rte-zone"></textarea></td></tr>' +
        '<tr><td>Expected:</td><td width="100%"><textarea rows=4 style="width:660px" id="dialog-add-step-expected" class="rte-zone"></textarea></td></tr>' +
        '<tr><td>Example (e.g. data):</td><td width="100%"><textarea rows=4 style="width:660px" id="dialog-add-step-example" class="rte-zone"></textarea></td></tr>' +
      '</table>' +
    '</div>')
    .dialog({
autoOpen: false,
title: 'Add Step',
width: 800,
height:710,
modal: false,
resizable: false,
open:  function(event, ui) {
$('#dialog-add-step-action').wysiwyg({
initialContent: "<p>When</p>",
controls: { insertImage: { visible: false } },
formWidth: 660
  });
$('#dialog-add-step-expected').wysiwyg({
initialContent: "<p>Then</p>",
controls: { insertImage: { visible: false } },
formWidth: 660
  });
$('#dialog-add-step-example').wysiwyg({
initialContent: "",
controls: { insertImage: { visible: false } },
formWidth: 660
  });
  if(typeof dialog_set_action == "undefined") dialog_set_action = '';
  if(typeof dialog_set_expected == "undefined") dialog_set_expected = '';
  if(typeof dialog_set_example == "undefined") dialog_set_example = '';
  $('#dialog-add-step-action').wysiwyg('setContent', dialog_set_action);
  $('#dialog-add-step-expected').wysiwyg('setContent', dialog_set_expected);
  $('#dialog-add-step-example').wysiwyg('setContent', dialog_set_example);
 },
buttons: {
    Save: function() {
        $( this ).dialog( "close" );
        doAddStep(dialog_set_row, [
            document.getElementById('dialog-add-step-action').value,
            document.getElementById('dialog-add-step-expected').value,
            document.getElementById('dialog-add-step-example').value
            ]);
      },
    Cancel: function() {
        $( this ).dialog( "close" );
      }
    }
  });

  add_param_dialog = $('<div></div>')
    .html('<table class="mastiffe" width="100%">' +
        '<tr><td>Name:</td><td width="100%"><input id="dialog_param_name" type="text" style="width:100%"/></td></tr>' +
        '<tr><td>Default<br>value:</td><td width="100%"><input id="dialog_param_value" type="text" style="width:100%"/></td></tr>' +
        '<tr><td></td><td><input type=checkbox id="dialog_replace_all">Replace all</input></td></tr>' +
      '</table>' +
    '</div>')
    .dialog({
autoOpen: false,
title: mastiffe_img+'Add Parameter',
width: 500,
modal: true,
buttons: {
    Save: function() {
        doAddMastiffeParam();
      },
    Cancel: function() {
        $( this ).dialog( "close" );
      }
    }
  });
  $('#dialog_param_name').keydown(function(e) {
    if (e.keyCode == 13) {
      doAddMastiffeParam();
    }
  });
  $('#dialog_param_value').keydown(function(e) {
    if (e.keyCode == 13) {
      doAddMastiffeParam();
    }
  });

  // Program the form to test for issues, and display that dialog if needed.
  document.getElementsByTagName('FORM')[0].onsubmit = checkMastiffe;
  // Un-grey out the buttons, 
  document.getElementById("butAddManuStep").disabled = false;
  document.getElementById("butEditManuStep").disabled = false;
  document.getElementById("butAddParam").disabled = false;
  // If a Mastiffe table is present, show the buttons.
  var TA=document.getElementById('pageContentId').value;
  var lines=TA.split(LINE_SPLIT_CHARS);
  for(var line in lines) {
    if(line >= 0) line = lines[line];
    if(/^\| *table: *Mastiffe test *\| *$/i.test(line)) {
      toggleCollapsable('manubuttons');
      break;
    }
  }
}

// *** Button Launchers ***
// Display the dialog to add a Mastiffe step.
function addMastiffeStep() {
  document.getElementById('dialog-add-step-action').value = '';
  document.getElementById('dialog-add-step-expected').value = '';
  document.getElementById('dialog-add-step-example').value = '';
  dialog_set_action = '';
  dialog_set_expected = '';
  dialog_set_example = '';
  add_step_dialog.dialog("option", "title", mastiffe_img+'Add Step');
  dialog_set_row = -1;
  add_step_dialog.dialog('open');
}

function addMastiffeParam() {
  document.getElementById('dialog_param_name').value = '';
  document.getElementById('dialog_replace_all').checked = false;
  getDialogSelection(document.getElementById('pageContentId'));
  document.getElementById('dialog_param_value').value = dialog_selection_text;
  add_param_dialog.dialog('open');
}

// Display the dialog to edit a Mastiffe step.
function editMastiffeStep() {
  document.getElementById('dialog-add-step-action').value = '';
  document.getElementById('dialog-add-step-expected').value = '';
  document.getElementById('dialog-add-step-example').value = '';
  add_step_dialog.dialog("option", "title", mastiffe_img+'Edit Step');

  // Get the row the cursor is on.
  var TA=document.getElementById('pageContentId');
  var row = getInputCursorLine(TA);
  var line=TA.value.split(LINE_SPLIT_CHARS)[row];
  //alert("Got row number "+row+" which is\n"+line);
  line = splitThisStep(line);
  // Store which line to overwrite!
  dialog_set_row = row;
  if(line.thisStep.length == 2) {
    line.thisStep.push('');
    line.escapedCell.push(false);
  }
  // Note that this fails if there are less than three cells.  This kind of makes sense.
  dialog_set_action = line.escapedCell[0]?line.thisStep[0]:doescape(line.thisStep[0]);
  dialog_set_expected = line.escapedCell[1]?line.thisStep[1]:doescape(line.thisStep[1]);
  dialog_set_example = line.escapedCell[2]?line.thisStep[2]:doescape(line.thisStep[2]);
  add_step_dialog.dialog('open');
}

// Parse Ruby Selenium RC code into Rsel.
// At least partially.
function parseRsel() {
  var TA=document.getElementById('pageContentId');
  var text = TA.value;

  // Note: All commands initially start with rsel|, to differentiate them from any other tables.
  // Fix first lines.
  text = text.replace(/^ *@selenium\.open  *"([^"]*)" *$/m, "rsel| script | Selenium test | $1 | !{host: ${HOST}, stop_on_failure:true} |\nrsel| Open browser |\nrsel| Maximize browser |");

  // Other lines like that are Visit lines.
  text = text.replace(/^ *@selenium\.open  *"([^"]*)" *$/gm, "rsel| Visit |!-$1-!|");

  // Delete begin-rescue-end blocks except for the asserted contents.
  text = text.replace(/^ *begin *\r?\n/gm, '');
  text = text.replace(/^ *rescue Test::Unit::AssertionFailedError *\r?\n.*\r?\n *end *\r?\n/gm, '');
  text = text.replace(/def (setup|teardown)[\s\S]*?end/g, '');

  text = text.replace(/^ *@selenium\.type  *"([^"]*)", *"([^"]*)" *$/gm, 'rsel| Type |!-$2-!| into field |!-$1-!|');
  text = text.replace(/^ *@selenium\.select  *"([^"]*)", *"label=([^"]*)" *$/gm, 'rsel| Select |!-$2-!| from dropdown |!-$1-!|');
  text = text.replace(/^ *@selenium\.wait_for_page_to_load  *"([0-9]+)000" *$/gm, 'rsel| Page loads in | $1 | seconds or less |');
  text = text.replace(/^ *@selenium\.click  *"\/(.*)" *$/gm, 'rsel| Click |!-xpath=/$1-!|');
  text = text.replace(/^ *@selenium\.click  *"(.*)" *$/gm, 'rsel| Click |!-$1-!|');
  text = text.replace(/^ *assert @selenium.is_text_present\("(.*)"\) *$/gm, 'rsel| See |!-$1-!|');
  text = text.replace(/^ *assert !@selenium.is_text_present\("(.*)"\) *$/gm, 'rsel| Do not see |!-$1-!|');
  text = text.replace(/^ *@selenium.choose_([a-z]+)_on_next_confirmation *$/gm, 'rsel| Choose $1 on next confirmation |');
  text = text.replace(/^ *assert_equal "([^"]*)", *@selenium.get_([a-z]+)\("(.*)"\) *$/gm, 'rsel| Check | get $2 |!-$3-!|!-$1-!|');
  text = text.replace(/^ *assert \/(.*)\/ *=~ *@selenium.get_([a-z]+)\("(.*)"\) *$/gm, 'rsel| Check | get $2 |!-$3-!|!-regex:$1-!|');
  text = text.replace(/^ *assert \/(.*)\/ *=~ *@selenium.get_([a-z]+) *$/gm, 'rsel| Check | get $2 |!-regex:$1-!|');
  text = text.replace(/^ *assert !([0-9]+).times{ break if \(@selenium.is_text_present\("(.*)"\) rescue false\); sleep 1 } *$/gm, 'rsel| See |!-$2-!| within | $1 | seconds |');

  // Pick up most remaining one-argument Selenium commands.
  text = text.replace(/^ *@selenium\.([a-z_]+)  *"\/\/([^"]*)" *$/gm, "rsel| $1 |!-xpath=//$2-!|");
  text = text.replace(/^ *@selenium\.([a-z_]+)  *"([^"]*)" *$/gm, "rsel| $1 |!-$2-!|");

  // Fix any remaining Selenium commands with underscores to have spaces instead.
  text = text.replace(/^(rsel\|[^|]*)_/gm, '$1 ');

  // Fix any remaining Selenium commands with escaped quotes, but only on Rsel lines.
  text = text.replace(/^(rsel\|.*)\\"/gm, "$1\"");

  // Add closing line.
  text = text.replace(/^ *end *$/m, 'rsel| Close browser |');
  // Clean up rsel|.
  text = text.replace(/^rsel\|/gm, '|');
  TA.value = text;
}




// *** Dialog Action Implementations ***
// (functions extracted from dialog functions, so more than one thing can call them.)
function doAddMastiffeParam() {
  // Get the entries.
  var txtName = jQuery.trim($('#dialog_param_name').val());
  var txtValue = $('#dialog_param_value').val();
  var replaceAll = document.getElementById('dialog_replace_all').checked;
  if(/[ 	{}]/.test(txtName)) {
    alert('The parameter name may not contain spaces or {curly braces}.');
    return;
  }
  if(txtName == '') {
    alert('A parameter name is required.');
    return;
  }
  if(/}/.test(txtValue)) {
    alert('The parameter value may not contain ending curly braces. ("}")');
    return;
  }

  // Check the existing rows to find where to insert this.
  var TA=document.getElementById('pageContentId');
  var lines = null;

  // Place the variable in the rest of the text, if appropriate.
  if(replaceAll) {
    // Regex escaping from http://simonwillison.net/2006/Jan/20/escape/#p-6
    var re = new RegExp(txtValue.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), 'g');
    var lines=TA.value.replace(re, "${"+txtName+"}");
  } else {
    // If there was selected text, replace it.
    if(dialog_selection_end != dialog_selection_start && txtValue == dialog_selection_text) {
      if(dialog_selection_end < dialog_selection_start) {
        var temp = dialog_selection_end;
        dialog_selection_end = dialog_selection_start;
        dialog_selection_start = temp;
      }
      lines = TA.value.substring(0,dialog_selection_start) + "${"+txtName+"}" + TA.value.substring(dialog_selection_end);
    } else {
      lines = TA.value;
    }
  }
  lines = lines.split(LINE_SPLIT_CHARS);
  var line_status = MSTATE.BEFORE;
  var line;
  var last_bang_line = 0;
  var minline = lines.length;

  for(line in lines) {
    var found_name;
    if((found_name=/^ *!define  *([^ ]*) /i.exec(lines[line])) != null) {
      line_status = MSTATE.WITHIN;
      if(found_name[1] == txtName) {
        alert('There is already a parameter named "'+txtName+'".  Please edit it or choose a different name.');
        return;
      }
    }
    // If the variable is found already used in another variable definition, be sure to define the variable before that use.
    if(lines[line].indexOf("${"+txtName+"}") >= 0) {
      minline = line;
    }

    if(line_status == MSTATE.BEFORE) {
      // If no !defines are found, put this one before the first table, if any.
      if(lines[line].substr(0,1) == '|' && last_bang_line == 0) {
        last_bang_line = line;
      }
    } else {
      // Do not put this !define before any other !defines
      // (Unless any depend on it.)
      if(line_status == MSTATE.WITHIN && lines[line].substr(0,1) != '!') {
        last_bang_line = line;
        line_status = MSTATE.BEFORE;
      }
    }
  }

  // Do not append the start of a new Mastiffe table if none was found.
  // Set up the final text line.
  txtValue = '!define '+txtName+' {'+txtValue+'}';

  // Sort out where to place this line.
  if(last_bang_line != 0) line = last_bang_line;
  if(minline < line) line = minline;

  lines.splice(line, 0, txtValue);
  TA.value = lines.join(LINE_SPLIT_CHARS);
  add_param_dialog.dialog('close');
}

// Add a step from the add/edit dialog.
function doAddStep(row, step_entries) {
  // Get the entries.
  var txtAction = step_entries[0];
  var txtExpected = step_entries[1];
  var txtExample = step_entries[2];

  // Remove HTML from the values if at all possible.
  txtAction = unhtmlify(txtAction);
  txtExpected = unhtmlify(txtExpected);
  txtExample = unhtmlify(txtExample);

  // Escape entries that need it.
  if(html_regex.test(txtAction)) txtAction = '!- '+txtAction+' -!';
  else txtAction = ' '+dounescape(txtAction)+' ';
  if(html_regex.test(txtExpected)) txtExpected = '!- '+txtExpected+' -!';
  else txtExpected = ' '+dounescape(txtExpected)+' ';
  if(html_regex.test(txtExample)) txtExample = '!- '+txtExample+' -!';
  else txtExample = ' '+dounescape(txtExample)+' ';

  // Read the existing text.
  var TA=document.getElementById('pageContentId');
  var lines=TA.value.split(LINE_SPLIT_CHARS);

  var replace_line = (row>=0)?1:0;
  if(row < 0) {
    // Find the end of the Mastiffe table.
    var line_status = MSTATE.BEFORE;
    for(var line in lines) {
      row = line;
      if(line >= 0) line = lines[line];
      if(line_status == MSTATE.BEFORE && /^\| *table: *Mastiffe test *\| *$/i.test(line)) {
        line_status = MSTATE.WITHIN;
      } else {
        if(line_status == MSTATE.WITHIN && line.substr(0,1) != '|') {
          line_status = MSTATE.AFTER;
          break;
        }
      }
    }
    if(line_status == MSTATE.BEFORE) {
      // Append the start of a new Mastiffe table if none was found.
      lines.push('| table:Mastiffe test |');
      lines.push('| Test step | Expected result | Example data |');
      row = -1;
    }
  }

  // Set up the final text line.
  txtAction = '|'+txtAction+'|'+txtExpected+'|'+txtExample+'|';

  // If a Mastiffe table was found, and its end was found too, insert the line at the end.
  if(row >= 0) {
    lines.splice(row, replace_line, txtAction);
  } else {
    lines.push(txtAction);
  }
  TA.value = lines.join(LINE_SPLIT_CHARS);
}

// *** Other Functions ***
match_a_call_line = /^\| *[Cc]all +(\.?[A-Z][a-z0-9]+(?:[A-Z][a-z0-9]*)+(?:\.[A-Z][a-z0-9]+(?:[A-Z][a-z0-9]*)+)*) *\| *\|[^|]*\| *$/;

// Find the line the cursor is on in a textarea.
// Based upon:
//  http://stackoverflow.com/questions/263743/how-to-get-cursor-position-in-textarea
//  http://stackoverflow.com/questions/3053542/how-to-get-the-start-and-end-points-of-selection-in-text-area/3053640#3053640
function getInputCursorLine(el) {
  var start = 0;

  if (typeof el.selectionStart == "number" && typeof el.selectionEnd == "number") {
    var normalizedValue = el.value.replace(/\r\n/g, "\n");
    start = el.selectionStart;
    start = normalizedValue.slice(0, start);
  } else {
    el.focus(); 

    var r = document.selection.createRange(); 
    if (r == null) { 
      return 0; 
    } 

    var re = el.createTextRange(), 
        rc = re.duplicate(); 
    re.moveToBookmark(r.getBookmark()); 
    rc.setEndPoint('EndToStart', re); 

    start = rc.text;
  }

  return(start.split("\n").length - 1);
}

//  http://stackoverflow.com/questions/3053542/how-to-get-the-start-and-end-points-of-selection-in-text-area/3053640#3053640
function getDialogSelection(el) {
    var start = 0, end = 0, normalizedValue, range,
        textInputRange, len, endRange;

    if (typeof el.selectionStart == "number" && typeof el.selectionEnd == "number") {
        start = el.selectionStart;
        end = el.selectionEnd;
    } else {
        range = document.selection.createRange();

        if (range && range.parentElement() == el) {
            len = el.value.length;
            normalizedValue = el.value.replace(/\r\n/g, "\n");

            // Create a working TextRange that lives only in the input
            textInputRange = el.createTextRange();
            textInputRange.moveToBookmark(range.getBookmark());

            // Check if the start and end of the selection are at the very end
            // of the input, since moveStart/moveEnd doesn't return what we want
            // in those cases
            endRange = el.createTextRange();
            endRange.collapse(false);

            if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
                start = end = len;
            } else {
                start = -textInputRange.moveStart("character", -len);
                start += normalizedValue.slice(0, start).split("\n").length - 1;

                if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
                    end = len;
                } else {
                    end = -textInputRange.moveEnd("character", -len);
                    end += normalizedValue.slice(0, end).split("\n").length - 1;
                }
            }
        }
    }

    
    dialog_selection_start = start;
    dialog_selection_end = end;
    dialog_selection_text = el.value.substring(start, end);
}

// Check any Mastiffe table within #pageContentId
function checkMastiffe() {
  issues_dialog.dialog('close');
  var lines;
  var txtErrors = "";
  var TA=document.getElementById('pageContentId').value;
  lines=TA.split(LINE_SPLIT_CHARS);
  var MastiffeState = MSTATE.BEFORE;

  // Reset the ability to save the page even with errors.
  dialog_fatal_page_error = false;
  for(var line in lines) {
    if(line >= 0) line = lines[line];

    // Generic table formatting check.
    if(/^\|.*\|[^|]*[^\s|][^|]*$/.test(line)) {
      if(!errorThisLine) txtErrors += 'At: '+line+'\n';
      errorThisLine = true;
      txtErrors += '  Warning: This looks like a table line with trailing characters.  It will cause any table around it not to appear or work as a table.\n';
    }

    // Hashtable validation.
    if(line.indexOf('!{') >= 0) {
      var hashtableline = line;
      // Get rid of all variables for this check.
      while(/\$\{[^}]*\}/.test(hashtableline)) { hashtableline = hashtableline.replace(/\$\{[^}]*\}/g,' '); }
      while(hashtableline.indexOf('!{') >= 0) {
        hashtables = hashtableline.split('!{');
        var i = hashtables.length-1;
        if(!/^[^{:},|]+:[^{:},|]+(,[^{:},|]+:[^{:},|]+)*\}/.test(hashtables[i])) {
          if(!errorThisLine) txtErrors += 'At: '+line+'\n';
          errorThisLine = true;
          txtErrors += "  Error: Malformed hashtable found.  Hashtables must have at least one name-value pair separated by a ':'.  Name-value pairs must be separated by ','s.  Names and values must have at least one character.  And the hashtable must be terminated by a '}'.\n";
          if(line.substr(0,1) == '|') {
            txtErrors += "    You MAY NOT SAVE THE PAGE until this error is fixed!!!\n";
            dialog_fatal_page_error = true;
          }
        }
        // If a hashtable is imbalanced, it's been reported, so just get out of here.
        if(hashtables[i].indexOf('}') < 0) break;
        // Remove the last hashtable without disturbing anything around it.
        hashtables[i-1] += hashtables[i].substr(hashtables[i].indexOf('}')+1);
        hashtables.pop();
        hashtableline = hashtables.join('!{');
      }
    }

    if(MastiffeState != MSTATE.WITHIN) {
      if(/^\| *table: *Mastiffe ?test *\| *$/i.test(line)) {
        if(MastiffeState == MSTATE.BEFORE) {
          // Now we're in a Mastiffe table.
          MastiffeState = MSTATE.WITHIN;
          continue;
        } else {
          // We found a second Mastiffe table!  Error!
          if(!errorThisLine) txtErrors += 'At: '+line+'\n';
          errorThisLine = true;
          txtErrors += '  Error: Only one Mastiffe table per page is functional.\n';
        }
      }
    } else {
      // We're in a Mastiffe table.
      if(line.substr(0,1) != '|') {
        // Unless we're not.
        MastiffeState = MSTATE.AFTER;
        continue;
      }
      var errorThisLine = false;

      // Verify !--! are surrounded by |'s.
      if(/[^|]!-/.test(line) || /-![^|]/.test(line)) {
        if(!errorThisLine) txtErrors += 'At: '+line+'\n';
        errorThisLine = true;
        txtErrors += '  Error: Escape sequences (!--!) in Mastiffe tables must begin and end on cell boundaries.\n';
      }

      // Remove any escaped entries
      var cleanline = line.replace(/!-.*?-!/g,'');
      // Look for unescaped HTML.
      if(/<(?:[bh]r ?\/?|p ?\/?|img .*|\/[a-z]+)>/i.test(cleanline)) {
        if(!errorThisLine) txtErrors += 'At: '+line+'\n';
        errorThisLine = true;
        txtErrors += '  Warning: This line appears to have unescaped HTML.\n';
        txtErrors += '           (It will display as text, if that\'s what you want.)\n'
      }
      // Check the table formatting.
      var tableFields;
      if((tableFields=/^\|([^|]*)\|([^|]*)\|([^|]*)\| *$/.exec(cleanline)) == null) {
        if(!errorThisLine) txtErrors += 'At: '+line+'\n';
        errorThisLine = true;
        txtErrors += '  Error: Mastiffe lines must have three cells each.\n';
        if(/^\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|/.test(cleanline)) {
          txtErrors += '         (Did you forget to escape a pipe?)\n';
          txtErrors += '  Unescaped entries: '+cleanline+'\n';
        }
        continue;
      }

      // Test Call format.
      if(/^ *[Cc]all +[^| ]*/.test(tableFields[1])) {
        if(!/^ *[Cc]all +\.?[A-Z][a-z0-9]+(?:[A-Z][a-z0-9]*)+(?:\.[A-Z][a-z0-9]+(?:[A-Z][a-z0-9]*)+)* *$/.test(tableFields[1])) {
          if(!errorThisLine) txtErrors += 'At: '+line+'\n';
          errorThisLine = true;
          txtErrors += '  Warning: Call does not match any possible target.\n';
          txtErrors += '           (Escape this cell if it\'s just text.)\n';
        }
        if(!/^ *$/.test(tableFields[2])) {
          if(!errorThisLine) txtErrors += 'At: '+line+'\n';
          errorThisLine = true;
          txtErrors += '  Warning: Call column 2 ('+tableFields[2]+') does nothing.\n';
        }
        // TODO: Test Call argument format.
        // TODO: Test Call target against the wiki page expected.
        // TODO: Test Call argument against the wiki page contents.
      }
    }
  }
  if(txtErrors == '') return true;
  // Else there were errors.
  // Display the error dialog.
  document.getElementById('dialog-issues').value = 'The following issues were found:\n\n'+txtErrors;
  issues_dialog.dialog('open');
  return false;
}


function initButtons(count) {
  // Look for the form to add above.
  var divMainForm = document.getElementsByTagName('FORM');
  // Wait up to 60 seconds for the page to load.  Longer if we're sure we're editing.
  if((count < 300 || /\?edit$/.test(document.URL)) && (divMainForm.length == 0 || divMainForm[0].getElementsByTagName("DIV").length == 0)) {
    // If this is a non-editing page, return.
    if(document.getElementById("addChildPopup") != null) return;
    setTimeout("initButtons("+(count+1)+")", 200); // set a timer to check again in 200 ms.
    return;
  }
  divMainForm = divMainForm[0];

  // Add the buttons as the first child of div.main, before the form inside it.
  // No jQuery allowed here.
  var divButtons = document.createElement("DIV");
  divButtons.id = "mastiffe_buttons";
  divButtons.className = "collapse_rim";
  newhtml = '<div style="float: right;" class="meta"><a href="javascript:expandAll();">Expand All</a> | <a href="javascript:collapseAll();">Collapse All</a></div>';
  newhtml += "<a href=\"javascript:toggleCollapsable('manubuttons');\">";
  newhtml += '<img src="/files/images/collapsableClosed.gif" class="left" id="imgmanubuttons"/></a> &nbsp; ';
  newhtml += '<span class="meta">'+project_name+'</span>';
  newhtml += '<div class="hidden" id="manubuttons">';
  // Buttons go here.
  // Syntax Check button, replaced by form submit check.
  //newhtml += '<button type="button" id="butVerify" onclick="checkMastiffe();">Syntax Check</button>';
  newhtml += '<button type="button" id="butAddManuStep" onclick="addMastiffeStep();">Add Step</button>';
  newhtml += '<button type="button" id="butEditManuStep" onclick="editMastiffeStep();">Edit Step</button>';
  // End buttons.
  newhtml += '</div>';
  divButtons.innerHTML = newhtml;
  divButtons.style.display = "none";

  divMainForm.parentNode.insertBefore(divButtons,divMainForm);
  //document.getElementById("butVerify").disabled = true;
  document.getElementById("butAddManuStep").disabled = true;
  document.getElementById("butEditManuStep").disabled = true;

  // Add another button at the bottom.
  //newhtml += '<button type="button" id="butAddParam" onclick="addMastiffeParam();">Add Parameter</button>';
  var butAddParam = document.createElement("INPUT");
  butAddParam.type = "button";
  butAddParam.id = "butAddParam";
  if( butAddParam.attachEvent ){
    butAddParam.attachEvent('onclick', addMastiffeParam);
  } else {
    butAddParam.setAttribute('onclick', 'addMastiffeParam();');
  }
  butAddParam.value = 'Add Parameter';
  butAddParam.disabled = true;
  divMainForm.getElementsByTagName("DIV")[0].appendChild(butAddParam);

  // And another for Rsel.
  var butParseRsel = document.createElement("INPUT");
  butParseRsel.type = "button";
  butParseRsel.id = "butParseRsel";
  if( butParseRsel.attachEvent ){
    butParseRsel.attachEvent('onclick', parseRsel);
  } else {
    butParseRsel.setAttribute('onclick', 'parseRsel();');
  }
  butParseRsel.value = 'Ruby to Rsel';
  divMainForm.getElementsByTagName("DIV")[0].appendChild(document.createTextNode(" "));
  divMainForm.getElementsByTagName("DIV")[0].appendChild(butParseRsel);

  // Uncomment the following to
  // finally display the buttons' div.
  divButtons.style.display = "";
  
  // Begin getting jQuery if we didn't already.
  if(!(/\?edit$/.test(document.URL))) loadjQuery();
}
initButtons(0);

// Begin getting jQuery if we know it's needed.
if(/\?edit$/.test(document.URL)) loadjQuery();
