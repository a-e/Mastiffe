package mastiffe;

public class MastiffeHtmlPage extends fitnesse.html.HtmlPage {
  protected MastiffeHtmlPage() { super(); }
  public fitnesse.html.HtmlTag makeHead() {
    super.makeHead();
    head.add(fitnesse.html.HtmlUtil.makeJavascriptLink("/files/javascript/html-xpath.js"));
    head.add(fitnesse.html.HtmlUtil.makeJavascriptLink("/files/javascript/mastiffe.js"));
    return(head);
  }
}
