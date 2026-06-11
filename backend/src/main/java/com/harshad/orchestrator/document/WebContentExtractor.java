package com.harshad.orchestrator.document;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.jsoup.Jsoup;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Extracts readable text content from web URLs and YouTube videos.
 *
 * Strategy:
 * - YouTube links → yt-dlp for subtitle extraction (falls back to Jina Reader)
 * - Web pages     → Jina Reader API (renders JS, returns clean markdown)
 *                    Falls back to Jsoup for static HTML extraction
 */
@Service
public class WebContentExtractor {

	private static final Logger log = LoggerFactory.getLogger(WebContentExtractor.class);
	private static final Pattern YOUTUBE_PATTERN = Pattern.compile(
		"(?:youtube\\.com/watch\\?v=|youtu\\.be/|youtube\\.com/shorts/)([\\w-]+)");

	private final HttpClient httpClient = HttpClient.newBuilder()
		.followRedirects(HttpClient.Redirect.NORMAL)
		.connectTimeout(Duration.ofSeconds(15))
		.build();

	public WebContent extract(String url) {
		if (isYouTubeUrl(url)) {
			return extractYouTube(url);
		}
		return extractWebPage(url);
	}

	public boolean isYouTubeUrl(String url) {
		return YOUTUBE_PATTERN.matcher(url).find();
	}

	// ── YouTube ─────────────────────────────────────────────────────────────

	private WebContent extractYouTube(String url) {
		// Try yt-dlp first
		try {
			String result = runYtDlp(url);
			if (result != null && !result.isBlank()) {
				String title = extractYouTubeTitle(url);
				return new WebContent(title, result, url, "video/youtube");
			}
		} catch (Exception e) {
			log.warn("yt-dlp failed for {}, falling back to Jina Reader: {}", url, e.getMessage());
		}

		// Fall back to Jina Reader API
		return extractViaJina(url, "video/youtube");
	}

	private String runYtDlp(String url) throws Exception {
		// Check if yt-dlp is available
		ProcessBuilder checkPb = new ProcessBuilder("yt-dlp", "--version");
		checkPb.redirectErrorStream(true);
		Process checkProcess = checkPb.start();
		int checkExit = checkProcess.waitFor();
		if (checkExit != 0) {
			throw new RuntimeException("yt-dlp not found on PATH");
		}

		// Download auto-generated subtitles as text
		ProcessBuilder pb = new ProcessBuilder(
			"yt-dlp",
			"--skip-download",
			"--write-auto-sub",
			"--sub-lang", "en",
			"--sub-format", "vtt",
			"--print-to-file", "%(subtitles.en.-1.data)s", "-",
			url
		);
		pb.redirectErrorStream(true);
		Process process = pb.start();

		StringBuilder output = new StringBuilder();
		try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
			String line;
			while ((line = reader.readLine()) != null) {
				// Strip VTT timestamps and formatting
				if (line.startsWith("WEBVTT") || line.startsWith("Kind:") ||
					line.startsWith("Language:") || line.matches("\\d{2}:\\d{2}.*-->.*") ||
					line.isBlank() || line.matches("^\\d+$")) {
					continue;
				}
				// Remove HTML-like tags from subtitles
				line = line.replaceAll("<[^>]+>", "").trim();
				if (!line.isEmpty()) {
					output.append(line).append(" ");
				}
			}
		}

		int exitCode = process.waitFor();
		if (exitCode != 0 || output.isEmpty()) {
			// Try alternative: just get the subtitles URL and fetch it
			return fetchYouTubeSubtitlesViaApi(url);
		}

