# apkapi-ts - APKollen.se backend

_For Swedish version, see [README.swe.md](./README.swe.md)_

This is the repo for [APKollen.se](https://apkollen.se)s API, `apkapi3`. Merge requests and issues welcome!

This API is for providing a price comparison service for the mysterious BorderShop, the premiere way of Scanian students
to buy cheap boose. With APKollen.se, planning your vacation to north Germany becomes easy!

## Running with pm2

`pm2` is intended to be used when running this API, but others can be used.

```
npm run prisma:generate
npm run build

# To run with telemetry
pm2 start build/index.js -- -r ./telemetry/tracer.js
```