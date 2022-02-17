-- Represent a larger search, sorted by category

wrk.method = "POST"
wrk.body = '{"name":"e","category":["Vin","Sprit"],"alcvol":{"min":2},"apk":{"max":5},"unitVolume":{"max":300},"sortOrder":{"key":"category","order":"desc"},"includeDead":true}'
wrk.headers["Content-Type"] = "application/json"