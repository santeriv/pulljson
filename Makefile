TESTS = test/*.js
test:
	mocha --timeout 15000 --reporter nyan $(TESTS)

.PHONY: test
