package com.harshad.orchestrator.document;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class TextExtractorService {

	public String extractText(MultipartFile file) {
		String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "";
		String ext = getExtension(fileName).toLowerCase();

		String rawText;
		try (InputStream is = file.getInputStream()) {
			rawText = switch (ext) {
				case "pdf" -> extractPdf(is);
				case "docx" -> extractDocx(is);
				case "txt", "md", "csv" -> new String(is.readAllBytes(), StandardCharsets.UTF_8);
				default -> new String(is.readAllBytes(), StandardCharsets.UTF_8);
			};
		} catch (IOException e) {
			throw new RuntimeException("Failed to extract text from: " + fileName, e);
		}
		
		// PostgreSQL does not support null characters (\u0000) in TEXT fields
		return rawText != null ? rawText.replace("\u0000", "") : "";
	}

	public List<String> chunkText(String text, int maxWordsPerChunk) {
		if (text == null || text.isBlank()) {
			return List.of();
		}

		List<String> chunks = new ArrayList<>();
		String[] paragraphs = text.split("\\n\\s*\\n");
		StringBuilder current = new StringBuilder();
		int wordCount = 0;

		for (String paragraph : paragraphs) {
			String trimmed = paragraph.trim();
			if (trimmed.isEmpty()) continue;

			int paragraphWords = trimmed.split("\\s+").length;

			if (wordCount + paragraphWords > maxWordsPerChunk && wordCount > 0) {
				chunks.add(current.toString().trim());
				current = new StringBuilder();
				wordCount = 0;
			}

			current.append(trimmed).append("\n\n");
			wordCount += paragraphWords;
		}

		if (!current.isEmpty()) {
			chunks.add(current.toString().trim());
		}

		if (chunks.isEmpty() && !text.isBlank()) {
			String[] words = text.split("\\s+");
			current = new StringBuilder();
			for (int i = 0; i < words.length; i++) {
				current.append(words[i]).append(" ");
				if ((i + 1) % maxWordsPerChunk == 0) {
					chunks.add(current.toString().trim());
					current = new StringBuilder();
				}
			}
			if (!current.isEmpty()) {
				chunks.add(current.toString().trim());
			}
		}

		return chunks;
	}

	private String extractPdf(InputStream is) throws IOException {
		byte[] bytes = is.readAllBytes();
		try (PDDocument doc = Loader.loadPDF(bytes)) {
			PDFTextStripper stripper = new PDFTextStripper();
			return stripper.getText(doc);
		}
	}

	private String extractDocx(InputStream is) throws IOException {
		try (XWPFDocument doc = new XWPFDocument(is)) {
			StringBuilder sb = new StringBuilder();
			for (XWPFParagraph paragraph : doc.getParagraphs()) {
				sb.append(paragraph.getText()).append("\n");
			}
			return sb.toString();
		}
	}

	private String getExtension(String fileName) {
		int dotIndex = fileName.lastIndexOf('.');
		return dotIndex >= 0 ? fileName.substring(dotIndex + 1) : "";
	}
}
