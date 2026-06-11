package com.harshad.orchestrator.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.s3")
public class S3Properties {

	private String endpoint;
	private String region;
	private String accessKeyId;
	private String secretAccessKey;
	private String bucketName;

	public String getEndpoint() { return endpoint; }
	public void setEndpoint(String endpoint) { this.endpoint = endpoint; }

	public String getRegion() { return region; }
	public void setRegion(String region) { this.region = region; }

	public String getAccessKeyId() { return accessKeyId; }
	public void setAccessKeyId(String accessKeyId) { this.accessKeyId = accessKeyId; }

	public String getSecretAccessKey() { return secretAccessKey; }
	public void setSecretAccessKey(String secretAccessKey) { this.secretAccessKey = secretAccessKey; }

	public String getBucketName() { return bucketName; }
	public void setBucketName(String bucketName) { this.bucketName = bucketName; }
}
