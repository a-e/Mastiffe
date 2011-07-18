# Mastiffe
### The Manual AJAX System Testing Interface For FitnessE

Mastiffe provides a way to use the [FitNesse](http://fitnesse.org/) testing wiki for manual testing.  Instead of running automated test steps against an application, test steps appear in a dialog in your browser.  You can pass or fail steps, or block or abort a test, and add notes as necessary.

## Installation

The files required for Mastiffe appear in this repository as they would from the root of a FitNesse wiki, with one exception.  So to install:

1. Set up FitNesse by executing the jarfile (available from http://fitnesse.org/) once, in your chosen installation directory.
2. In the same directory, run:

        $ git clone git@github.com:a-e/mastiffe.git

3. If no plugins.properties file existed in your install, just rename readme.plugins.properties.txt to plugsins.properties.  Otherwise you will need to merge the new file into the old file.  If two plugins both work on HtmlPageFactory, well, you will need to combine their source codes somehow.
4. Ensure RubySlim is installed on the server, so that FitNesse can access it.  Mastiffe is mostly Javascript, but depends on a tiny RubySlim backend.
5. Finally, run the FitNesse server like this:

        $ java -cp mastiffe/mastiffe.jar:fitnesse.jar fitnesseMain.FitNesseMain -p 8080

And visit http://localhost:8080/ in your browser.

## Your first Mastiffe test run

Visit http://localhost:8080/MastiffeDemo.DemoPage to see an example Mastiffe test.  This test demonstrates several Mastiffe capabilities, including parameters, embedding HTML in test steps, and calling other tests with parameters.  Click the Test link and a dialog will appear with the first test step.  The following options are available:

* Pass: Pass this test step.  The next test step will then appear.
* Pass All: Pass all remaining test steps and end the test.
* Blocked: Something is blocking you from completing this test step.  Explain why in the Notes field.  This will skip all other test steps and end the test.
* Fail: Fail this test step.  Explain why in the Notes field.  The next test step will then appear.
* Abort: Abort this test run.  Equivalent to clicking the "X" to close the dialog.  The current step is marked as aborted, all other steps are skipped, and the test ends.

## Editing Mastiffe tests

From http://localhost:8080/MastiffeDemo.DemoPage click the Edit link on the left.  You can edit the test just as you would edit any other FitNesse test; but also notice:

###The Mastiffe header and buttons

* Add Step: Provides a WYSIWYG GUI dialog to add a new test step.  If the page has no Mastiffe test yet, it will add a header for one.
* Add Parameter: Provides a GUI dialog to add a FitNesse variable.  See below for what you can do with a FitNesse variable.

### The test text

In the text area, you will see several interesting features in this test:

<table>
    <tr>
        <td>`!define passbutton {Pass}`</td>
        <td>Defines a FitNesse variable, which can also be used as a parameter when calling the test from another test.</td>
    </tr>
    <tr>
        <td>`| table: Mastiffe test |`</td>
        <td>Starts a Mastiffe test.  This must be pretty much verbatim.</td>
    </tr>
    <tr>
        <td>`| Test step | Expected result | Example data |`</td>
        <td>An optional header row.  If present verbatim like this, as the first line of the test, it will be ignored.  Any other row will be considered a test step.</td>
    </tr>
    <tr>
        <td>`| Click ${passbutton} | The step passes | |`</td>
        <td>This is how you use a FitNesse variable in a test.</td>
    </tr>
    <tr>
        <td>`|!- Look at <img src="/files/images/FitNesseLogo.gif" /> -!|!- The FitNesse logo appears. -!| |`</td>
        <td>Escaped cells.  The first one is escaped so that the HTML will appear as HTML and not text.  The second is escaped because "FitNesse" is in CamelCase, and so looks like a WikiWord that should be WikiLinked.  And it is unless it is escaped.</td>
    </tr>
    <tr>
        <td>`| Call .MastiffeDemo.HelperTests.GoogleFor | | searchengine:Yahoo! |`</td>
        <td>This is how you call another Mastiffe test.  The third column contains parameters.  You can use either JSON or this trimmed-down JSON format (without quotes or braces) to specify parameters.</td>
    </tr>
</table>

### Syntax checking

Finally, try clicking the Save button.  Notice that a dialog pops up.  Mastiffe does some syntax checking before you save, and it noticed that there is something that looks like HTML in an unescaped cell.  As this text is intended to appear as raw HTML source, you can click Save Anyway.  Cancel would cancel the save and let you change the page.

## License

The MIT License

Copyright (c) 2011 Automation Excellence

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
