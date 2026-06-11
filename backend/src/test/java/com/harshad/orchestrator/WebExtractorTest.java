package com.harshad.orchestrator;
import org.junit.jupiter.api.Test;
import com.harshad.orchestrator.document.WebContentExtractor;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
public class WebExtractorTest {
    @Test
    public void testGFG() {
        WebContentExtractor ext = new WebContentExtractor();
        try {
            var content = ext.extract("https://www.geeksforgeeks.org/dsa/binary-search-tree-data-structure/");
            System.out.println("Success! length=" + content.text().length());
        } catch (Throwable t) {
            System.out.println("CAUGHT THROWABLE: " + t.getClass().getName());
            t.printStackTrace();
        }
    }
}
