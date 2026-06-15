package com.harshad.orchestrator;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import com.harshad.orchestrator.document.*;
import java.util.UUID;

@SpringBootTest
class VectorSaveTest {
    @Autowired
    DocumentChunkRepository chunkRepository;

    @Test
    void testSave() {
        try {
            float[] vector = new float[768];
            for(int i=0; i<768; i++) vector[i] = 0.1f;
            
            DocumentChunk chunk = new DocumentChunk(
                UUID.randomUUID(), UUID.randomUUID(), "test.txt", 0, "test content", vector
            );
            chunkRepository.save(chunk);
            System.out.println("SUCCESSFULLY SAVED VECTOR TO DB!");
            
            // cleanup
            chunkRepository.delete(chunk);
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }
}
