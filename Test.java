import com.harshad.orchestrator.document.WebContentExtractor;
public class Test {
    public static void main(String[] args) throws Exception {
        WebContentExtractor ext = new WebContentExtractor();
        try {
            var content = ext.extract("https://www.geeksforgeeks.org/dsa/binary-search-tree-data-structure/");
            System.out.println("Success! length=" + content.text().length());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
