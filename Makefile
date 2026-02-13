.PHONY: dev dev-seed test build install clean serve pr-test seed

# Install dependencies
install:
	cd frontend && npm ci

# Run dev server (accessible on LAN)
dev:
	cd frontend && npm run dev -- --host 0.0.0.0

# Run dev server and open seed page
dev-seed:
	@echo "Starting dev server..."
	@echo "Open http://localhost:5173/seed.html to seed test data"
	cd frontend && npm run dev -- --host 0.0.0.0 --open /seed.html

# Run tests
test:
	cd frontend && npm test -- --run

# Run tests in watch mode
test-watch:
	cd frontend && npm test

# Build for production
build:
	cd frontend && npm run build

# Serve production build locally
serve: build
	cd frontend && npx serve dist -l 5173

# Lint
lint:
	cd frontend && npm run lint

# Clean build artifacts
clean:
	rm -rf frontend/dist frontend/node_modules/.vite

# Test a PR branch locally (usage: make pr-test BRANCH=fix/my-feature)
pr-test:
ifndef BRANCH
	$(error BRANCH is required. Usage: make pr-test BRANCH=fix/my-feature)
endif
	git fetch origin
	git checkout $(BRANCH)
	cd frontend && npm ci && npm test -- --run && npm run dev -- --host 0.0.0.0

# Switch back to main
main:
	git checkout main

# Full CI check (what GitHub Actions runs)
ci: install test lint build
	@echo "✅ All CI checks passed"
