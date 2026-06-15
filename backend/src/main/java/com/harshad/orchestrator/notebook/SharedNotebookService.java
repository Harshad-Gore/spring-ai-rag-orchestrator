package com.harshad.orchestrator.notebook;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.harshad.orchestrator.auth.UserAccount;
import com.harshad.orchestrator.auth.UserAccountRepository;
import com.harshad.orchestrator.chat.ChatMessage;
import com.harshad.orchestrator.chat.ChatMessageRepository;
import com.harshad.orchestrator.document.Document;
import com.harshad.orchestrator.document.DocumentChunk;
import com.harshad.orchestrator.document.DocumentChunkRepository;
import com.harshad.orchestrator.document.DocumentRepository;

@Service
public class SharedNotebookService {

	private final NotebookRepository notebookRepository;
	private final DocumentRepository documentRepository;
	private final DocumentChunkRepository documentChunkRepository;
	private final ChatMessageRepository chatMessageRepository;
	private final UserAccountRepository userAccountRepository;

	public SharedNotebookService(
			NotebookRepository notebookRepository,
			DocumentRepository documentRepository,
			DocumentChunkRepository documentChunkRepository,
			ChatMessageRepository chatMessageRepository,
			UserAccountRepository userAccountRepository) {
		this.notebookRepository = notebookRepository;
		this.documentRepository = documentRepository;
		this.documentChunkRepository = documentChunkRepository;
		this.chatMessageRepository = chatMessageRepository;
		this.userAccountRepository = userAccountRepository;
	}

	@Transactional(readOnly = true)
	public Notebook getByShareToken(UUID shareToken) {
		return notebookRepository.findByShareToken(shareToken)
			.orElseThrow(() -> new IllegalArgumentException("Invalid share token or notebook no longer shared"));
	}

	@Transactional
	public Notebook cloneNotebook(UUID shareToken, UUID newUserId) {
		Notebook source = getByShareToken(shareToken);
		if (!"CLONE".equals(source.getShareType())) {
			throw new IllegalStateException("This notebook is not available for cloning");
		}

		String resources = source.getSharedResources();
		boolean includeDocs = resources != null && resources.contains("DOCS");
		boolean includeChat = resources != null && resources.contains("CHAT");

		String ownerEmail = userAccountRepository.findById(source.getUserId())
			.map(UserAccount::getEmail)
			.orElse("Unknown User");

		// Create new notebook
		Notebook cloned = new Notebook(newUserId, source.getTitle() + " (Clone)");
		cloned.setClonedFromEmail(ownerEmail);
		cloned = notebookRepository.save(cloned);

		// Clone documents if requested
		if (includeDocs) {
			List<Document> sourceDocs = documentRepository.findByNotebookIdOrderByCreatedAtDesc(source.getId());
			for (Document sourceDoc : sourceDocs) {
				Document newDoc = new Document(
					cloned.getId(), newUserId, sourceDoc.getFileName(),
					sourceDoc.getContentType(), sourceDoc.getSizeBytes(), sourceDoc.getS3Key()
				);
				newDoc.setStatus(sourceDoc.getStatus());
				newDoc = documentRepository.save(newDoc);

				// Clone chunks
				List<DocumentChunk> sourceChunks = documentChunkRepository.findByDocumentId(sourceDoc.getId());
				for (DocumentChunk chunk : sourceChunks) {
					float[] vector = chunk.getEmbedding() != null ? chunk.getEmbedding() : new float[768];
					DocumentChunk newChunk = new DocumentChunk(
						newDoc.getId(), cloned.getId(), chunk.getFileName(),
						chunk.getChunkIndex(), chunk.getContent(), vector
					);
					documentChunkRepository.save(newChunk);
				}
			}
		}

		// Clone chat history if requested
		if (includeChat) {
			List<ChatMessage> sourceChats = chatMessageRepository.findByNotebookIdOrderByCreatedAtAsc(source.getId());
			for (ChatMessage chat : sourceChats) {
				ChatMessage newChat = new ChatMessage(
					cloned.getId(), chat.getRole(), chat.getContent(), chat.getModelUsed()
				);
				chatMessageRepository.save(newChat);
			}
		}

		return cloned;
	}
}
