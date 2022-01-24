# test/db

To recreate `migrations/init.js` and `seeds/init.js`, simply open the new `sqlite` test DB and run the following commands

```
sqlite> .output ./test_db_dump.sql
sqlite> .dump
sqlite> .exit
```

Now the contents of `test_db_dump.sql` can be copy-pasted into the calls to `knex.raw`. Sketchy, but works.

Note that `INSERTS` should be in `seeds/`, and creation of tables in `migrations/`

Note that `exports.down` isn't really needed, since we just run test DBs in memory.

## migrations/

`migrations/` contain a single script that basically runs a copy/paste of `init.sql` in the `ginger51011/bsscraper` repo.
This is to initialize a new copy of that DB.

## seeds/

`seeds/` contains a single script to dump data from `test_db.sqlite` 