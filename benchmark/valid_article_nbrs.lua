-- Simple script sending body with list of valid (i.e.
-- exists in testing DB) articleNbrs

wrk.method = "POST"
wrk.body = '{"articleNbrs":[2110205,2033433,2043913],"includeDead":true}'
wrk.headers["Content-Type"] = "application/json"