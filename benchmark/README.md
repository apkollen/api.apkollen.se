# Benchmarking

These are Lua scripts intended to be used with `wrk` to measure performance.

Simply run (for example)

```
wrk -t4 -c250 -d30s <url> -s <script>.lua
```

to run 4 threads for 30 seconds, keeping 250 HTTP connections open