package com.harshad.orchestrator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Disabled;
import com.harshad.orchestrator.document.WebContentExtractor;

@Disabled("Manual network smoke test; excluded from deterministic CI")
public class WebExtractorTest2 {
    @Test
    public void testGFG() {
        WebContentExtractor ext = new WebContentExtractor();
        try {
            var content = ext.extract("https://www.geeksforgeeks.org/dsa/binary-search-tree-data-structure/");
            System.out.println("TITLE: " + content.title());
            System.out.println("TITLE LENGTH: " + content.title().length());
        } catch (Throwable t) {
            t.printStackTrace();
        }
    }
}
