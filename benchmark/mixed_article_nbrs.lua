-- Simple script sending body with list of valid and invalid (i.e.
-- exists or does not exist in testing DB) articleNbrs

wrk.method = "POST"
wrk.body = '{"articleNbrs":[2110205,2033433,69],"includeDead":true}'
wrk.headers["Content-Type"] = "application/json"