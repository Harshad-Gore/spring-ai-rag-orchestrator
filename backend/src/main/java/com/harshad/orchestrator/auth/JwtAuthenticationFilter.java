package com.harshad.orchestrator.auth;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

	private final JwtService jwtService;
	private final AuthProperties authProperties;

	public JwtAuthenticationFilter(JwtService jwtService, AuthProperties authProperties) {
		this.jwtService = jwtService;
		this.authProperties = authProperties;
	}

	@Override
	protected void doFilterInternal(
			HttpServletRequest request,
			HttpServletResponse response,
			FilterChain filterChain) throws ServletException, IOException {
		resolveToken(request).flatMap(jwtService::verify).ifPresent((principal) -> {
				List<SimpleGrantedAuthority> authorities = List.of(
					new SimpleGrantedAuthority("ROLE_" + principal.role().name())
				);
				UsernamePasswordAuthenticationToken authentication =
					new UsernamePasswordAuthenticationToken(principal, null, authorities);
				SecurityContextHolder.getContext().setAuthentication(authentication);
		});

		filterChain.doFilter(request, response);
	}

	private Optional<String> resolveToken(HttpServletRequest request) {
		String authorizationHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
		if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
			return Optional.of(authorizationHeader.substring(7));
		}

		if (request.getCookies() == null) {
			return Optional.empty();
		}

		return Arrays.stream(request.getCookies())
			.filter((cookie) -> authProperties.getCookieName().equals(cookie.getName()))
			.map(jakarta.servlet.http.Cookie::getValue)
			.findFirst();
	}
}
