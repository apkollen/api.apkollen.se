-- Contains a few product search parameters that will work
-- on either /bs/products/search/(current|all), as would be likely
-- for looking at the top 10

wrk.method = "POST"
wrk.body = '{"productName":"e","unitVolume":{"max":34},"sortOrder":{"key":"productName","order":"asc"},"maxItems":10,"includeDead":false}'
wrk.headers["Content-Type"] = "application/json"