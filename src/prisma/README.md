# Prisma schemas

## VIEWS and Prisma

Due to current limitations to `prisma`, SQL VIEWS cannot be used together with `prisma migrate`. Make sure
not to delete manually added views by running `npx prisma db pull`!