-- Contains a few product search parameters that will work
-- on either /bs/products/search/(current|all)

wrk.method = "POST"
wrk.body = '{"productName":["a","e"],"unitVolume":{"max":34},"sortOrder":{"key":"productName","order":"asc"}}'
wrk.headers["Content-Type"] = "application/json"