-- Represent a larger search, sorted by APK

wrk.method = "POST"
wrk.body = '{"name":"e","category":["Vin","Sprit"],"alcvol":{"min":2},"apk":{"max":5},"unitVolume":{"max":300},"sortOrder":{"key":"apk","order":"asc"},"includeDead":true}'
wrk.headers["Content-Type"] = "application/json"