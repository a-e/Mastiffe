//Add buttons to an editing page to allow for easier entry of manual test steps.
project_name = 'Mastiffe';
if(document.all) {
  LINE_SPLIT_CHARS = "\r\n";
} else {
  LINE_SPLIT_CHARS = "\n";
}

loadjQuery = function() {
  // TODO: Load a spinner.
  loadjQuery.getScript("/files/javascript/jquery-1.4.4.min.js");
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
          href: "/files/css/jquery-ui-1.8.10.custom.css"
          });

    $("head").append("<link>");
    css = $("head").children(":last");
    css.attr({
          rel:  "stylesheet",
          type: "text/css",
          href: "/files/css/jquery.wysiwyg.css"
          });

    $.ajax({
        cache: true,
        dataType: "script",
        url: "/files/javascript/jquery-ui-1.8.10.custom.min.js",
        success: function(){ loadwysiwyg(); }
    });
  }
}

function loadwysiwyg() {
  $.ajax({
      cache: true,
      dataType: "script",
      url: "/files/javascript/jquery.wysiwyg.js",
      success: function(){ setTimeout("programButtons()",200); }
  });
}

html_regex = /<[a-z]+[ >]|\|/i;
// un-HTML-ify an argument, if it has only unnecessary HTML.
function unhtmlify(original) {
  var testversion = original.replace(/^ *<p>/i, '').replace(/<\/p> *$/i, '');
  if(!html_regex.test(testversion)) {
    testversion = testversion.replace(/&quot;/g, '"');
    testversion = testversion.replace(/&lt;/g, '<');
    testversion = testversion.replace(/&gt;/g, '>');
    testversion = testversion.replace(/&amp;/g, '&'); // Last, of course.
    if(!/&(#[0-9]+|[a-z]+);/.test(testversion)) return testversion;
  }
  return original;
}


var MSTATE = {
    BEFORE : 0,
    WITHIN : 1,
    AFTER : 2
};
issues_dialog = null;
add_step_dialog = null;
add_param_dialog = null;
function programButtons() { // Now that jQuery UI is loaded...
  // Load other bits of wysiwyg.
  $.ajax({
      cache: true,
      dataType: "script",
      url: "/files/javascript/wysiwyg.link.js",
  });
  $.ajax({
      cache: true,
      dataType: "script",
      url: "/files/javascript/wysiwyg.table.js",
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
      $( this ).dialog( "close" );
      document.getElementsByTagName('FORM')[0].submit();
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
title: mastiffe_img+'Add Step',
width: 800,
height:710,
modal: true,
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
  $('#dialog-add-step-action').wysiwyg('clear');
  $('#dialog-add-step-expected').wysiwyg('clear');
  $('#dialog-add-step-example').wysiwyg('clear');
 },
buttons: {
    Add: function() {
        $( this ).dialog( "close" );
        // Get the entries.
        var txtAction = document.getElementById('dialog-add-step-action').value;
        var txtExpected = document.getElementById('dialog-add-step-expected').value;
        var txtExample = document.getElementById('dialog-add-step-example').value;

        // Remove HTML from the values if at all possible.
        txtAction = unhtmlify(txtAction);
        txtExpected = unhtmlify(txtExpected);
        txtExample = unhtmlify(txtExample);

        // Escape entries that need it.
        if(html_regex.test(txtAction)) txtAction = '!- '+txtAction+' -!';
        else txtAction = ' '+txtAction+' ';
        if(html_regex.test(txtExpected)) txtExpected = '!- '+txtExpected+' -!';
        else txtExpected = ' '+txtExpected+' ';
        if(html_regex.test(txtExample)) txtExample = '!- '+txtExample+' -!';
        else txtExample = ' '+txtExample+' ';


        // Find the end of the Mastiffe table.
        var TA=document.getElementById('pageContentId').value;
        var lines=TA.split(LINE_SPLIT_CHARS);
        var line_status = MSTATE.BEFORE;

        var lastline;
        for(var line in lines) {
          lastline = line;
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
        }
        // Set up the final text line.
        txtAction = '|'+txtAction+'|'+txtExpected+'|'+txtExample+'|';

        // If a Mastiffe table was found, and its end was found too, insert the line at the end.
        if(line_status == MSTATE.AFTER) {
          lines.splice(lastline, 0, txtAction);
        } else {
          lines.push(txtAction);
        }
        document.getElementById('pageContentId').value = lines.join(LINE_SPLIT_CHARS);
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
      '</table>' +
    '</div>')
    .dialog({
autoOpen: false,
title: mastiffe_img+'Add Parameter',
width: 500,
modal: true,
buttons: {
    Add: function() {
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

// Display the dialog to add a Mastiffe step.
function addMastiffeStep() {
  document.getElementById('dialog-add-step-action').value = '';
  document.getElementById('dialog-add-step-expected').value = '';
  document.getElementById('dialog-add-step-example').value = '';
  add_step_dialog.dialog('open');
}

function addMastiffeParam() {
  document.getElementById('dialog_param_name').value = '';
  document.getElementById('dialog_param_value').value = '';
  add_param_dialog.dialog('open');
}

function doAddMastiffeParam() {
  // Get the entries.
  var txtName = jQuery.trim($('#dialog_param_name').val());
  var txtValue = $('#dialog_param_value').val();
  if(/[   {}]/.test(txtName)) {
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
  var TA=document.getElementById('pageContentId').value;
  var lines=TA.split(LINE_SPLIT_CHARS);
  var line_status = MSTATE.BEFORE;
  var line;

  for(line in lines) {
    var found_name;
    if((found_name=/^ *!define  *([^ ]*) /i.exec(lines[line])) != null) {
      line_status = MSTATE.WITHIN;
      if(found_name[1] == txtName) {
        alert('There is already a parameter named "'+txtName+'".  Please edit it or choose a different name.');
        return;
      }
    }
    if(line_status == MSTATE.BEFORE) {
      if(/^\| *table: *Mastiffe test *\| *$/i.test(lines[line])) {
        lines.splice(line, 0, '');
        lines.splice(line, 0, '');
        line--;
        line_status = MSTATE.AFTER;
        break;
      }
    } else {
      if(line_status == MSTATE.WITHIN && lines[line].substr(0,1) != '!') {
        line_status = MSTATE.AFTER;
        break;
      }
    }
  }

  if(line_status == MSTATE.BEFORE) {
    // Append the start of a new Mastiffe table if none was found.
    lines.push('');
    lines.push('| table:Mastiffe test |');
    lines.push('| Test step | Expected result | Example data |');
    line = lines.length-3;
  }
  // Set up the final text line.
  txtValue = '!define '+txtName+' {'+txtValue+'}';
  lines.splice(line, 0, txtValue);
  document.getElementById('pageContentId').value = lines.join(LINE_SPLIT_CHARS);
  add_param_dialog.dialog('close');
}

match_a_call_line = /^\| *[Cc]all +(\.?[A-Z][a-z0-9]+(?:[A-Z][a-z0-9]*)+(?:\.[A-Z][a-z0-9]+(?:[A-Z][a-z0-9]*)+)*) *\| *\|[^|]*\| *$/;

// Check any Mastiffe table within #pageContentId
function checkMastiffe() {
  issues_dialog.dialog('close');
  var lines;
  var txtErrors = "";
  var TA=document.getElementById('pageContentId').value;
  lines=TA.split(LINE_SPLIT_CHARS);
  var MastiffeState = MSTATE.BEFORE;
  for(var line in lines) {
    if(line >= 0) line = lines[line];
    if(MastiffeState != MSTATE.WITHIN) {
      if(/^\| *table: *Mastiffe test *\| *$/i.test(line)) {
        if(MastiffeState == MSTATE.BEFORE) {
          // Now we're in a Mastiffe table.
          MastiffeState = MSTATE.WITHIN;
          continue;
        } else {
          // We found a second Mastiffe table!  Error!
          txtErrors += 'At: '+line+'\n  Error: Only one Mastiffe table per page is functional.\n';
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
      // Remove any escaped entries
      var cleanline = line.replace(/\|!-.*?-!\|/g,'||');
      // Remove escaped entries next to other escaped entries.
      cleanline = cleanline.replace(/\|!-.*?-!\|/g,'||');
      // Look for unescaped HTML.
      if(/<(?:[bh]r ?\/?|p ?\/?|\/[a-z]+)>/i.test(cleanline)) {
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
        if(/^\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|/.test(cleanline))
          txtErrors += '         (Did you forget to escape a pipe?)\n';
          txtErrors += '  Unescaped entries: '+cleanline+'\n';
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


function initButtons() {
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
  newhtml += '<button type="button" id="butAddParam" onclick="addMastiffeParam();">Add Parameter</button>';
  // End buttons.
  newhtml += '</div>';
  divButtons.innerHTML = newhtml;
  divButtons.style.display = "none";

  var divMainForm = document.getElementsByTagName('FORM')[0];
  divMainForm.parentNode.insertBefore(divButtons,divMainForm);
  //document.getElementById("butVerify").disabled = true;
  document.getElementById("butAddManuStep").disabled = true;
  document.getElementById("butAddParam").disabled = true;
  // Uncomment the following to
  // finally display the buttons' div.
  divButtons.style.display = "";
}
initButtons();
// Begin getting jQuery.
loadjQuery();

