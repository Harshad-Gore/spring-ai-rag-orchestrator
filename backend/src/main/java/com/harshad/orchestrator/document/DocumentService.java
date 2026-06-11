package com.harshad.orchestrator.document;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class DocumentService {

	private static final Logger log = LoggerFactory.getLogger(DocumentService.class);
	private static final int MAX_WORDS_PER_CHUNK = 500;

	private final DocumentRepository documentRepository;
	private final DocumentChunkRepository chunkRepository;
	private final StorageService storageService;
	private final TextExtractorService textExtractor;

	public DocumentService(
			DocumentRepository documentRepository,
			DocumentChunkRepository chunkRepository,
			StorageService storageService,
			TextExtractorService textExtractor) {
		this.documentRepository = documentRepository;
		this.chunkRepository = chunkRepository;
		this.storageService = storageService;
		this.textExtractor = textExtractor;
	}

	@Transactional(readOnly = true)
	public List<Document> listByNotebook(UUID notebookId) {
		return documentRepository.findByNotebookIdOrderByCreatedAtDesc(notebookId);
	}

	@Transactional
	public List<Document> ingest(List<MultipartFile> files, UUID notebookId, UUID userId) {
		List<Document> results = new ArrayList<>();

		for (MultipartFile file : files) {
			try {
				results.add(ingestSingle(file, notebookId, userId));
			} catch (Exception e) {
				log.error("Failed to ingest file: {}", file.getOriginalFilename(), e);
				Document failed = new Document(notebookId, userId,
					file.getOriginalFilename(), file.getContentType(), file.getSize(), "failed");
				failed.setStatus(DocumentStatus.FAILED);
				results.add(documentRepository.save(failed));
			}
		}

		return results;
	}

	private Document ingestSingle(MultipartFile file, UUID notebookId, UUID userId) {
		Document doc = new Document(notebookId, userId,
			file.getOriginalFilename(), file.getContentType(), file.getSize(), "pending");
		doc = documentRepository.save(doc);

		try {
			String s3Key = storageService.upload(file, userId, notebookId, doc.getId());
			doc.setS3Key(s3Key);

			String text = textExtractor.extractText(file);
			log.info("Extracted {} characters from {}", text.length(), file.getOriginalFilename());

			List<String> chunks = textExtractor.chunkText(text, MAX_WORDS_PER_CHUNK);
			log.info("Created {} chunks from {}", chunks.size(), file.getOriginalFilename());

			for (int i = 0; i < chunks.size(); i++) {
				chunkRepository.save(new DocumentChunk(
					doc.getId(), notebookId, file.getOriginalFilename(), i, chunks.get(i)));
			}

			doc.setStatus(DocumentStatus.PROCESSED);
			return documentRepository.save(doc);
		} catch (Exception e) {
			doc.setStatus(DocumentStatus.FAILED);
			documentRepository.save(doc);
			throw new RuntimeException("Failed to process: " + file.getOriginalFilename(), e);
		}
	}

	@Transactional
	public void delete(UUID documentId, UUID userId) {
		Document doc = documentRepository.findById(documentId)
			.orElseThrow(() -> new IllegalArgumentException("Document not found"));
		if (!doc.getUserId().equals(userId)) {
			throw new SecurityException("Not authorized to delete this document");
		}

		chunkRepository.deleteByDocumentId(documentId);

		try {
			storageService.delete(doc.getS3Key());
		} catch (Exception e) {
			log.warn("Failed to delete S3 object: {}", doc.getS3Key(), e);
		}

		documentRepository.delete(doc);
	}
}