		return deduplicateSubtitles(output.toString());
	}

	private String fetchYouTubeSubtitlesViaApi(String url) {
		// Extract video ID
		Matcher matcher = YOUTUBE_PATTERN.matcher(url);
		if (!matcher.find()) return null;
		String videoId = matcher.group(1);

		try {
			// Use the timedtext API
			String apiUrl = "https://www.youtube.com/api/timedtext?v=" + videoId + "&lang=en&fmt=srv3";
			HttpRequest request = HttpRequest.newBuilder()
				.uri(URI.create(apiUrl))
				.header("User-Agent", "Mozilla/5.0")
				.timeout(Duration.ofSeconds(10))
				.GET()
				.build();

			HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
			if (response.statusCode() == 200 && !response.body().isBlank()) {
				// Parse the XML to extract text
				return Jsoup.parse(response.body()).text();
			}
		} catch (Exception e) {
			log.debug("YouTube timedtext API fallback failed: {}", e.getMessage());
		}
		return null;
	}

	private String extractYouTubeTitle(String url) {
		try {
			org.jsoup.nodes.Document doc = Jsoup.connect(url)
				.userAgent("Mozilla/5.0")
				.timeout(10000)
				.get();
			String title = doc.title();
			return title != null && !title.isBlank()
				? title.replace(" - YouTube", "").trim()
				: "YouTube Video";
		} catch (Exception e) {
			return "YouTube Video";
		}
	}

	/** Remove duplicate lines common in auto-generated subtitles */
	private String deduplicateSubtitles(String text) {
		String[] words = text.split("\\s+");
		StringBuilder result = new StringBuilder();
		String prev = "";
		for (String word : words) {
			if (!word.equalsIgnoreCase(prev)) {
				result.append(word).append(" ");
			}
			prev = word;
		}
		return result.toString().trim();
	}

	// ── Web Pages ───────────────────────────────────────────────────────────

	private WebContent extractWebPage(String url) {
		// Primary: Jina Reader API (handles JS-rendered pages)
		try {
			WebContent jina = extractViaJina(url, "text/html");
			if (jina != null && !jina.text().isBlank()) {
				return jina;
			}
		} catch (Throwable e) {
			log.warn("Jina Reader failed for {}, falling back to Jsoup: {}", url, e.getMessage());
		}

		// Fallback: Jsoup (static HTML)
		return extractViaJsoup(url);
	}

	private WebContent extractViaJina(String url, String contentType) {
		try {
			String jinaUrl = "https://r.jina.ai/" + url;
			HttpRequest request = HttpRequest.newBuilder()
				.uri(URI.create(jinaUrl))
				.header("Accept", "text/plain")
				.header("User-Agent", "Mozilla/5.0")
				.timeout(Duration.ofSeconds(30))
				.GET()
				.build();

			HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

			if (response.statusCode() == 200 && !response.body().isBlank()) {
				String body = response.body();
				// Jina returns markdown — the first line is usually the title
				String title = "Web Source";
				String[] lines = body.split("\n", 2);
				if (lines.length > 0 && lines[0].startsWith("Title:")) {
					title = lines[0].substring(6).trim();
				} else if (lines.length > 0 && lines[0].startsWith("# ")) {
					title = lines[0].substring(2).trim();
				}
				return new WebContent(title, body, url, contentType);
			}
		} catch (Exception e) {
			log.debug("Jina Reader request failed: {}", e.getMessage());
		}
		return null;
	}

	private WebContent extractViaJsoup(String url) {
		try {
			org.jsoup.nodes.Document doc = Jsoup.connect(url)
				.userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
				.timeout(15000)
				.maxBodySize(5_000_000)
				.get();

			String title = doc.title();
			if (title == null || title.isBlank()) {
				title = "Web Source";
			}

			// Remove scripts, styles, nav, footer, ads
			doc.select("script, style, nav, footer, header, aside, iframe, form, .ad, .ads, .advertisement, #cookie-banner").remove();

			// Try to find main content
			String text = "";
			var mainContent = doc.selectFirst("article, main, [role=main], .content, .post-content, .entry-content");
			if (mainContent != null) {
				text = mainContent.text();
			}

			if (text.length() < 200) {
				text = doc.body() != null ? doc.body().text() : doc.text();
			}

			return new WebContent(title, text, url, "text/html");
		} catch (Throwable e) {
			throw new RuntimeException("Failed to extract content from URL: " + url, e);
		}
	}

	// ── Record ──────────────────────────────────────────────────────────────

	public record WebContent(String title, String text, String sourceUrl, String contentType) {}
}
