package mastiffe;
import java.util.*;

public class MastiffeHtmlPageFactory extends fitnesse.html.HtmlPageFactory {
  public MastiffeHtmlPageFactory(Properties p) {super();}

  public fitnesse.html.HtmlPage newPage() {
    return new MastiffeHtmlPage();
  }

  public String toString() {
    return getClass().getName();
  }
}
