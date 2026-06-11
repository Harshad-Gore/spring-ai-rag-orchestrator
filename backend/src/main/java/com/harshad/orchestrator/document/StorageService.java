package com.harshad.orchestrator.document;

import java.io.IOException;
import java.io.InputStream;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.harshad.orchestrator.config.S3Properties;

import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
public class StorageService {

	private final S3Client s3Client;
	private final S3Properties s3Properties;

	public StorageService(S3Client s3Client, S3Properties s3Properties) {
		this.s3Client = s3Client;
		this.s3Properties = s3Properties;
	}

	public String upload(MultipartFile file, UUID userId, UUID notebookId, UUID documentId) {
		String key = String.join("/",
			userId.toString(),
			notebookId.toString(),
			documentId.toString(),
			file.getOriginalFilename()
		);

		try {
			s3Client.putObject(
				PutObjectRequest.builder()
					.bucket(s3Properties.getBucketName())
					.key(key)
					.contentType(file.getContentType())
					.build(),
				RequestBody.fromInputStream(file.getInputStream(), file.getSize())
			);
		} catch (IOException e) {
			throw new RuntimeException("Failed to upload file to S3: " + e.getMessage(), e);
		}

		return key;
	}

	public void delete(String s3Key) {
		s3Client.deleteObject(
			DeleteObjectRequest.builder()
				.bucket(s3Properties.getBucketName())
				.key(s3Key)
				.build()
		);
	}

	public InputStream download(String s3Key) {
		return s3Client.getObject(
			GetObjectRequest.builder()
				.bucket(s3Properties.getBucketName())
				.key(s3Key)
				.build()
		);
	}
}
