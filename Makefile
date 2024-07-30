# Makefile provides an API for CI related tasks
# Using the makefile is not required however CI
# uses the specific targets within the file.
# Therefore may be useful in ensuring a change
# is ready to pass CI checks.

# ECS environment to deploy image to
DEPLOY_ENV ?= dev

# Docker image tag to deploy
DEPLOY_TAG ?= latest

.PHONY: schedule-k8s-deployment
schedule-k8s-deployment:
	./ci-scripts/schedule-k8s-deploy.sh "${DEPLOY_ENV}" "${DEPLOY_TAG}"

.PHONY: schedule-tests
schedule-tests:
	./ci-scripts/schedule-tests.sh "${DEPLOY_ENV}" "${TEST_SELECTOR}"
